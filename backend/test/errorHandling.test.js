// const assert = require("assert");
// const { AppError } = require("../utils/core");
// const { classifyError, inferModule, sanitizeRequest } = require("../utils/errorClassification");

// const validation = new AppError(422, "retention_hours must be positive", "VALIDATION_ERROR");
// assert.deepStrictEqual(classifyError(validation), {
//   status: 422,
//   code: "VALIDATION_ERROR",
//   severity: "WARNING",
//   module: "api",
//   message: "retention_hours must be positive",
//   expose: true,
//   details: undefined,
//   context: {}
// });

// const database = new Error("ER_ACCESS_DENIED_ERROR: credentials must remain internal");
// database.code = "ER_ACCESS_DENIED_ERROR";
// const databaseClassified = classifyError(database);
// assert.strictEqual(databaseClassified.status, 503);
// assert.strictEqual(databaseClassified.code, "DATABASE_UNAVAILABLE");
// assert.strictEqual(databaseClassified.severity, "CRITICAL");
// assert.strictEqual(databaseClassified.message, "Database operation failed");
// assert.strictEqual(databaseClassified.expose, false);

// const fileError = new Error("permission denied at /secret/path");
// fileError.code = "EACCES";
// const fileClassified = classifyError(fileError);
// assert.strictEqual(fileClassified.status, 503);
// assert.strictEqual(fileClassified.code, "FILE_EACCES");
// assert.strictEqual(fileClassified.message, "File operation failed");
// assert.strictEqual(fileClassified.expose, false);

// assert.strictEqual(inferModule("/api/auth/login"), "authentication");
// assert.strictEqual(inferModule("/api/customers/42"), "customer-master");
// assert.strictEqual(inferModule("/api/retention/run"), "retention");
// assert.strictEqual(inferModule("/api/error-logs"), "error-logging");

// const request = {
//   params: { id: "42" },
//   query: { page: "1" },
//   body: { username: "admin", password: "do-not-store", token: "jwt", nested: { secret: "hidden" } }
// };
// const sanitized = sanitizeRequest(request);
// assert.strictEqual(sanitized.body.password, "[REDACTED]");
// assert.strictEqual(sanitized.body.token, "[REDACTED]");
// assert.strictEqual(sanitized.body.nested.secret, "[REDACTED]");
// assert.strictEqual(sanitized.body.username, "admin");

// console.log("errorHandling.test.js passed");
const assert = require("assert");

const { AppError } = require("../utils/core");

const {
  classifyError,
  inferModule,
  sanitizeRequest,
  sanitizeValue,
} = require("../utils/errorClassification");

// ==================================================
// HELPER
// ==================================================

function assertAppError({
  status,
  message,
  code,
  expectedSeverity = "WARNING",
}) {
  const error = new AppError(
    status,
    message,
    code
  );

  const result = classifyError(error);

  assert.strictEqual(
    result.status,
    status,
    `${code}: unexpected status`
  );

  assert.strictEqual(
    result.code,
    code,
    `${code}: unexpected code`
  );

  assert.strictEqual(
    result.message,
    message,
    `${code}: unexpected message`
  );

  assert.strictEqual(
    result.severity,
    expectedSeverity,
    `${code}: unexpected severity`
  );

  assert.strictEqual(
    result.expose,
    true,
    `${code}: expected safe AppError to be exposed`
  );
}

// ==================================================
// VALIDATION
// ==================================================

const validation = new AppError(
  422,
  "retention_hours must be positive",
  "VALIDATION_ERROR"
);

assert.deepStrictEqual(
  classifyError(validation),
  {
    status: 422,
    code: "VALIDATION_ERROR",
    severity: "WARNING",
    module: "api",
    message:
      "retention_hours must be positive",
    expose: true,
    details: undefined,
    context: {},
  }
);

// ==================================================
// AUTHENTICATION / AUTHORIZATION
// ==================================================

assertAppError({
  status: 401,
  message: "Authentication required",
  code: "AUTHENTICATION_REQUIRED",
});

assertAppError({
  status: 401,
  message: "Invalid or expired token",
  code: "INVALID_TOKEN",
});

assertAppError({
  status: 401,
  message: "Invalid username or password",
  code: "INVALID_CREDENTIALS",
});

