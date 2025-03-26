# @very-coffee/hello

A simple, type-safe logger for TypeScript applications.

## Install

```bash
npm install @very-coffee/hello
# or
bun add @very-coffee/hello
```

## Usage

```typescript
import { helloInnit } from "@very-coffee/hello";

// Create a logger with namespaces and log levels
const hello = helloInnit(
  ["app", "api", "db"] as const, // namespaces
  ["info", "warn", "error"] as const // log levels
);

// Log messages
hello.app.info("Starting application");
hello.db.error("Database error", { code: 500 });
hello.api.warn("Rate limit reached", { userId: 123 });
```

## Control Log Output

Use the `DEBUG` environment variable to control which logs appear:

```bash
# Show all logs
DEBUG=* node app.js

# Show only app logs
DEBUG=app:* node app.js

# Show specific namespace:level combinations
DEBUG=app:info,db:error node app.js
```

## License

MIT
