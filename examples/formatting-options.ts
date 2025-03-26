import { helloInnit } from "../src/index";

// Define namespaces and log levels
const namespaces = ["server"] as const;
const levels = ["info", "error"] as const;

console.log("\n=== JSON Formatted Logs (prettyPrint: false) ===");
const jsonLogger = helloInnit(namespaces, levels, { prettyPrint: false });
jsonLogger.server.info("This is a JSON formatted log");
jsonLogger.server.error("This is a JSON error log", { code: 500 });

console.log("\n=== Pretty Printed Logs (prettyPrint: true) ===");
const prettyLogger = helloInnit(namespaces, levels, { prettyPrint: true });
prettyLogger.server.info("This is a pretty-printed log");
prettyLogger.server.error("This is a pretty-printed error log", { code: 500 });

console.log("\n=== Default Logs (prettyPrint defaults based on NODE_ENV) ===");
console.log(
  `Current NODE_ENV: ${process.env.NODE_ENV || "not set (development)"}`
);
const defaultLogger = helloInnit(namespaces, levels);
defaultLogger.server.info("This uses the default formatting based on NODE_ENV");
defaultLogger.server.error("Error with default formatting", { code: 500 });

console.log("\nNote: Set NODE_ENV=production to see how the default changes");
