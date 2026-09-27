// const db = require("../config/db");
// const { pageMeta } = require("../utils/core");

// function scopedCustomer(user, requested) {
//   return user?.role === "Admin" ? (requested || null) : Number(user.customer_id);
// }

// async function listDeleteLogs({ page, pageSize, offset, user, customerId, jobId, status, from, to }) {
//   const scoped = scopedCustomer(user, customerId);
//   const where = ["(? IS NULL OR d.customer_id = ?)", "(? IS NULL OR d.job_id = ?)", "(? IS NULL OR d.status = ?)", "(? IS NULL OR d.deleted_at >= ?)", "(? IS NULL OR d.deleted_at <= ?)"];
//   const values = [scoped, scoped, jobId || null, jobId || null, status || null, status || null, from || null, from || null, to || null, to || null];
//   const count = await db.query(`SELECT COUNT(*) AS total FROM DELETE_LOGS d WHERE ${where.join(" AND ")}`, values);
//   const rows = await db.query(`SELECT d.delete_log_id, d.job_id, d.customer_id, c.customer_name, j.project_name, d.file_name, d.file_path, d.file_type, d.file_created_at, d.deleted_at, d.retention_hours, d.status FROM DELETE_LOGS d LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = d.customer_id LEFT JOIN JOB_MASTER j ON j.job_id = d.job_id WHERE ${where.join(" AND ")} ORDER BY d.deleted_at DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
//   return { rows, meta: pageMeta(page, pageSize, Number(count[0].total)) };
// }

// async function listErrorLogs({ page, pageSize, offset, user, jobId, severity, module, statusCode, from, to }) {
//   const customerId = user.role === "Admin" ? null : Number(user.customer_id);
//   const where = ["(? IS NULL OR e.job_id = ?)", "(? IS NULL OR e.severity = ?)", "(? IS NULL OR e.module = ?)", "(? IS NULL OR e.status_code = ?)", "(? IS NULL OR e.error_time >= ?)", "(? IS NULL OR e.error_time <= ?)", "(? IS NULL OR j.customer_id = ?)"];
//   const values = [jobId || null, jobId || null, severity || null, severity || null, module || null, module || null, statusCode || null, statusCode || null, from || null, from || null, to || null, to || null, customerId, customerId];
//   const count = await db.query(`SELECT COUNT(*) AS total FROM ERROR_LOGS e LEFT JOIN JOB_MASTER j ON j.job_id = e.job_id WHERE ${where.join(" AND ")}`, values);
//   const rows = await db.query(`SELECT e.error_id, e.error_id AS id, e.job_id, j.customer_id, c.customer_name, j.project_name, e.error_type, e.status_code, e.http_method, e.api_endpoint, e.user_id, e.username, e.ip_address, e.file_name, e.file_name AS file, e.file_path, e.file_path AS path, e.error_message, e.error_message AS message, e.module, e.severity, e.request_id, e.request_data, e.stack_trace, e.error_time, e.error_time AS time FROM ERROR_LOGS e LEFT JOIN JOB_MASTER j ON j.job_id = e.job_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id WHERE ${where.join(" AND ")} ORDER BY e.error_time DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
//   return { rows, meta: pageMeta(page, pageSize, Number(count[0].total)) };
// }

// async function listHistory({ page, pageSize, offset, user, jobId, action }) {
//   const customerId = user.role === "Admin" ? null : Number(user.customer_id);
//   const where = ["(? IS NULL OR h.job_id = ?)", "(? IS NULL OR h.action = ?)", "(? IS NULL OR j.customer_id = ?)"];
//   const values = [jobId || null, jobId || null, action || null, action || null, customerId, customerId];
//   const count = await db.query(`SELECT COUNT(*) AS total FROM JOB_STATUS_HISTORY h LEFT JOIN JOB_MASTER j ON j.job_id = h.job_id WHERE ${where.join(" AND ")}`, values);
//   const rows = await db.query(`SELECT h.history_id, h.job_id, j.customer_id, c.customer_name, j.project_name, h.action, h.reason, h.changed_by AS changed_by_id, u.username AS changed_by, h.changed_at FROM JOB_STATUS_HISTORY h LEFT JOIN JOB_MASTER j ON j.job_id = h.job_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id LEFT JOIN USERS u ON u.user_id = h.changed_by WHERE ${where.join(" AND ")} ORDER BY h.changed_at DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
//   return { rows, meta: pageMeta(page, pageSize, Number(count[0].total)) };
// }

// async function addHistory({ jobId, action, reason, changedBy }) {
//   const result = await db.query("INSERT INTO JOB_STATUS_HISTORY (job_id, action, reason, changed_by) VALUES (?, ?, ?, ?)", [jobId, action, reason || null, changedBy]);
//   return { history_id: result.insertId };
// }

