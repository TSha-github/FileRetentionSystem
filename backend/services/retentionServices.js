const fs = require("fs/promises");
const db = require("../config/db");
const { AppError } = require("../utils/core");
const { listFiles, isExcluded, matchesFileType, ageInHours } = require("../utils/fileUtils");
const { createSchedulerLog, finishSchedulerLog, createErrorLog } = require("./logServices");

let running = false;

async function activeJobs(jobId) {
  if (jobId) {
    const rows = await db.query("SELECT job_id, customer_id, project_name, folder_path, file_type, retention_hours, is_enabled, disable_reason, exclude_folder FROM JOB_MASTER WHERE job_id = ?", [jobId]);
    if (!rows.length) throw new AppError(404, "Job not found", "NOT_FOUND", undefined, { module: "retention" });
    if (!rows[0].is_enabled) throw new AppError(409, "Job is disabled", "JOB_DISABLED", undefined, { module: "retention" });
    return rows;
  }
  return db.query("SELECT job_id, customer_id, project_name, folder_path, file_type, retention_hours, is_enabled, disable_reason, exclude_folder FROM JOB_MASTER WHERE is_enabled = 1 ORDER BY job_id ASC");
}

function fileErrorMetadata(error, type, job, file = {}) {
  const criticalCodes = new Set(["ENOSPC", "EIO", "ECONNRESET"]);
  return {
    job_id: job.job_id,
    file_name: file.fileName || null,
    file_path: file.filePath || job.folder_path || null,
    error_type: type,
    error_message: error.message,
    status_code: error.code === "ENOENT" ? 404 : (criticalCodes.has(error.code) ? 503 : 500),
    module: "retention",
    severity: criticalCodes.has(error.code) ? "CRITICAL" : "ERROR",
    stack_trace: error.stack
  };
}

async function processOneJob(job, dryRun) {
  const startedAt = new Date();
  const schedulerLogId = await createSchedulerLog({ start_time: startedAt, jobs_processed: 0, job_id: job.job_id, files_deleted: 0, errors_count: 0, status: "Running" });
  let filesDeleted = 0;
  let errorsCount = 0;
  let scanned = 0;
  try {
    if (job.exclude_folder) {
      await finishSchedulerLog(schedulerLogId, { jobs_processed: 1, job_id: job.job_id, files_deleted: 0, errors_count: 0, status: "Skipped" });
      return { job_id: job.job_id, project_name: job.project_name, scanned: 0, files_deleted: 0, errors_count: 0, status: "Skipped" };
    }
    const retentionHours = Number(job.retention_hours);
    if (!job.folder_path || !Number.isFinite(retentionHours) || retentionHours <= 0) {
      throw new AppError(422, "Job has an invalid retention configuration", "RETENTION_CONFIGURATION_ERROR", { job_id: job.job_id }, { module: "retention" });
    }

    const files = await listFiles(job.folder_path);
    const now = new Date();
    for (const file of files) {
      scanned += 1;
      if (!matchesFileType(file.fileName, job.file_type)) continue;
      if (isExcluded(file.fileName, file.filePath, job.exclude_folder)) continue;
      if (ageInHours(file.stat.birthtime, now) < retentionHours) continue;
      if (dryRun) continue;
      try {
        await fs.unlink(file.filePath);
        await db.query("INSERT INTO DELETE_LOGS (job_id, customer_id, file_name, file_path, file_type, file_created_at, deleted_at, retention_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [job.job_id, job.customer_id, file.fileName, file.filePath, job.file_type, file.stat.birthtime, new Date(), retentionHours, "Success"]);
        filesDeleted += 1;
      } catch (error) {
        errorsCount += 1;
        try {
          await db.query("INSERT INTO DELETE_LOGS (job_id, customer_id, file_name, file_path, file_type, file_created_at, deleted_at, retention_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [job.job_id, job.customer_id, file.fileName, file.filePath, job.file_type, file.stat.birthtime, null, retentionHours, "Failed"]);
        } catch (logError) {
          console.error("Failed to write failed DELETE_LOGS row", logError);
        }
        await createErrorLog(fileErrorMetadata(error, "FILE_DELETE_ERROR", job, file));
      }
    }
    const status = dryRun ? "Dry Run" : (errorsCount ? "Completed with Errors" : "Completed");
    await finishSchedulerLog(schedulerLogId, { jobs_processed: 1, job_id: job.job_id, files_deleted: filesDeleted, errors_count: errorsCount, status });
    return { job_id: job.job_id, project_name: job.project_name, scanned, files_deleted: filesDeleted, errors_count: errorsCount, status };
  } catch (error) {
    errorsCount += 1;
    await createErrorLog(fileErrorMetadata(error, error.code === "ENOENT" ? "RETENTION_FOLDER_NOT_FOUND" : "RETENTION_JOB_ERROR", job));
    await finishSchedulerLog(schedulerLogId, { jobs_processed: 1, job_id: job.job_id, files_deleted: filesDeleted, errors_count: errorsCount, status: "Failed" });
    return { job_id: job.job_id, project_name: job.project_name, scanned, files_deleted: filesDeleted, errors_count: errorsCount, status: "Failed", error: error.message };
  }
}

async function runRetention({ jobId = null, dryRun = false } = {}) {
  if (running) throw new AppError(409, "A retention run is already in progress", "RETENTION_ALREADY_RUNNING", undefined, { module: "retention" });
  running = true;
  try {
    const jobs = await activeJobs(jobId);
    const results = [];
    for (const job of jobs) results.push(await processOneJob(job, dryRun));
    return { dry_run: Boolean(dryRun), jobs_processed: results.length, files_deleted: results.reduce((n, item) => n + item.files_deleted, 0), errors_count: results.reduce((n, item) => n + item.errors_count, 0), results };
  } finally {
    running = false;
  }
}

function status() {
  return { running };
}

module.exports = { runRetention, status };
