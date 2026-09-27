const { AppError } = require("./core");

const SEVERITY = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL"
});

const SENSITIVE_KEY = /(password|passcode|token|secret|authorization|cookie|aadhaar|credential|bank|account|card|cvv|otp|private.?key)/i;

function sanitizeValue(value, depth = 0) {
  if (depth > 3) return "[Truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeValue(item, depth + 1)
    ]));
  }
  return String(value);
}

function sanitizeRequest(req) {
  return sanitizeValue({
    params: req.params,
    query: req.query,
    body: req.body
  });
}

function databaseCode(error) {
  return ["ER_ACCESS_DENIED_ERROR", "ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "ETIMEDOUT", "ECONNRESET", "ER_CON_COUNT_ERROR"].includes(error?.code);
}

function classifyError(error) {
  if (error instanceof AppError) {
    return {
      status: Number(error.status) || 500,
      code: error.code || "APP_ERROR",
      severity: error.severity || (error.status >= 500 ? SEVERITY.ERROR : SEVERITY.WARNING),
      module: error.module || "api",
      message: error.message,
      expose: error.expose !== false,
      details: error.details,
      context: error.context || {}
    };
  }

  if (databaseCode(error)) {
    return {
      status: 503,
      code: "DATABASE_UNAVAILABLE",
      severity: SEVERITY.CRITICAL,
      module: "database",
      message: "Database operation failed",
      expose: false,
      details: undefined,
      context: {}
    };
  }

  if (error?.code === "ENOENT" || error?.code === "EACCES" || error?.code === "EPERM" || error?.code === "EBUSY" || error?.code === "ENOSPC") {
    return {
      status: error.code === "ENOENT" ? 404 : 503,
      code: `FILE_${error.code}`,
      severity: error.code === "ENOENT" ? SEVERITY.WARNING : SEVERITY.ERROR,
      module: "filesystem",
      message: error.code === "ENOENT" ? "File or folder not found" : "File operation failed",
      expose: false,
      details: undefined,
      context: {}
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    severity: SEVERITY.ERROR,
    module: "api",
    message: "Internal server error",
    expose: false,
    details: undefined,
    context: {}
  };
}

function inferModule(endpoint, fallback = "api") {
  const path = String(endpoint || "").toLowerCase();
  if (path.includes("/auth")) return "authentication";
  if (path.includes("/customers")) return "customer-master";
  if (path.includes("/jobs")) return "job-master";
  if (path.includes("/users")) return "users";
  if (path.includes("/roles")) return "roles";
  if (path.includes("/retention")) return "retention";
  if (path.includes("/scheduler")) return "scheduler";
  if (path.includes("/dashboard")) return "dashboard";
  if (path.includes("/reports")) return "reports";
  if (path.includes("/errorlogs") || path.includes("/error-logs")) return "error-logging";
  return fallback;
}

function toAppError(error, options = {}) {
  if (error instanceof AppError) return error;
  const classified = classifyError(error);
  return new AppError(
    classified.status,
    classified.message,
    classified.code,
    classified.details,
    {
      module: options.module || classified.module,
      severity: options.severity || classified.severity,
      expose: classified.expose,
      context: options.context || classified.context
    }
  );
}

module.exports = { SEVERITY, sanitizeValue, sanitizeRequest, classifyError, inferModule, toAppError };