// async function listSchedulerLogs({ page, pageSize, offset, user, status, from, to }) {
//   const customerId = user.role === "Admin" ? null : Number(user.customer_id);
//   const where = ["(? IS NULL OR s.status = ?)", "(? IS NULL OR s.start_time >= ?)", "(? IS NULL OR s.start_time <= ?)", "(? IS NULL OR j.customer_id = ?)"];
//   const values = [status || null, status || null, from || null, from || null, to || null, to || null, customerId, customerId];
//   const count = await db.query(`SELECT COUNT(*) AS total FROM SCHEDULER_LOGS s LEFT JOIN JOB_MASTER j ON j.job_id = s.job_id WHERE ${where.join(" AND ")}`, values);
//   const rows = await db.query(`SELECT s.scheduler_log_id, s.job_id, j.customer_id, c.customer_name, s.start_time, s.end_time, s.jobs_processed, s.files_deleted, s.errors_count, s.status FROM SCHEDULER_LOGS s LEFT JOIN JOB_MASTER j ON j.job_id = s.job_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id WHERE ${where.join(" AND ")} ORDER BY s.start_time DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
//   return { rows, meta: pageMeta(page, pageSize, Number(count[0].total)) };
// }

// async function createSchedulerLog(data) {
//   const result = await db.query("INSERT INTO SCHEDULER_LOGS (start_time, end_time, jobs_processed, job_id, files_deleted, errors_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.start_time || new Date(), data.end_time || null, data.jobs_processed || 0, data.job_id || null, data.files_deleted || 0, data.errors_count || 0, data.status || "RUNNING"]);
//   return result.insertId;
// }

// async function finishSchedulerLog(id, data) {
//   await db.query("UPDATE SCHEDULER_LOGS SET end_time = ?, jobs_processed = ?, files_deleted = ?, errors_count = ?, status = ? WHERE scheduler_log_id = ?", [new Date(), data.jobs_processed, data.files_deleted, data.errors_count, data.status, id]);
// }

// async function createErrorLog(data) {
//   const { sanitizeValue } = require("../utils/errorClassification");
//   const message = String(data.error_message || "Unknown error").slice(0, 10000);
//   const requestData = data.request_data == null ? null : JSON.stringify(data.request_data).slice(0, 20000);
//   try {
//     const result = await db.query("INSERT INTO ERROR_LOGS (job_id, file_name, file_path, error_message, error_type, status_code, http_method, api_endpoint, user_id, username, ip_address, stack_trace, request_data, module, severity, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [data.job_id || null, data.file_name || null, data.file_path || null, message, data.error_type || "INTERNAL_ERROR", data.status_code || 500, data.http_method || null, data.api_endpoint || null, data.user_id || null, data.username || null, data.ip_address || null, data.stack_trace || null, requestData, data.module || "api", data.severity || "ERROR", data.request_id || null]);
//     return result.insertId;
//   } catch (error) {
//     if (error.code === "ER_BAD_FIELD_ERROR" && data.job_id) {
//       const legacy = await db.query("INSERT INTO ERROR_LOGS (job_id, file_name, file_path, error_message) VALUES (?, ?, ?, ?)", [data.job_id, data.file_name || null, data.file_path || null, message]);
//       return legacy.insertId;
//     }
//     throw error;
//   }
// }

// module.exports = { listDeleteLogs, listErrorLogs, listHistory, addHistory, listSchedulerLogs, createSchedulerLog, finishSchedulerLog, createErrorLog };

const db = require("../config/db");
const { pageMeta } = require("../utils/core");
const { sanitizeValue } = require("../utils/errorClassification");

function scopedCustomer(user, requested) {
  return user?.role === "Admin"
    ? (requested || null)
    : Number(user.customer_id);
}

