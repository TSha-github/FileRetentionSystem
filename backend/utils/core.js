const HTTP_STATUS = Object.freeze({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

class AppError extends Error {
  constructor(status, message, code = "APP_ERROR", details = undefined, options = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.module = options.module || null;
    this.severity = options.severity || null;
    this.expose = options.expose !== false;
    this.context = options.context || {};
    Error.captureStackTrace?.(this, AppError);
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function ok(res, data, status = 200, meta = undefined) {
  const body = { data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function created(res, data, meta = undefined) {
  return ok(res, data, 201, meta);
}

function pageParams(req) {
  const page = Math.max(Number.parseInt(req.query.page || "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize || "25", 10) || 25, 1), 100);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function pageMeta(page, pageSize, total) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

function requireString(value, field, maxLength = 255) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `${field} is required`, "VALIDATION_ERROR", undefined, { module: "validation" });
  }
  if (value.trim().length > maxLength) {
    throw new AppError(422, `${field} must be at most ${maxLength} characters`, "VALIDATION_ERROR", undefined, { module: "validation" });
  }
  return value.trim();
}

function optionalString(value, field, maxLength = 1000) {
  if (value === undefined || value === null || value === "") return null;
  return requireString(String(value), field, maxLength);
}

function integer(value, field, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AppError(422, `${field} must be an integer between ${min} and ${max}`, "VALIDATION_ERROR", undefined, { module: "validation" });
  }
  return parsed;
}

function booleanValue(value, field, required = true) {
  if ((value === undefined || value === null) && !required) return null;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "Active" || value === "Enabled") return true;
  if (value === 0 || value === "0" || value === "false" || value === "Inactive" || value === "Disabled") return false;
  throw new AppError(422, `${field} must be boolean`, "VALIDATION_ERROR", undefined, { module: "validation" });
}

function safeOrder(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = {
  HTTP_STATUS,
  AppError,
  asyncHandler,
  ok,
  created,
  pageParams,
  pageMeta,
  requireString,
  optionalString,
  integer,
  booleanValue,
  safeOrder
};
