const crypto = require("crypto");
const { AppError } = require("../utils/core");
const { classifyError, inferModule, sanitizeRequest } = require("../utils/errorClassification");
const { createErrorLog } = require("../services/logServices");

function requestContext(req, res, next) {
  req.requestId = req.get("x-request-id") || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  const started = Date.now();

  res.on("finish", () => {
    if (process.env.NODE_ENV !== "test") {
      console.log(JSON.stringify({
        type: "request",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - started
      }));
    }
  });

  next();
}

function notFound(req, res, next) {
  next(new AppError(404, "Route not found", "ROUTE_NOT_FOUND", undefined, { module: "routing" }));
}

async function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const classified = classifyError(error);
  const internalMessage = error?.message || classified.message;
  const module = inferModule(req.originalUrl, classified.module);
  const logData = {
    error_type: classified.code,
    error_message: internalMessage,
    status_code: classified.status,
    http_method: req.method,
    api_endpoint: req.originalUrl,
    user_id: req.user?.user_id || null,
    username: req.user?.username || null,
    ip_address: req.ip || req.socket?.remoteAddress || null,
    stack_trace: error?.stack || null,
    request_data: sanitizeRequest(req),
    module,
    severity: classified.severity,
    request_id: req.requestId || null
  };

  try {
    await createErrorLog(logData);
  } catch (logError) {
    console.error(JSON.stringify({ type: "error-log-failure", requestId: req.requestId, message: logError.message, stack: logError.stack }));
  }

  console.error(JSON.stringify({
    type: "error",
    requestId: req.requestId,
    method: req.method,
    endpoint: req.originalUrl,
    status: classified.status,
    code: classified.code,
    severity: classified.severity,
    module,
    message: internalMessage,
    stack: error?.stack
  }));

  const safeMessage = classified.expose && classified.status < 500 ? classified.message : "Something went wrong. Please try again later.";
  const body = {
    success: false,
    message: safeMessage,
    error: {
      code: classified.code,
      message: safeMessage,
      requestId: req.requestId
    }
  };

  if (classified.expose && classified.status < 500 && classified.details) body.error.details = classified.details;
  return res.status(classified.status).json(body);
}

function handleProcessError(error, source) {
  console.error(JSON.stringify({ type: "process-error", source, message: error?.message, stack: error?.stack }));
}

module.exports = { requestContext, notFound, errorHandler, handleProcessError };