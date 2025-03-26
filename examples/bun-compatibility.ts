import { helloInnit } from "../src/index";

// Define namespaces and log levels
const namespaces = ["server", "api", "db"] as const;
const levels = ["info", "warn", "error", "debug"] as const;

console.log("Creating logger in Bun environment...");
const hello = helloInnit(namespaces, levels);

// Show which loggers are enabled
console.log(
  "\nEnabled loggers based on DEBUG=" +
    (process.env.DEBUG || "(none)") +
    " and LOG_LEVEL=" +
    (process.env.LOG_LEVEL || "info (default)")
);
console.log("-------------------------------------------------------");

// Test some logging
hello.server.info("Server starting on port 3000");
hello.db.error("Database connection failed", { retryCount: 3 });

console.log("\nLogging successful in Bun environment!");
