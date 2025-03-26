import pino from "pino";

// Type for multi-namespace logger
export type Hello<N extends readonly string[], E extends readonly string[]> = {
  [K in N[number]]: {
    [L in E[number]]: LogFunction;
  };
};

// Function signature for the logger functions
export type LogFunction = {
  (message: string, ...args: any[]): void;
  (obj: object, msg?: string, ...args: any[]): void;
  enabled: boolean;
};

// Helper to create patterns with preserved literal types
export function createDebugPatterns<
  N extends readonly string[],
  E extends readonly string[]
>(namespaces: N, environments: E): string {
  return environments
    .flatMap((env) => namespaces.map((namespace) => `${namespace}:${env}`))
    .join(",");
}

// Parsed result from formatting a message
interface FormattedResult {
  message: string;
  unusedArgs: any[];
}

// Format placeholders in the message similar to debug package
function formatMessage(message: string, args: any[]): FormattedResult {
  let formattedMessage = message;
  let argIndex = 0;

  // Handle %s, %d, %i, %f, %j, %o, %O placeholders
  formattedMessage = formattedMessage.replace(/%[sdifjoO]/g, (match) => {
    if (argIndex >= args.length) {
      return match;
    }

    const arg = args[argIndex++];

    switch (match) {
      case "%s":
        return String(arg);
      case "%d":
      case "%i":
        return parseInt(arg, 10).toString();
      case "%f":
        return parseFloat(arg).toString();
      case "%j":
      case "%o":
      case "%O":
        // For objects, don't include in string - Pino handles them separately
        return typeof arg === "object" ? "[Object]" : String(arg);
      default:
        return match;
    }
  });

  // Return any unused args
  return { message: formattedMessage, unusedArgs: args.slice(argIndex) };
}

/**
 * Parse DEBUG environment variable similar to the debug package
 *
 * @param namespaces Array of valid namespaces
 * @param levels Array of valid log levels
 */
function parseDebugEnvVar<
  N extends readonly string[],
  E extends readonly string[]
>(namespaces: N, levels: E): Record<string, Set<string | "*">> {
  const debug = process.env.DEBUG || "";
  const result: Record<string, Set<string | "*">> = {};

  // Initialize all namespaces as disabled
  namespaces.forEach((ns) => {
    result[ns] = new Set();
  });

  if (debug === "*") {
    // Enable all namespaces and levels
    namespaces.forEach((ns) => {
      result[ns] = new Set(["*"]);
    });
    return result;
  }

  const patterns = debug
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // Process inclusions first
  const inclusions = patterns.filter((p) => !p.startsWith("-"));
  inclusions.forEach((pattern) => {
    // Handle namespace:level format
    const [ns, level] = pattern.split(":");

    if (!ns) return;

    if (ns === "*") {
      // Enable all namespaces
      namespaces.forEach((namespace) => {
        if (level) {
          if (level === "*" || levels.includes(level as any)) {
            result[namespace].add(level as string | "*");
          }
        } else {
          result[namespace] = new Set(["*"]); // All levels
        }
      });
      return;
    }

    if (namespaces.includes(ns as any)) {
      if (level) {
        if (level === "*" || levels.includes(level as any)) {
          result[ns].add(level as string | "*");
        }
      } else {
        result[ns] = new Set(["*"]); // All levels for this namespace
      }
    }
  });

  // Process exclusions last to override any inclusions
  const exclusions = patterns.filter((p) => p.startsWith("-"));
  exclusions.forEach((pattern) => {
    // Remove the leading "-"
    const ns = pattern.substring(1).split(":")[0]; // Ignore any level part for now

    if (!ns) return;

    if (namespaces.includes(ns as any)) {
      // Disable this namespace - overrides any previous inclusion
      result[ns] = new Set();
    }
  });

  return result;
}

// Check if a namespace and level are enabled based on DEBUG env var
function isEnabled<N extends readonly string[], E extends readonly string[]>(
  enabledMap: Record<string, Set<string | "*">>,
  namespace: string,
  level: string
): boolean {
  const enabledLevels = enabledMap[namespace];
  if (!enabledLevels) return false;

  // If enabledLevels includes '*', all levels are enabled
  if (enabledLevels.has("*")) return true;

  // If enabledLevels is empty, nothing is enabled
  if (enabledLevels.size === 0) return false;

  // Check if this specific level is enabled
  return enabledLevels.has(level);
}

// Map from level strings to Pino log levels
const levelToPinoLevel: Record<string, pino.LevelWithSilent> = {
  fatal: "fatal",
  error: "error",
  warn: "warn",
  info: "info",
  debug: "debug",
  trace: "trace",
};

// Factory function to create the logger
export const helloInnit = <
  N extends readonly string[],
  E extends readonly string[]
