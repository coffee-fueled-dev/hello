import { helloInnit } from "../src/index";

// Define namespaces and log levels
const namespaces = ["server", "api", "db"] as const;
const levels = ["info", "warn", "error", "debug"] as const;

// You can control logging through environment variables:
// 1. DEBUG - For selective namespace:level control
//    Examples:
//    - DEBUG=server:* (all server levels)
//    - DEBUG=server:info,db:error (specific namespace:level combinations)
//    - DEBUG=*,-db (everything except db namespace)
//
// 2. LOG_LEVEL - Sets the minimum log level threshold
//    Examples:
//    - LOG_LEVEL=info (shows info and more severe: info, warn, error)
//    - LOG_LEVEL=error (only shows errors)

// Create the logger
console.log("Creating logger...");
const hello = helloInnit(namespaces, levels);

// Show which loggers are enabled based on current DEBUG and LOG_LEVEL settings
console.log(
  "\nEnabled loggers based on DEBUG=" +
    (process.env.DEBUG || "(none)") +
    " and LOG_LEVEL=" +
    (process.env.LOG_LEVEL || "info (default)")
);
console.log("-------------------------------------------------------");
for (const ns of namespaces) {
  for (const level of levels) {
    console.log(
      `${ns}:${level} - ${hello[ns][level].enabled ? "enabled" : "disabled"}`
    );
  }
}

// Example usage
console.log("\nSending log messages (only enabled ones will appear):");
console.log("-------------------------------------------------------");

// Server logs
hello.server.info("Server starting on port 3000");
hello.server.debug("Debug mode enabled");
hello.server.warn("Running low on memory");
hello.server.error("Failed to connect to database", { retryCount: 3 });

// API logs
hello.api.info("API request received", { path: "/users", method: "GET" });
hello.api.debug("Request headers", {
  headers: { "content-type": "application/json" },
});

// DB logs
hello.db.info("Connected to database");
hello.db.debug("Executing query", { sql: "SELECT * FROM users" });
hello.db.error("Query failed", new Error("Timeout"));

// You can also log objects directly
hello.server.info({ event: "startup", duration: 235 });

console.log(
  "\nNote: If you don't see logs above, try setting DEBUG or LOG_LEVEL"
);
console.log(
  "For example: DEBUG=server:info,db:error node examples/pino-hello.js"
);
console.log("Or: LOG_LEVEL=debug node examples/pino-hello.js");