assertAppError({
  status: 403,
  message: "User account is disabled",
  code: "USER_DISABLED",
});

assertAppError({
  status: 403,
  message:
    "Customer setup is not complete. Contact the administrator.",
  code: "CUSTOMER_ASSIGNMENT_REQUIRED",
});

assertAppError({
  status: 403,
  message:
    "Access denied. Insufficient permissions.",
  code: "FORBIDDEN",
});

assertAppError({
  status: 403,
  message:
    "Admin customer assignment is invalid",
  code: "INVALID_ADMIN_ASSIGNMENT",
});

assertAppError({
  status: 403,
  message: "User role is not allowed",
  code: "INVALID_ROLE",
});

// ==================================================
// USER MANAGEMENT BUSINESS ERRORS
// ==================================================

assertAppError({
  status: 409,
  message: "Username already exists.",
  code: "USERNAME_EXISTS",
});

assertAppError({
  status: 409,
  message:
    "The primary administrator cannot be deleted",
  code: "USER_PROTECTED",
});

// ==================================================
// CUSTOMER BUSINESS ERRORS
// ==================================================

assertAppError({
  status: 409,
  message: "Customer already exists.",
  code: "CUSTOMER_EXISTS",
});

assertAppError({
  status: 409,
  message:
    "Customer has jobs and cannot be deleted; disable it instead",
  code: "CUSTOMER_IN_USE",
});

assertAppError({
  status: 409,
  message:
    "Selected Customer User is already assigned to a customer.",
  code: "PENDING_USER_ALREADY_ASSIGNED",
});

assertAppError({
  status: 409,
  message:
    "Selected user is not a pending unassigned Customer User.",
  code: "PENDING_USER_INVALID",
});

// ==================================================
// ROLE PROTECTION
// ==================================================

assertAppError({
  status: 405,
  message:
    "Roles are fixed system roles and cannot be changed.",
  code: "FIXED_ROLES",
});

// ==================================================
// NOT FOUND
// ==================================================

assertAppError({
  status: 404,
  message: "Customer not found",
  code: "NOT_FOUND",
});

assertAppError({
  status: 404,
  message: "Route not found",
  code: "ROUTE_NOT_FOUND",
});

// ==================================================
// DATABASE FAILURE
// ==================================================

const database = new Error(
  "ER_ACCESS_DENIED_ERROR: credentials must remain internal"
);

database.code =
  "ER_ACCESS_DENIED_ERROR";

const databaseClassified =
  classifyError(database);

assert.strictEqual(
  databaseClassified.status,
  503
);

assert.strictEqual(
  databaseClassified.code,
  "DATABASE_UNAVAILABLE"
);

assert.strictEqual(
  databaseClassified.severity,
  "CRITICAL"
);

assert.strictEqual(
  databaseClassified.message,
  "Database operation failed"
);

assert.strictEqual(
  databaseClassified.expose,
  false
);

// ==================================================
// DATABASE CONNECTION REFUSED
// ==================================================

const connectionRefused =
  new Error("Database offline");

connectionRefused.code =
  "ECONNREFUSED";

const connectionResult =
  classifyError(connectionRefused);

assert.strictEqual(
  connectionResult.status,
  503
);

assert.strictEqual(
  connectionResult.code,
  "DATABASE_UNAVAILABLE"
);

assert.strictEqual(
  connectionResult.expose,
  false
);

// ==================================================
// FILE PERMISSION ERROR
// ==================================================

const permissionError = new Error(
  "permission denied at /secret/path"
);

permissionError.code = "EACCES";

const permissionClassified =
  classifyError(permissionError);

assert.strictEqual(
  permissionClassified.status,
  503
);

assert.strictEqual(
  permissionClassified.code,
  "FILE_EACCES"
);

assert.strictEqual(
  permissionClassified.message,
  "File operation failed"
);

assert.strictEqual(
  permissionClassified.expose,
  false
);

// ==================================================
// FILE NOT FOUND
// ==================================================

const missingFile =
  new Error("missing file");

missingFile.code = "ENOENT";

const missingFileResult =
  classifyError(missingFile);

assert.strictEqual(
  missingFileResult.status,
  404
);

assert.strictEqual(
  missingFileResult.code,
  "FILE_ENOENT"
);

assert.strictEqual(
  missingFileResult.severity,
  "WARNING"
);