>(
  namespaces: N,
  levels: E,
  // Custom options for pino
  options: pino.LoggerOptions & {
    logger?: any;
    prettyPrint?: boolean;
  } = {}
): Hello<N, E> => {
  // Parse DEBUG environment variable
  const enabledNamespacesMap = parseDebugEnvVar(namespaces, levels);

  // Determine the minimum log level for Pino
  const getMinLogLevel = (): pino.LevelWithSilent => {
    const configuredLevel = process.env.LOG_LEVEL as
      | pino.LevelWithSilent
      | undefined;
    if (configuredLevel && configuredLevel in levelToPinoLevel) {
      return configuredLevel;
    }

    // If any namespace:level is enabled via DEBUG, ensure Pino's level is set low enough
    let minLevel: pino.LevelWithSilent = "info"; // Default
    let found = false;

    // Set of all valid log levels in order of increasing verbosity
    const validLevels: pino.LevelWithSilent[] = [
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
    ];

    // Find the most verbose level enabled
    for (const namespace of namespaces) {
      const enabledLevels = enabledNamespacesMap[namespace];

      // If any namespace has * enabled, use the most verbose level
      if (enabledLevels.has("*")) {
        return "trace";
      }

      // Check specific levels
      for (const level of enabledLevels) {
        if (level !== "*" && level in levelToPinoLevel) {
          const levelIdx = validLevels.indexOf(levelToPinoLevel[level]);
          const minLevelIdx = validLevels.indexOf(minLevel);

          if (levelIdx > minLevelIdx) {
            minLevel = levelToPinoLevel[level];
            found = true;
          }
        }
      }
    }

    return found ? minLevel : "info";
  };

  // Set up default options
  const defaultOptions: pino.LoggerOptions = {
    level: getMinLogLevel(),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  };

  // Use pretty printing if requested (enabled by default in development)
  const shouldUsePrettyPrint =
    options.prettyPrint !== undefined
      ? options.prettyPrint
      : process.env.NODE_ENV !== "production";

  // Transport config for non-test environments
  if (process.env.NODE_ENV !== "test" && shouldUsePrettyPrint) {
    // Use pino-pretty for nice output
    defaultOptions.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        messageFormat: "{namespace} {environment} - {msg}",
      },
    };
  }

  // Apply user options (except our custom options)
  const { prettyPrint, ...pinoOptions } = options;
  const finalOptions = {
    ...defaultOptions,
    ...pinoOptions,
  };

  // Create base logger - using provided logger if available (for testing)
  const baseLogger = options.logger || pino(finalOptions);

  // Create result object
  const hello = {} as Hello<N, E>;

  // Build the logger structure
  for (const namespace of namespaces) {
    const nsLogger = baseLogger.child({ namespace });
    const envMap = {} as { [key: string]: LogFunction };

    for (const level of levels) {
      // Map level to a Pino log level if it matches
      const pinoLevel = levelToPinoLevel[level as string] || "info";
      const envLogger = nsLogger.child({ environment: level });

      // Create a log function with the proper namespace+level context
      const logFn = function (messageOrObj: string | object, ...args: any[]) {
        // Skip logging if this namespace+level is not enabled by DEBUG env var
        if (
          !isEnabled(enabledNamespacesMap, namespace, level as string) &&
          !envLogger.isLevelEnabled(pinoLevel)
        ) {
          return;
        }

        // Handle both string and object formats
        if (typeof messageOrObj === "string") {
          const result = formatMessage(messageOrObj, args);

          // Handle objects in args separately for better formatting
          if (result.unusedArgs.length > 0) {
            envLogger[pinoLevel]({ args: result.unusedArgs }, result.message);
          } else {
            envLogger[pinoLevel](result.message);
          }
        } else {
          // For object logging, use the object as is with an optional message
          const msg =
            args.length > 0 && typeof args[0] === "string"
              ? args[0]
              : undefined;

          if (msg) {
            const restArgs = args.slice(1);
            const result = msg
              ? formatMessage(msg, restArgs)
              : { message: undefined, unusedArgs: restArgs };

            if (result.unusedArgs.length > 0) {
              envLogger[pinoLevel](
                { ...messageOrObj, args: result.unusedArgs },
                result.message
              );
            } else {
              envLogger[pinoLevel](messageOrObj, result.message);
            }
          } else {
            envLogger[pinoLevel](messageOrObj);
          }
        }
      } as LogFunction;

      // Add enabled property for DEBUG compatibility
      Object.defineProperty(logFn, "enabled", {
        get: () => {
          return (
            isEnabled(enabledNamespacesMap, namespace, level as string) ||
            envLogger.isLevelEnabled(pinoLevel)
          );
        },
        set: (value: boolean) => {
          // Setting enabled=true is handled through DEBUG env var
          // This is just for compatibility
        },
        enumerable: true,
        configurable: true,
      });

      envMap[level as string] = logFn;
    }

    hello[namespace as N[number]] = envMap as any;
  }

  return hello;
};

// Re-export Pino for advanced configurations
export { pino };
