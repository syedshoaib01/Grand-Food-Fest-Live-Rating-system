/**
 * Structured Logger for Grand Food Fest Live Rating System
 * Provides structured JSON logging in production and formatted console logs in dev.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

const isProd = process.env.NODE_ENV === "production";

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: any) {
  const timestamp = new Date().toISOString();
  const entry: Record<string, any> = {
    timestamp,
    level,
    message,
    ...context,
  };

  if (error) {
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: isProd ? undefined : error.stack,
      };
    } else {
      entry.error = error;
    }
  }

  if (isProd) {
    // Production structured JSON output for CloudWatch / Datadog / Logtail
    const json = JSON.stringify(entry);
    if (level === "error") {
      console.error(json);
    } else if (level === "warn") {
      console.warn(json);
    } else {
      console.log(json);
    }
  } else {
    // Development readable format
    const prefix = `[${timestamp.slice(11, 19)}] [${level.toUpperCase()}]`;
    const contextStr = context && Object.keys(context).length > 0 ? JSON.stringify(context) : "";
    if (level === "error") {
      console.error(`${prefix} ${message}`, contextStr, error || "");
    } else if (level === "warn") {
      console.warn(`${prefix} ${message}`, contextStr);
    } else if (level === "info") {
      console.log(`${prefix} ${message}`, contextStr);
    } else {
      console.debug(`${prefix} ${message}`, contextStr);
    }
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.DEBUG || !isProd) {
      formatLog("debug", message, context);
    }
  },
  info: (message: string, context?: LogContext) => {
    formatLog("info", message, context);
  },
  warn: (message: string, context?: LogContext) => {
    formatLog("warn", message, context);
  },
  error: (message: string, error?: any, context?: LogContext) => {
    formatLog("error", message, context, error);
  },
};

export default logger;
