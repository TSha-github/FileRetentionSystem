const db = require("../config/db");
const { pageMeta, AppError } = require("../utils/core");

// function effectiveCustomer(user, requested) {
//   return user.role === "Admin" ? (requested || null) : Number(user.customer_id);
// }
function effectiveCustomer(user, requested) {
  const requestedId =
    requested !== undefined &&
    requested !== null &&
    requested !== ""
      ? Number(requested)
      : null;

  // Admin can select any customer
  if (user.role === "Admin") {
    return requestedId;
  }

  // Customer User cannot choose a customer
  if (requestedId !== null && requestedId !== Number(user.customer_id)) {
    throw new AppError(
  403,
  "You are not authorized to access this customer's report",
  "FORBIDDEN"
);
  }

  return Number(user.customer_id);
}
function baseFilters({ user, from, to, customerId, jobId }) {
  const scoped = effectiveCustomer(user, customerId);
  return { scoped, from: from || null, to: to || null, jobId: jobId || null };
}

async function getSummary ( { user, from, to, customerId, jobId }) {
  const f = baseFilters({ user, from, to, customerId, jobId });
  const args = [f.from, f.from, f.to, f.to, f.scoped, f.scoped, f.jobId, f.jobId];
  const jobArgs = [f.scoped, f.scoped, f.jobId, f.jobId];
  const [deleted, errors, jobs, customers, schedulerRuns] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM DELETE_LOGS d LEFT JOIN JOB_MASTER j ON j.job_id = d.job_id WHERE (? IS NULL OR d.deleted_at >= ?) AND (? IS NULL OR d.deleted_at <= ?) AND (? IS NULL OR d.customer_id = ?) AND (? IS NULL OR d.job_id = ?) AND d.status = 'Success'`, args),
    db.query(`SELECT COUNT(*) AS total FROM ERROR_LOGS e LEFT JOIN JOB_MASTER j ON j.job_id = e.job_id WHERE (? IS NULL OR e.error_time >= ?) AND (? IS NULL OR e.error_time <= ?) AND (? IS NULL OR j.customer_id = ?) AND (? IS NULL OR e.job_id = ?)`, args),
    db.query(`SELECT COUNT(*) AS total FROM JOB_MASTER j WHERE j.is_enabled = 1 AND (? IS NULL OR j.customer_id = ?) AND (? IS NULL OR j.job_id = ?)`, jobArgs),
    db.query(`SELECT COUNT(*) AS total FROM CUSTOMER_MASTER c WHERE c.status = 1 AND (? IS NULL OR c.customer_id = ?)`, [f.scoped, f.scoped]),
    db.query(`SELECT COUNT(*) AS total FROM SCHEDULER_LOGS s LEFT JOIN JOB_MASTER j ON j.job_id = s.job_id WHERE (? IS NULL OR j.customer_id = ?)`, [f.scoped, f.scoped])
  ]);
  return { totalJobs: Number(jobs[0].total), filesDeleted: Number(deleted[0].total), errors: Number(errors[0].total), activeJobs: Number(jobs[0].total), customers: Number(customers[0].total), schedulerRuns:
  user.role === "Admin" &&
  f.scoped === null
    ? Number(schedulerRuns[0].total)
    : null, from: f.from, to: f.to, customer_id: f.scoped, customer_name: user.customer_name || null };
}

async function listRows({ page, pageSize, offset, user, from, to, customerId, jobId }) {
  const f = baseFilters({ user, from, to, customerId, jobId });
  const base = `FROM JOB_MASTER j LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id LEFT JOIN DELETE_LOGS d ON d.job_id = j.job_id AND d.customer_id = j.customer_id AND (? IS NULL OR d.deleted_at >= ?) AND (? IS NULL OR d.deleted_at <= ?) LEFT JOIN ERROR_LOGS e ON e.job_id = j.job_id AND (? IS NULL OR e.error_time >= ?) AND (? IS NULL OR e.error_time <= ?) WHERE (? IS NULL OR j.customer_id = ?) AND (? IS NULL OR j.job_id = ?)`;
  const baseValues = [f.from, f.from, f.to, f.to, f.from, f.from, f.to, f.to, f.scoped, f.scoped, f.jobId, f.jobId];
  const count = await db.query(`SELECT COUNT(*) AS total FROM JOB_MASTER j WHERE (? IS NULL OR j.customer_id = ?) AND (? IS NULL OR j.job_id = ?)`, [f.scoped, f.scoped, f.jobId, f.jobId]);
  const rows = await db.query(`SELECT j.job_id AS report_id, j.job_id, j.customer_id, c.customer_name, j.project_name, j.file_type, (COUNT(DISTINCT d.delete_log_id) + COUNT(DISTINCT e.error_id)) AS files_processed, COUNT(DISTINCT CASE WHEN d.status = 'Success' THEN d.delete_log_id END) AS files_deleted, COUNT(DISTINCT e.error_id) + COUNT(DISTINCT CASE WHEN d.status = 'Failed' THEN d.delete_log_id END) AS errors, CASE WHEN j.is_enabled = 0 THEN 'Inactive' WHEN (COUNT(DISTINCT e.error_id) + COUNT(DISTINCT CASE WHEN d.status = 'Failed' THEN d.delete_log_id END)) > 0 THEN 'Completed with Errors' ELSE 'Completed' END AS status ${base} GROUP BY j.job_id, j.customer_id, c.customer_name, j.project_name, j.file_type, j.is_enabled ORDER BY j.job_id DESC LIMIT ${pageSize} OFFSET ${offset}`, baseValues);
  return { rows: rows.map(row => ({ ...row, files_processed: Number(row.files_processed || 0), files_deleted: Number(row.files_deleted || 0), errors: Number(row.errors || 0) })), meta: pageMeta(page, pageSize, Number(count[0].total)) };
}

async function generateDownloadReport({ user, customerId, from, to }) {
  const f = baseFilters({
    user,
    from,
    to,
    customerId,
    jobId: null
  });

  /*
   * Get customer information.
   *
   * For Admin:
   *   customerId can come from the request.
   *
   * For Customer User:
   *   effectiveCustomer() uses req.user.customer_id.
   */
const customerRows = await db.query(
    `
    SELECT
      customer_id,
      customer_name,
      description,
      status,
      created_at
    FROM CUSTOMER_MASTER
    WHERE (? IS NULL OR customer_id = ?)
    ORDER BY customer_id
    `,
    [f.scoped, f.scoped]
  );

  if (f.scoped !== null && customerRows.length === 0) {
    const error = new Error("Customer not found");
    error.status = 404;
    throw error;
  }
  const jobs = await db.query(
  `
  SELECT
    j.job_id,
    j.customer_id,
    c.customer_name,
    j.project_name,
    j.folder_path,
    j.file_type,
    j.retention_hours,
    j.is_enabled,
    j.disable_reason,
    j.exclude_folder,
    j.created_at
  FROM JOB_MASTER j
  LEFT JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
  WHERE (? IS NULL OR j.customer_id = ?)
  ORDER BY j.job_id
  `,
  [f.scoped, f.scoped]
);

  /*
   * JOBS
const jobs = await db.query(
    `
    SELECT
      j.job_id,
      j.customer_id,
      c.customer_name,
      j.project_name,
      j.folder_path,
      j.file_type,
      j.retention_hours,
      j.is_enabled,
      j.disable_reason,
      j.exclude_folder,
      j.created_at
    FROM JOB_MASTER j
    LEFT JOIN CUSTOMER_MASTER c
      ON c.customer_id = j.customer_id
    WHERE (? IS NULL OR j.customer_id = ?)
    ORDER BY j.job_id
    `,
    [f.scoped, f.scoped]
  );

  /*
   * DELETE LOGS
   */
  const deleteLogs = await db.query(
    `
    SELECT
      d.delete_log_id,
      d.job_id,
      d.customer_id,
      c.customer_name,
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
    WHERE
      (? IS NULL OR d.customer_id = ?)
      AND (? IS NULL OR d.deleted_at >= ?)
      AND (? IS NULL OR d.deleted_at <= ?)
    ORDER BY d.deleted_at DESC
    `,
    [
      f.scoped,
      f.scoped,
      f.from,
      f.from,
      f.to,
      f.to
    ]
  );

  /*
   * ERROR LOGS
   *
   * ERROR_LOGS does not contain customer_id directly,
   * so customer is determined through JOB_MASTER.
   */
 const errorLogs = await db.query(
    `
    SELECT
      e.error_id,
      e.job_id,
      j.customer_id,
      c.customer_name,
      e.file_name,
      e.file_path,
      e.error_message,
      e.error_time
    FROM ERROR_LOGS e
    INNER JOIN JOB_MASTER j
      ON j.job_id = e.job_id
    LEFT JOIN CUSTOMER_MASTER c
      ON c.customer_id = j.customer_id
    WHERE
      (? IS NULL OR j.customer_id = ?)
      AND (? IS NULL OR e.error_time >= ?)
      AND (? IS NULL OR e.error_time <= ?)
    ORDER BY e.error_time DESC
    `,
    [
      f.scoped,
      f.scoped,
      f.from,
      f.from,
      f.to,
      f.to
    ]
  );

  /*
   * SCHEDULER LOGS
   *
   * Customer is determined through JOB_MASTER.
   */
let schedulerLogs = [];

const includeGlobalSchedulerLogs =
  user.role === "Admin" &&
  f.scoped === null;

if (includeGlobalSchedulerLogs) {
  schedulerLogs = await db.query(
    `
    SELECT
      s.scheduler_log_id,
      s.start_time,
      s.end_time,
      s.jobs_processed,
      s.job_id,
      s.files_scanned,
      s.files_retained,
      s.files_deleted,
      s.errors_count,
      s.status
    FROM SCHEDULER_LOGS s
    ORDER BY s.start_time DESC
    `
  );
}

  /*
   * JOB STATUS HISTORY
   */
  const history = await db.query(
    `
    SELECT
      h.history_id,
      h.job_id,
      j.customer_id,
      c.customer_name,
      j.project_name,
      h.action,
      h.reason,
      h.changed_by,
      u.username AS changed_by_username,
      h.changed_at
    FROM JOB_STATUS_HISTORY h
    INNER JOIN JOB_MASTER j
      ON j.job_id = h.job_id
    LEFT JOIN CUSTOMER_MASTER c
      ON c.customer_id = j.customer_id
    LEFT JOIN USERS u
      ON u.user_id = h.changed_by
    WHERE (? IS NULL OR j.customer_id = ?)
    ORDER BY h.changed_at DESC
    `,
    [f.scoped, f.scoped]
  );

  /*
   * Build a CSV file.
   *
   * CSV is simple, downloadable and can be opened
   * directly in Excel.
   */
  const csvEscape = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvSection = (title, columns, rows) => {
    const output = [];

    output.push(title);
    output.push(columns.map(csvEscape).join(","));

    for (const row of rows) {
      output.push(
        columns
          .map((column) => csvEscape(row[column]))
          .join(",")
      );
    }

    output.push("");

    return output.join("\n");
  };

const customer =
  f.scoped === null
    ? null
    : customerRows[0] || null;

const reportParts = [];

reportParts.push(
  "FILE RETENTION SYSTEM REPORT"
);

reportParts.push(
  `Customer,${csvEscape(
    f.scoped === null
      ? "All Customers"
      : customer?.customer_name || "Unknown Customer"
  )}`
);

reportParts.push(
  `Customer ID,${csvEscape(
    f.scoped === null
      ? "All"
      : f.scoped
  )}`
);"SCHEDULER LOGS"

  reportParts.push(
    `From,${csvEscape(f.from || "All")}`
  );

  reportParts.push(
    `To,${csvEscape(f.to || "All")}`
  );

  reportParts.push(
    `Generated At,${csvEscape(new Date().toISOString())}`
  );

  reportParts.push("");

  /*
   * SUMMARY
   */
  reportParts.push("SUMMARY");
  reportParts.push("Metric,Value");

  reportParts.push(`Customers,${customerRows.length}`);
  reportParts.push(`Jobs,${jobs.length}`);
  reportParts.push(`Delete Logs,${deleteLogs.length}`);
  reportParts.push(`Error Logs,${errorLogs.length}`);
reportParts.push(
  `Scheduler Runs,${
    includeGlobalSchedulerLogs
      ? schedulerLogs.length
      : "N/A - system level"
  }`
);  reportParts.push(`Job History Entries,${history.length}`);

  reportParts.push("");

  /*
   * JOBS
   */
reportParts.push(
  csvSection(
    "SCHEDULER LOGS",
    [
      "scheduler_log_id",
      "start_time",
      "end_time",
      "jobs_processed",
      "job_id",
      "files_scanned",
      "files_retained",
      "files_deleted",
      "errors_count",
      "status"
    ],
    schedulerLogs
  )
);

  /*
   * DELETE LOGS
   */
  reportParts.push(
    csvSection(
      "DELETE LOGS",
      [
        "delete_log_id",
        "job_id",
        "customer_id",
        "customer_name",
        "file_name",
        "file_path",
        "file_type",
        "file_created_at",
        "deleted_at",
        "retention_hours",
        "status"
      ],
      deleteLogs
    )
  );
// ==================================================
// JOBS
// ==================================================

reportParts.push(
  csvSection(
    "JOBS",
    [
      "job_id",
      "customer_id",
      "customer_name",
      "project_name",
      "folder_path",
      "file_type",
      "retention_hours",
      "is_enabled",
      "disable_reason",
      "exclude_folder",
      "created_at"
    ],
    jobs
  )
);
  /*
   * ERROR LOGS
   */
  reportParts.push(
    csvSection(
      "ERROR LOGS",
      [
        "error_id",
        "job_id",
        "customer_id",
        "customer_name",
        "file_name",
        "file_path",
        "error_message",
        "error_time"
      ],
      errorLogs
    )
  );

  /*
   * SCHEDULER LOGS
   */


  /*
   * JOB HISTORY
   */
  reportParts.push(
    csvSection(
      "JOB STATUS HISTORY",
      [
        "history_id",
        "job_id",
        "customer_id",
        "customer_name",
        "project_name",
        "action",
        "reason",
        "changed_by",
        "changed_by_username",
        "changed_at"
      ],
      history
    )
  );

  const csv = reportParts.join("\n");

  const buffer = Buffer.from(csv, "utf8");

  const customerPart = customer
    ? customer.customer_name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
    : "all_customers";

  const filename = `file_retention_report_${customerPart}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return {
    buffer,
    filename,
    contentType: "text/csv; charset=utf-8"
  };
}
module.exports = {
  getSummary,
  listRows,
  generateDownloadReport
};