async function listDeleteLogs({
  page,
  pageSize,
  offset,
  user,
  customerId,
  jobId,
  status,
  from,
  to,
}) {
  const scoped = scopedCustomer(user, customerId);

  const where = [
    "(? IS NULL OR d.customer_id = ?)",
    "(? IS NULL OR d.job_id = ?)",
    "(? IS NULL OR d.status = ?)",
    "(? IS NULL OR d.deleted_at >= ?)",
    "(? IS NULL OR d.deleted_at <= ?)",
  ];

  const values = [
    scoped,
    scoped,
    jobId || null,
    jobId || null,
    status || null,
    status || null,
    from || null,
    from || null,
    to || null,
    to || null,
  ];

  const count = await db.query(
    `SELECT COUNT(*) AS total
     FROM DELETE_LOGS d
     WHERE ${where.join(" AND ")}`,
    values
  );

  const rows = await db.query(
    `SELECT
        d.delete_log_id,
        d.job_id,
        d.customer_id,
        c.customer_name,
        j.project_name,
        d.file_name,
        d.file_path,
        d.file_type,
        d.file_created_at,
        d.deleted_at,
        d.retention_hours,
        d.status
     FROM DELETE_LOGS d
     LEFT JOIN CUSTOMER_MASTER c
       ON c.customer_id = d.customer_id
     LEFT JOIN JOB_MASTER j
       ON j.job_id = d.job_id
     WHERE ${where.join(" AND ")}
     ORDER BY d.deleted_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    values
  );

  return {
    rows,
    meta: pageMeta(
      page,
      pageSize,
      Number(count[0].total)
    ),
  };
}

async function listErrorLogs({
  page,
  pageSize,
  offset,
  user,
  jobId,
  severity,
  module,
  statusCode,
  from,
  to,
}) {
  const customerId =
    user.role === "Admin"
      ? null
      : Number(user.customer_id);

  const where = [
    "(? IS NULL OR e.job_id = ?)",
    "(? IS NULL OR e.severity = ?)",
    "(? IS NULL OR e.module = ?)",
    "(? IS NULL OR e.status_code = ?)",
    "(? IS NULL OR e.error_time >= ?)",
    "(? IS NULL OR e.error_time <= ?)",
    "(? IS NULL OR j.customer_id = ?)",
  ];

  const values = [
    jobId || null,
    jobId || null,
    severity || null,
    severity || null,
    module || null,
    module || null,
    statusCode || null,
    statusCode || null,
    from || null,
    from || null,
    to || null,
    to || null,
    customerId,
    customerId,
  ];

  const count = await db.query(
    `SELECT COUNT(*) AS total
     FROM ERROR_LOGS e
     LEFT JOIN JOB_MASTER j
       ON j.job_id = e.job_id
     WHERE ${where.join(" AND ")}`,
    values
  );

  const rows = await db.query(
    `SELECT
        e.error_id,
        e.error_id AS id,
        e.job_id,
        j.customer_id,
        c.customer_name,
        j.project_name,
        e.error_type,
        e.status_code,
        e.http_method,
        e.api_endpoint,
        e.user_id,
        e.username,
        e.ip_address,
        e.file_name,
        e.file_name AS file,
        e.file_path,
        e.file_path AS path,
        e.error_message,
        e.error_message AS message,
        e.module,
        e.severity,
        e.request_id,
        e.request_data,
        e.stack_trace,
        e.error_time,
        e.error_time AS time
     FROM ERROR_LOGS e
     LEFT JOIN JOB_MASTER j
       ON j.job_id = e.job_id
     LEFT JOIN CUSTOMER_MASTER c
       ON c.customer_id = j.customer_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.error_time DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    values
  );

  return {
    rows,
    meta: pageMeta(
      page,
      pageSize,
      Number(count[0].total)
    ),
  };
}

async function listHistory({
  page,
  pageSize,
  offset,
  user,
  jobId,
  action,
}) {
  const customerId =
    user.role === "Admin"
      ? null
      : Number(user.customer_id);

  const where = [
    "(? IS NULL OR h.job_id = ?)",
    "(? IS NULL OR h.action = ?)",
    "(? IS NULL OR j.customer_id = ?)",
  ];

  const values = [
    jobId || null,
    jobId || null,
    action || null,
    action || null,
    customerId,
    customerId,
  ];

  const count = await db.query(
    `SELECT COUNT(*) AS total
     FROM JOB_STATUS_HISTORY h
     LEFT JOIN JOB_MASTER j
       ON j.job_id = h.job_id
     WHERE ${where.join(" AND ")}`,
    values
  );

  const rows = await db.query(
    `SELECT
        h.history_id,
        h.job_id,
        j.customer_id,
        c.customer_name,
        j.project_name,
        h.action,
        h.reason,
        h.changed_by AS changed_by_id,
        u.username AS changed_by,
        h.changed_at
     FROM JOB_STATUS_HISTORY h
     LEFT JOIN JOB_MASTER j
       ON j.job_id = h.job_id
     LEFT JOIN CUSTOMER_MASTER c
       ON c.customer_id = j.customer_id
     LEFT JOIN USERS u
       ON u.user_id = h.changed_by
     WHERE ${where.join(" AND ")}
     ORDER BY h.changed_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    values
  );

  return {
    rows,
    meta: pageMeta(
      page,
      pageSize,
      Number(count[0].total)
    ),
  };
}

async function addHistory({
  jobId,
  action,
  reason,
  changedBy,
}) {
  const result = await db.query(
    `INSERT INTO JOB_STATUS_HISTORY
       (job_id, action, reason, changed_by)
     VALUES (?, ?, ?, ?)`,
    [
      jobId,
      action,
      reason || null,
      changedBy,
    ]
  );

  return {
    history_id: result.insertId,
  };
}

async function listSchedulerLogs({
  page,
  pageSize,
  offset,
  user,
  status,
  from,
  to,
}) {
  const customerId =
    user.role === "Admin"
      ? null
      : Number(user.customer_id);

  const where = [
    "(? IS NULL OR s.status = ?)",
    "(? IS NULL OR s.start_time >= ?)",
    "(? IS NULL OR s.start_time <= ?)",
    "(? IS NULL OR j.customer_id = ?)",
  ];

  const values = [
    status || null,
    status || null,
    from || null,
    from || null,
    to || null,
    to || null,
    customerId,
    customerId,
  ];

  const count = await db.query(
    `SELECT COUNT(*) AS total
     FROM SCHEDULER_LOGS s
     LEFT JOIN JOB_MASTER j
       ON j.job_id = s.job_id
     WHERE ${where.join(" AND ")}`,
    values
  );

  const rows = await db.query(
    `SELECT
        s.scheduler_log_id,
        s.job_id,
        j.customer_id,
        c.customer_name,
        s.start_time,
        s.end_time,
        s.jobs_processed,
        s.files_deleted,
        s.errors_count,
        s.status
     FROM SCHEDULER_LOGS s
     LEFT JOIN JOB_MASTER j
       ON j.job_id = s.job_id
     LEFT JOIN CUSTOMER_MASTER c
       ON c.customer_id = j.customer_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.start_time DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    values
  );

  return {
    rows,
    meta: pageMeta(
      page,
      pageSize,
      Number(count[0].total)
    ),
  };
}

