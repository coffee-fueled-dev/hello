# Hello

A type-safe, structured logger built on [Pino](https://github.com/pinojs/pino) with support for the familiar DEBUG environment variable format.

## Key Features

- **Namespace-based logging** - Organize logs by component or feature
- **DEBUG env var support** - Use the same patterns as the debug package (`DEBUG=app:*,db:error`)
- **Type-safe API** - Full TypeScript support with strongly typed namespaces and levels
- **High performance** - Built on Pino for excellent performance
- **Structured logging** - JSON output for production, pretty output for development
- **Runtime compatibility** - Works with Node.js and Bun
- **Configurable formatting** - Choose between pretty-printed or JSON logs

## Installation

```bash
npm install @bloom-us/hello
```

## Quick Start

```typescript
import { helloInnit } from "@bloom-us/hello";

// Define namespaces and levels with const assertions for type safety
const namespaces = ["app", "api", "db"] as const;
const levels = ["info", "warn", "error", "debug"] as const;

// Create logger
const hello = helloInnit(namespaces, levels);

// Use loggers
hello.app.info("Application starting");
hello.db.error("Database connection failed", { retryCount: 3 });

// Mix string and object logging
hello.api.info({ userId: 123, method: "GET" }, "User request received");
```

## Controlling Log Output

Hello offers two ways to control which logs are shown:

### 1. DEBUG Environment Variable

Same format as the debug package, but extended for levels:

```bash
# Enable all logs from the app namespace
DEBUG=app:* node your-app.js

# Enable specific namespace:level combinations
DEBUG=app:info,db:error node your-app.js

# Enable everything except db namespace
DEBUG=*,-db node your-app.js
```

### 2. LOG_LEVEL Environment Variable

Standard Pino log level filtering:

```bash
# Only show error logs and above
LOG_LEVEL=error node your-app.js

# Show all logs including debug
LOG_LEVEL=debug node your-app.js
```

## Advanced Usage

### Log Formatting

By default, Hello uses pretty-printed logs in development and JSON logs in production. You can override this with the `prettyPrint` option:

```typescript
// Force JSON logs even in development
const jsonLogger = helloInnit(namespaces, levels, { prettyPrint: false });

// Force pretty-printed logs even in production
const prettyLogger = helloInnit(namespaces, levels, { prettyPrint: true });
```

### Custom Pino Options

```typescript
import { helloInnit } from "@bloom-us/hello";

// Pass any Pino options as the third argument
const hello = helloInnit(["app", "api"] as const, ["info", "error"] as const, {
  // Any Pino options here
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["password", "cookie"],
  // Custom transport for production
  transport:
    process.env.NODE_ENV === "production"
      ? { target: "pino/file", options: { destination: "/var/log/app.log" } }
      : undefined,
});
```

### Access to Pino

The package exports Pino so you can use it directly:

```typescript
import { pino, helloInnit } from "@bloom-us/hello";

// Use Pino directly if needed
const customLogger = pino({ level: "trace" });
```

## License

MIT
