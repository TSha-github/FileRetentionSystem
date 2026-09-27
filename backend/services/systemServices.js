const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { AppError, requireString } = require("../utils/core");

function passwordFields(body) {
  const currentPassword = requireString(body.current_password ?? body.currentPassword, "current_password", 200);
  const newPassword = requireString(body.new_password ?? body.newPassword, "new_password", 200);
  const confirmPassword = requireString(body.confirm_password ?? body.confirmPassword, "confirm_password", 200);
  if (newPassword.length < 8) throw new AppError(422, "new_password must be at least 8 characters", "PASSWORD_INVALID");
  if (newPassword !== confirmPassword) throw new AppError(422, "New password and confirmation do not match", "PASSWORD_MISMATCH");
  if (newPassword === currentPassword) throw new AppError(422, "New password must be different from the current password", "PASSWORD_REUSE");
  return { currentPassword, newPassword };
}

function resetPasswordValue(body) {
  const value = requireString(body.new_password ?? body.newPassword ?? body.password, "new_password", 200);
  if (value.length < 8) throw new AppError(422, "new_password must be at least 8 characters", "PASSWORD_INVALID");
  return value;
}

async function login(username, password) {
  const rows = await db.query(
    `SELECT u.user_id, u.username, u.password, u.role_id, u.customer_id, u.status,
            r.role_name, c.customer_name
     FROM USERS u
     JOIN ROLES r ON r.role_id = u.role_id
     LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = u.customer_id
     WHERE u.username = ?`,
    [username]
  );
  if (!rows.length) throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  const user = rows[0];
  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw new AppError(401, "Invalid username or password", "INVALID_CREDENTIALS");
  if (!user.status) {
    if (user.role_name === "Customer User" && user.customer_id === null) throw new AppError(403, "Customer setup is not complete. Contact the administrator.", "CUSTOMER_ASSIGNMENT_REQUIRED");
    throw new AppError(403, "User account is disabled", "USER_DISABLED");
  }
  if (user.role_name === "Customer User" && !user.customer_id) throw new AppError(403, "Customer setup is not complete. Contact the administrator.", "CUSTOMER_ASSIGNMENT_REQUIRED");
  if (user.role_name === "Admin" && user.customer_id !== null) throw new AppError(403, "Admin customer assignment is invalid", "INVALID_ADMIN_ASSIGNMENT");
  if (!["Admin", "Customer User"].includes(user.role_name)) throw new AppError(403, "User role is not allowed", "INVALID_ROLE");

  const token = jwt.sign(
    { user_id: user.user_id, username: user.username, role_id: user.role_id, role: user.role_name, customer_id: user.customer_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role: user.role_name,
      customer_id: user.customer_id,
      customer_name: user.customer_name || null
    }
  };
}

async function changePassword(userId, body) {
  const { currentPassword, newPassword } = passwordFields(body);
  const rows = await db.query("SELECT password, status FROM USERS WHERE user_id = ?", [userId]);
  if (!rows.length) throw new AppError(404, "User not found", "NOT_FOUND");
  if (!rows[0].status) throw new AppError(403, "User account is disabled", "USER_DISABLED");
  const matches = await bcrypt.compare(currentPassword, rows[0].password);
  if (!matches) throw new AppError(403, "Current password is incorrect", "CURRENT_PASSWORD_INVALID");
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query("UPDATE USERS SET password = ? WHERE user_id = ?", [hash, userId]);
  return { message: "Password changed successfully." };
}

async function resetPassword(targetUserId, body) {
  const newPassword = resetPasswordValue(body);
  const rows = await db.query(
    `SELECT u.user_id, r.role_name
     FROM USERS u JOIN ROLES r ON r.role_id = u.role_id
     WHERE u.user_id = ?`,
    [targetUserId]
  );
  if (!rows.length) throw new AppError(404, "User not found", "NOT_FOUND");
  if (rows[0].role_name !== "Customer User") throw new AppError(403, "Only Customer User passwords can be reset here", "RESET_NOT_ALLOWED");
  const hash = await bcrypt.hash(newPassword, 12);
  await db.query("UPDATE USERS SET password = ? WHERE user_id = ?", [hash, targetUserId]);
  return { message: "Temporary password reset successfully." };
}

