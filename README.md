# @very-coffee/hello

A type-safe utility for creating structured logging across multiple namespaces and environments in TypeScript applications.

## Features

- Type-safe logging with namespace and environment level support
- DEBUG environment variable support (similar to debug package)
- Pretty printing in development
- File logging support
- Next.js compatibility mode
- Configurable log levels
- Object and formatted string logging

## Installation

```bash
npm install @very-coffee/hello
```

## Basic Usage

```typescript
import { helloInnit } from "@very-coffee/hello";

const namespaces = ["app", "api"] as const;
const levels = ["info", "error", "debug"] as const;

const hello = helloInnit(namespaces, levels);

// Log messages
hello.app.info("Server started on port %d", 3000);
hello.api.error({ error: new Error("Failed") }, "Request failed");
```

## Configuration

### Basic Options

```typescript
const hello = helloInnit(namespaces, levels, {
  prettyPrint: true, // Enable pretty printing (default: true in development)
  level: "debug", // Set minimum log level
});
```

### File Logging

```typescript
const hello = helloInnit(namespaces, levels, {
  file: {
    path: "./logs/app.log", // Path to log file
    level: "info", // Optional: minimum level for file logging
    prettyPrint: true, // Optional: enable pretty printing in file
  },
});
```

### Next.js Compatibility

For Next.js applications, especially in edge runtime environments where worker threads aren't supported:

```typescript
const hello = helloInnit(namespaces, levels, {
  disableWorkers: true, // Disable worker threads for Next.js compatibility
  prettyPrint: true,
});
```

### Combined Configuration

You can combine different options:

```typescript
const hello = helloInnit(namespaces, levels, {
  disableWorkers: true,
  prettyPrint: true,
  file: {
    path: "./logs/app.log",
    level: "info",
    prettyPrint: true,
  },
});
```

## Environment Variables

### DEBUG

Control which namespaces and levels are enabled:

```bash
# Enable specific namespace and level
DEBUG=app:info

# Enable all levels for a namespace
DEBUG=app:*

# Enable specific level across all namespaces
DEBUG=*:error

# Enable everything
DEBUG=*

# Enable multiple patterns
DEBUG=app:info,api:error

# Disable specific namespaces
DEBUG=*,-api
```

### LOG_LEVEL

Set the minimum log level:

```bash
LOG_LEVEL=debug  # Will show debug and above
LOG_LEVEL=info   # Will show info and above
LOG_LEVEL=error  # Will show only error
```

### NODE_ENV

Controls default pretty printing:

- `development`: Pretty printing enabled by default
- `production`: Pretty printing disabled by default
- `test`: Transport disabled by default

## Advanced Usage

### Custom Pino Configuration

You can pass any Pino options directly:

```typescript
import { helloInnit, pino } from "@very-coffee/hello";

const hello = helloInnit(namespaces, levels, {
  // Any valid pino options
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

### Object Logging

```typescript
// Log with context object
hello.app.info({ userId: "123" }, "User logged in");

// Log object directly
hello.app.debug({
  event: "cache_miss",
  key: "user_123",
});
```

### Format Specifiers

Supports printf-style format specifiers:

- `%s` - String
- `%d` or `%i` - Integer
- `%f` - Float
- `%o` or `%O` - Object
- `%j` - JSON

Example:

```typescript
hello.app.info("User %s logged in from %s", username, ip);
```

## License

MIT