assert.strictEqual(
  missingFileResult.message,
  "File or folder not found"
);

assert.strictEqual(
  missingFileResult.expose,
  false
);

// ==================================================
// LOCKED FILE
// ==================================================

const lockedFile =
  new Error("file is busy");

lockedFile.code = "EBUSY";

const lockedFileResult =
  classifyError(lockedFile);

assert.strictEqual(
  lockedFileResult.status,
  503
);

assert.strictEqual(
  lockedFileResult.code,
  "FILE_EBUSY"
);

assert.strictEqual(
  lockedFileResult.expose,
  false
);

// ==================================================
// DISK FULL
// ==================================================

const diskFull =
  new Error("no space");

diskFull.code = "ENOSPC";

const diskResult =
  classifyError(diskFull);

assert.strictEqual(
  diskResult.status,
  503
);

assert.strictEqual(
  diskResult.code,
  "FILE_ENOSPC"
);

// ==================================================
// UNKNOWN INTERNAL ERROR
// ==================================================

const unknown =
  new Error("Unexpected internal details");

const unknownResult =
  classifyError(unknown);

assert.strictEqual(
  unknownResult.status,
  500
);

assert.strictEqual(
  unknownResult.code,
  "INTERNAL_ERROR"
);

assert.strictEqual(
  unknownResult.severity,
  "ERROR"
);

assert.strictEqual(
  unknownResult.message,
  "Internal server error"
);

assert.strictEqual(
  unknownResult.expose,
  false
);

// ==================================================
// MODULE CLASSIFICATION
// ==================================================

assert.strictEqual(
  inferModule("/api/auth/login"),
  "authentication"
);

assert.strictEqual(
  inferModule("/api/customers/42"),
  "customer-master"
);

assert.strictEqual(
  inferModule("/api/jobs/8"),
  "job-master"
);

assert.strictEqual(
  inferModule("/api/users/5"),
  "users"
);

assert.strictEqual(
  inferModule("/api/roles"),
  "roles"
);

assert.strictEqual(
  inferModule("/api/retention/run"),
  "retention"
);

assert.strictEqual(
  inferModule("/api/scheduler-logs"),
  "scheduler"
);

assert.strictEqual(
  inferModule("/api/dashboard"),
  "dashboard"
);

assert.strictEqual(
  inferModule("/api/reports"),
  "reports"
);

assert.strictEqual(
  inferModule("/api/error-logs"),
  "error-logging"
);

// ==================================================
// REQUEST SANITIZATION
// ==================================================

const request = {
  params: {
    id: "42",
  },

  query: {
    page: "1",
  },

  body: {
    username: "admin",

    password: "do-not-store",

    current_password:
      "old-secret-password",

    new_password:
      "new-secret-password",

    confirm_password:
      "new-secret-password",

    token: "jwt",

    authorization:
      "Bearer abc.def.ghi",

    jwt_secret:
      "super-secret",

    nested: {
      secret: "hidden",

      card_number:
        "4111111111111111",

      safe_value:
        "safe",
    },
  },
};

const sanitized =
  sanitizeRequest(request);

assert.strictEqual(
  sanitized.body.password,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.current_password,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.new_password,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.confirm_password,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.token,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.authorization,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.jwt_secret,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.nested.secret,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.nested.card_number,
  "[REDACTED]"
);

assert.strictEqual(
  sanitized.body.nested.safe_value,
  "safe"
);

assert.strictEqual(
  sanitized.body.username,
  "admin"
);

// ==================================================
// DIRECT SANITIZATION
// This also protects createErrorLog()
// ==================================================

const directlySanitized =
  sanitizeValue({
    username: "hdfc_user",

    password: "Hdfc@2026!",

    token: "abc",

    nested: {
      secret: "should-not-be-stored",
      description: "safe",
    },
  });

assert.strictEqual(
  directlySanitized.password,
  "[REDACTED]"
);

assert.strictEqual(
  directlySanitized.token,
  "[REDACTED]"
);

assert.strictEqual(
  directlySanitized.nested.secret,
  "[REDACTED]"
);

assert.strictEqual(
  directlySanitized.nested.description,
  "safe"
);

assert.strictEqual(
  directlySanitized.username,
  "hdfc_user"
);

console.log(
  "errorHandling.test.js passed"
);