async function createSchedulerLog(data) {
  const result = await db.query(
    `INSERT INTO SCHEDULER_LOGS
       (
         start_time,
         end_time,
         jobs_processed,
         job_id,
         files_deleted,
         errors_count,
         status
       )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.start_time || new Date(),
      data.end_time || null,
      data.jobs_processed || 0,
      data.job_id || null,
      data.files_deleted || 0,
      data.errors_count || 0,
      data.status || "RUNNING",
    ]
  );

  return result.insertId;
}

async function finishSchedulerLog(id, data) {
  await db.query(
    `UPDATE SCHEDULER_LOGS
     SET
       end_time = ?,
       jobs_processed = ?,
       files_deleted = ?,
       errors_count = ?,
       status = ?
     WHERE scheduler_log_id = ?`,
    [
      new Date(),
      data.jobs_processed,
      data.files_deleted,
      data.errors_count,
      data.status,
      id,
    ]
  );
}

async function createErrorLog(data) {
  const message = String(
    data.error_message || "Unknown error"
  ).slice(0, 10000);

  /*
   * Defense in depth:
   *
   * The HTTP middleware already calls sanitizeRequest(req).
   * We sanitize again here so that even if another part of the
   * application calls createErrorLog() directly with raw data,
   * password/token/secret fields are still redacted.
   */
  const sanitizedRequestData =
    data.request_data == null
      ? null
      : sanitizeValue(data.request_data);

  const requestData =
    sanitizedRequestData == null
      ? null
      : JSON.stringify(
          sanitizedRequestData
        ).slice(0, 20000);

  /*
   * Never put authorization/password data into these explicit
   * columns. Only operational metadata is accepted here.
   */
  const resultData = [
    data.job_id || null,
    data.file_name || null,
    data.file_path || null,
    message,
    data.error_type || "INTERNAL_ERROR",
    data.status_code || 500,
    data.http_method || null,
    data.api_endpoint || null,
    data.user_id || null,
    data.username || null,
    data.ip_address || null,
    data.stack_trace || null,
    requestData,
    data.module || "api",
    data.severity || "ERROR",
    data.request_id || null,
  ];

  try {
    const result = await db.query(
      `INSERT INTO ERROR_LOGS
       (
         job_id,
         file_name,
         file_path,
         error_message,
         error_type,
         status_code,
         http_method,
         api_endpoint,
         user_id,
         username,
         ip_address,
         stack_trace,
         request_data,
         module,
         severity,
         request_id
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      resultData
    );

    return result.insertId;
  } catch (error) {
    /*
     * Compatibility fallback for an older ERROR_LOGS schema.
     * This should normally not be needed with your current schema.
     */
    if (
      error.code === "ER_BAD_FIELD_ERROR" &&
      data.job_id
    ) {
      const legacy = await db.query(
        `INSERT INTO ERROR_LOGS
           (
             job_id,
             file_name,
             file_path,
             error_message
           )
         VALUES (?, ?, ?, ?)`,
        [
          data.job_id,
          data.file_name || null,
          data.file_path || null,
          message,
        ]
      );

      return legacy.insertId;
    }

    throw error;
  }
}

module.exports = {
  listDeleteLogs,
  listErrorLogs,
  listHistory,
  addHistory,
  listSchedulerLogs,
  createSchedulerLog,
  finishSchedulerLog,
  createErrorLog,
};