async function dashboard(user) {
  const customerId = user.role === "Admin" ? null : user.customer_id;
  const jobsQ = customerId === null ? "SELECT COUNT(*) AS total FROM JOB_MASTER WHERE is_enabled = 1" : "SELECT COUNT(*) AS total FROM JOB_MASTER j WHERE j.is_enabled = 1 AND j.customer_id = ?";
  const deletesQ = customerId === null ? "SELECT COUNT(*) AS total FROM DELETE_LOGS WHERE status = 'Success'" : "SELECT COUNT(*) AS total FROM DELETE_LOGS d WHERE d.status = 'Success' AND d.customer_id = ?";
  const errorsQ = customerId === null ? "SELECT COUNT(*) AS total FROM ERROR_LOGS" : "SELECT COUNT(*) AS total FROM ERROR_LOGS e JOIN JOB_MASTER j ON j.job_id = e.job_id WHERE j.customer_id = ?";
  const customersQ = customerId === null ? "SELECT COUNT(*) AS total FROM CUSTOMER_MASTER WHERE status = 1" : "SELECT COUNT(*) AS total FROM CUSTOMER_MASTER c WHERE c.customer_id = ? AND c.status = 1";
  const schedulerQ = customerId === null ? "SELECT COUNT(*) AS total FROM SCHEDULER_LOGS" : "SELECT COUNT(*) AS total FROM SCHEDULER_LOGS s JOIN JOB_MASTER j ON j.job_id = s.job_id WHERE j.customer_id = ?";
  const usersQ = customerId === null ? "SELECT COUNT(*) AS total FROM USERS WHERE status = 1" : "SELECT COUNT(*) AS total FROM USERS u WHERE u.status = 1 AND u.customer_id = ?";
  const args = customerId === null ? [] : [customerId];

  const [jobs, deletes, errors, customers, schedulerRuns, users] = await Promise.all([
    db.query(jobsQ, args), db.query(deletesQ, args), db.query(errorsQ, args),
    db.query(customersQ, args), db.query(schedulerQ, args), db.query(usersQ, args)
  ]);

  const recentDeleteLogs = customerId === null
    ? await db.query("SELECT d.delete_log_id, d.job_id, d.customer_id, c.customer_name, j.project_name, d.file_name, d.file_path, d.file_type, d.file_created_at, d.deleted_at, d.retention_hours, d.status FROM DELETE_LOGS d LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = d.customer_id LEFT JOIN JOB_MASTER j ON j.job_id = d.job_id ORDER BY d.deleted_at DESC LIMIT 10")
    : await db.query("SELECT d.delete_log_id, d.job_id, d.customer_id, c.customer_name, j.project_name, d.file_name, d.file_path, d.file_type, d.file_created_at, d.deleted_at, d.retention_hours, d.status FROM DELETE_LOGS d LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = d.customer_id LEFT JOIN JOB_MASTER j ON j.job_id = d.job_id WHERE d.customer_id = ? ORDER BY d.deleted_at DESC LIMIT 10", [customerId]);

  const recentErrorLogs = customerId === null
    ? await db.query("SELECT e.error_id, e.error_id AS id, e.job_id, j.customer_id, c.customer_name, e.file_name, e.file_name AS file, e.file_path, e.file_path AS path, e.error_message, e.error_message AS message, e.error_time, e.error_time AS time FROM ERROR_LOGS e LEFT JOIN JOB_MASTER j ON j.job_id = e.job_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id ORDER BY e.error_time DESC LIMIT 10")
    : await db.query("SELECT e.error_id, e.error_id AS id, e.job_id, j.customer_id, c.customer_name, e.file_name, e.file_name AS file, e.file_path, e.file_path AS path, e.error_message, e.error_message AS message, e.error_time, e.error_time AS time FROM ERROR_LOGS e LEFT JOIN JOB_MASTER j ON j.job_id = e.job_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id WHERE j.customer_id = ? ORDER BY e.error_time DESC LIMIT 10", [customerId]);

  return {
    customers: Number(customers[0].total), activeJobs: Number(jobs[0].total), deletedFiles: Number(deletes[0].total),
    errorLogs: Number(errors[0].total), errors: Number(errors[0].total), schedulerRuns: Number(schedulerRuns[0].total),
    users: Number(users[0].total), customer_id: customerId, customer_name: user.customer_name || null,
    recentDeleteLogs, recentErrorLogs
  };
}

async function health() { await db.query("SELECT 1 AS ok"); return { status: "ok", database: "ok", timestamp: new Date().toISOString() }; }
module.exports = { login, changePassword, resetPassword, dashboard, health };
