const bcrypt = require("bcrypt");
const db = require("../config/db");
const { AppError, pageMeta, requireString, optionalString, integer, booleanValue } = require("../utils/core");

function totalFrom(rows) { return Number(rows[0]?.total || 0); }
const has = (body, ...keys) => keys.some((key) => Object.prototype.hasOwnProperty.call(body, key));

function duplicateUsernameError(error) {
  if (error?.code === "ER_DUP_ENTRY" && /username/i.test(error.message || "")) {
    return new AppError(409, "Username already exists.", "USERNAME_EXISTS");
  }
  return error;
}

async function listCustomers(params) {
  const { page, pageSize, offset } = params;

  const search = params.search
    ? `%${params.search}%`
    : null;

  const status =
    params.status === undefined
      ? null
      : booleanValue(params.status, "status")
        ? 1
        : 0;

  const where = [
    "(? IS NULL OR customer_name LIKE ?)",
    "(? IS NULL OR status = ?)",
  ];

  const values = [
    search,
    search,
    status,
    status,
  ];

  const totalRows = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM CUSTOMER_MASTER
    WHERE ${where.join(" AND ")}
    `,
    values
  );

  // IMPORTANT:
  // folder_path is returned to the frontend here
  const rows = await db.query(
    `
    SELECT
      customer_id,
      customer_id AS id,
      customer_name,
      customer_name AS name,
      description,
      folder_path,
      status AS status_flag,
      CASE
        WHEN status = 1 THEN 'Active'
        ELSE 'Inactive'
      END AS status,
      created_at
    FROM CUSTOMER_MASTER
    WHERE ${where.join(" AND ")}
    ORDER BY customer_id DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
    `,
    values
  );

  return {
    rows,
    meta: pageMeta(
      page,
      pageSize,
      totalFrom(totalRows)
    ),
  };
}

async function getCustomer(id) {
  const rows = await db.query(
    `
    SELECT
      customer_id,
      customer_id AS id,
      customer_name,
      customer_name AS name,
      description,
      folder_path,
      status AS status_flag,
      CASE
        WHEN status = 1 THEN 'Active'
        ELSE 'Inactive'
      END AS status,
      created_at
    FROM CUSTOMER_MASTER
    WHERE customer_id = ?
    `,
    [id]
  );

  if (!rows.length) {
    throw new AppError(
      404,
      "Customer not found",
      "NOT_FOUND"
    );
  }

  return rows[0];
}

async function createCustomer(body) {
  const customerName = requireString(
    body.customer_name ??
      body.customerName,
    "customer_name",
    100
  );

  const description = optionalString(
    body.description,
    "description"
  );
  const folderPath = requireString(
  body.folder_path ??
    body.folderPath,
  "folder_path",
  500
);

  const status =
    body.status === undefined
      ? 1
      : booleanValue(
          body.status,
          "status"
        );

  // ------------------------------------------------
  // LOGIN USER IS REQUIRED FOR NEW CUSTOMER
  // ------------------------------------------------
  const loginUserId = integer(
    body.login_user_id ??
      body.loginUserId ??
      body.user_id ??
      body.userId,
    "login_user_id",
    {
      min: 1,
    }
  );

  try {
    const customerId =
      await db.transaction(
        async (connection) => {

          // =========================================
          // CHECK DUPLICATE CUSTOMER NAME
          // =========================================
          const [existingCustomers] =
            await connection.execute(
              `
              SELECT customer_id
              FROM CUSTOMER_MASTER
              WHERE LOWER(TRIM(customer_name))
                    = LOWER(TRIM(?))
              LIMIT 1
              `,
              [customerName]
            );

          if (
            existingCustomers.length >
            0
          ) {
            throw new AppError(
              409,
              "Customer already exists.",
              "CUSTOMER_EXISTS"
            );
          }

          // =========================================
          // LOCK + VERIFY PENDING USER
          // BEFORE CUSTOMER INSERT
          // =========================================
          const [pendingUsers] =
            await connection.execute(
              `
              SELECT
                  u.user_id,
                  u.customer_id,
                  u.status,
                  r.role_name
              FROM USERS u
              JOIN ROLES r
                  ON r.role_id = u.role_id
              WHERE u.user_id = ?
              FOR UPDATE
              `,
              [loginUserId]
            );

          const pendingUser =
            pendingUsers[0];

          if (!pendingUser) {
            throw new AppError(
              404,
              "Selected Customer User was not found.",
              "PENDING_USER_NOT_FOUND"
            );
          }

          if (
            pendingUser.role_name !==
            "Customer User"
          ) {
            throw new AppError(
              409,
              "Selected login account is not a Customer User.",
              "PENDING_USER_INVALID"
            );
          }

          if (
            pendingUser.customer_id !==
            null
          ) {
            throw new AppError(
              409,
              "Selected Customer User is already assigned to a customer.",
              "PENDING_USER_ALREADY_ASSIGNED"
            );
          }

          if (
            Number(
              pendingUser.status
            ) !== 0
          ) {
            throw new AppError(
              409,
              "Selected Customer User is not pending customer setup.",
              "PENDING_USER_INVALID"
            );
          }

          // =========================================
          // CREATE CUSTOMER
          // =========================================
const [customerResult] =
  await connection.execute(
    `
    INSERT INTO CUSTOMER_MASTER
    (
      customer_name,
      description,
      folder_path,
      status
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      customerName,
      description,
      folderPath,
      status,
    ]
  );

          const newCustomerId =
            customerResult.insertId;

          // =========================================
          // LINK + ACTIVATE CUSTOMER USER
          // =========================================
          const [userUpdate] =
            await connection.execute(
              `
              UPDATE USERS
              SET
                  customer_id = ?,
                  status = 1
              WHERE user_id = ?
                AND customer_id IS NULL
                AND status = 0
              `,
              [
                newCustomerId,
                loginUserId,
              ]
            );

          if (
            userUpdate.affectedRows !==
            1
          ) {
            throw new AppError(
              409,
              "Customer User could not be assigned. Please refresh and try again.",
              "PENDING_USER_ASSIGNMENT_FAILED"
            );
          }

          return newCustomerId;
        }
      );

    return getCustomer(customerId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (
      error?.code ===
        "ER_DUP_ENTRY" &&
      /customer_name/i.test(
        error.message || ""
      )
    ) {
      throw new AppError(
        409,
        "Customer already exists.",
        "CUSTOMER_EXISTS"
      );
    }

    throw error;
  }
}

async function updateCustomer(id, body) {
  await getCustomer(id);
  const fields = [];
  const values = [];
  if (body.customer_name !== undefined || body.customerName !== undefined) { fields.push("customer_name = ?"); values.push(requireString(body.customer_name ?? body.customerName, "customer_name")); }
  if (body.description !== undefined) { fields.push("description = ?"); values.push(optionalString(body.description, "description")); }
 if (
  body.folder_path !== undefined ||
  body.folderPath !== undefined
) {
  fields.push(
    "folder_path = ?"
  );

  values.push(
    requireString(
      body.folder_path ??
        body.folderPath,
      "folder_path",
      500
    )
  );
}
  if (body.status !== undefined) { fields.push("status = ?"); values.push(booleanValue(body.status, "status")); }
  if (!fields.length) throw new AppError(400, "No supported fields supplied", "VALIDATION_ERROR");
  values.push(id);
  try {
    await db.query(`UPDATE CUSTOMER_MASTER SET ${fields.join(", ")} WHERE customer_id = ?`, values);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY" && /customer_name/i.test(error.message || "")) throw new AppError(409, "Customer name already exists.", "CUSTOMER_EXISTS");
    throw error;
  }
  return getCustomer(id);
}

async function deleteCustomer(id) {
  await getCustomer(id);
  const jobs = await db.query("SELECT COUNT(*) AS total FROM JOB_MASTER WHERE customer_id = ?", [id]);
  if (Number(jobs[0].total) > 0) throw new AppError(409, "Customer has jobs and cannot be deleted; disable it instead", "CUSTOMER_IN_USE");
  await db.query("DELETE FROM CUSTOMER_MASTER WHERE customer_id = ?", [id]);
  return { customer_id: Number(id), deleted: true };
}

async function listJobs(params) {
  const { page, pageSize, offset, user } = params;
  const search = params.search ? `%${params.search}%` : null;
  const customerId = user?.role === "Admin" ? (params.customer_id ? Number(params.customer_id) : null) : Number(user.customer_id);
  const enabled = params.is_enabled === undefined ? null : (params.is_enabled === "true" || params.is_enabled === "1" || params.is_enabled === "Active" ? 1 : 0);
  const where = ["(? IS NULL OR j.project_name LIKE ? OR c.customer_name LIKE ?)", "(? IS NULL OR j.customer_id = ?)", "(? IS NULL OR j.is_enabled = ?)"];
  const values = [search, search, search, customerId, customerId, enabled, enabled];
  const from = "JOB_MASTER j LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id";
  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM ${from} WHERE ${where.join(" AND ")}`, values);
  const rows = await db.query(`SELECT j.job_id, j.customer_id, c.customer_name, c.customer_name AS customer, j.project_name, j.project_name AS project, j.folder_path, j.folder_path AS path, j.file_type, j.file_type AS type, j.retention_hours, j.retention_hours AS retentionPeriod, j.is_enabled, CASE WHEN j.is_enabled = 1 THEN 'Active' ELSE 'Inactive' END AS status, j.disable_reason, j.exclude_folder, j.created_at FROM ${from} WHERE ${where.join(" AND ")} ORDER BY j.job_id DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
  return { rows, meta: pageMeta(page, pageSize, totalFrom(totalRows)) };
}

async function getJob(id, user = null) {
  const isCustomerUser = user?.role === "Customer User";
  const rows = await db.query(`SELECT j.job_id, j.customer_id, c.customer_name, c.customer_name AS customer, j.project_name, j.project_name AS project, j.folder_path, j.folder_path AS path, j.file_type, j.file_type AS type, j.retention_hours, j.retention_hours AS retentionPeriod, j.is_enabled, CASE WHEN j.is_enabled = 1 THEN 'Active' ELSE 'Inactive' END AS status, j.disable_reason, j.exclude_folder, j.created_at FROM JOB_MASTER j LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = j.customer_id WHERE j.job_id = ? ${isCustomerUser ? "AND j.customer_id = ?" : ""}`, isCustomerUser ? [id, user.customer_id] : [id]);
  if (!rows.length) throw new AppError(404, "Job not found", "NOT_FOUND");
  return rows[0];
}

function jobValues(body) {
  const customerId = body.customer_id !== undefined || body.customerId !== undefined ? integer(body.customer_id ?? body.customerId, "customer_id", { min: 1 }) : null;
  const projectName = requireString(body.project_name ?? body.projectName, "project_name");
  const folderPath = optionalString(body.folder_path ?? body.folderPath, "folder_path", 255);
const fileType = requireString(
  body.file_type ?? body.fileType,
  "file_type",
  20
).trim().toUpperCase();

const allowedFileTypes = [
  "PDF",
  "XML",
  "TXT",
  "CSV",
  "XLSX"
];

if (!allowedFileTypes.includes(fileType)) {
  throw new AppError(
    400,
    "File type must be PDF, XML, TXT, CSV, or XLSX.",
    "INVALID_FILE_TYPE"
  );
}
 const retentionHours = integer(body.retention_hours ?? body.retentionHours, "retention_hours", { min: 1, max: 876000, required: false });
  const isEnabled = body.is_enabled === undefined && body.isEnabled === undefined ? true : booleanValue(body.is_enabled ?? body.isEnabled, "is_enabled");
  const disableReason = optionalString(body.disable_reason ?? body.disableReason, "disable_reason");
  const excludeFolder = body.exclude_folder === undefined && body.excludeFolder === undefined ? false : booleanValue(body.exclude_folder ?? body.excludeFolder, "exclude_folder");
  return [customerId, projectName, folderPath, fileType, retentionHours, isEnabled, disableReason, excludeFolder];
}

async function resolveCustomerId(body) {
  if (body.customer_id !== undefined || body.customerId !== undefined) return integer(body.customer_id ?? body.customerId, "customer_id", { min: 1 });
  if (body.customer_name !== undefined || body.customerName !== undefined || body.customer !== undefined) {
    const customerName = requireString(body.customer_name ?? body.customerName ?? body.customer, "customer_name", 100);
    const rows = await db.query("SELECT customer_id FROM CUSTOMER_MASTER WHERE customer_name = ?", [customerName]);
    if (!rows.length) throw new AppError(400, "customer_name does not exist", "VALIDATION_ERROR");
    return rows[0].customer_id;
  }
  throw new AppError(400, "customer_id or customer_name is required", "VALIDATION_ERROR");
}

async function ensureCustomer(id) {
  const rows = await db.query("SELECT customer_id FROM CUSTOMER_MASTER WHERE customer_id = ?", [id]);
  if (!rows.length) throw new AppError(400, "customer_id does not exist", "VALIDATION_ERROR");
}
async function getCustomerFolderPath(customerId) {
  const rows = await db.query(
    `
    SELECT folder_path
    FROM CUSTOMER_MASTER
    WHERE customer_id = ?
      AND status = 1
    `,
    [customerId]
  );

  if (!rows.length) {
    throw new AppError(
      400,
      "Customer does not exist or is inactive.",
      "CUSTOMER_INVALID"
    );
  }

  const folderPath = String(
    rows[0].folder_path || ""
  ).trim();

  if (!folderPath) {
    throw new AppError(
      422,
      "Customer retention folder path is not configured.",
      "CUSTOMER_FOLDER_NOT_CONFIGURED"
    );
  }

  return folderPath;
}

async function createJob(body) {
  const values = jobValues(body);

  // Resolve the selected customer
  const customerId = await resolveCustomerId(body);

  // Make sure customer exists
  await ensureCustomer(customerId);

  // Always get folder path from CUSTOMER_MASTER
  const folderPath =
    await getCustomerFolderPath(customerId);

  const [
    ,
    projectName,
    ,
    fileType,
    retentionHours,
    isEnabled,
    disableReason,
    excludeFolder,
  ] = values;

  // =========================================================
  // PREVENT DUPLICATE ACTIVE JOB
  // Same customer + same folder + same file type
  // =========================================================

  if (isEnabled) {
    const existingJobs = await db.query(
      `
      SELECT job_id
      FROM JOB_MASTER
      WHERE customer_id = ?
        AND LOWER(TRIM(folder_path)) = LOWER(TRIM(?))
        AND UPPER(TRIM(file_type)) = UPPER(TRIM(?))
        AND is_enabled = 1
      LIMIT 1
      `,
      [
        customerId,
        folderPath,
        fileType,
      ]
    );

    if (existingJobs.length) {
      throw new AppError(
        409,
        "An active retention job already exists for this customer, folder, and file type.",
        "DUPLICATE_JOB"
      );
    }
  }

  // =========================================================
  // CREATE JOB
  // =========================================================

  const result = await db.query(
    `
    INSERT INTO JOB_MASTER
    (
      customer_id,
      project_name,
      folder_path,
      file_type,
      retention_hours,
      is_enabled,
      disable_reason,
      exclude_folder
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      customerId,
      projectName,
      folderPath,
      fileType,
      retentionHours,
      isEnabled,
      disableReason,
      excludeFolder,
    ]
  );

  return getJob(result.insertId);
}

async function updateJob(id, body) {
  // Get existing job
  const current = await getJob(id);

  // Merge existing values with edited values
  const merged = {
    ...current,
    ...body,
  };

  const values = jobValues(merged);

  // Resolve selected customer
  const customerId = await resolveCustomerId(merged);

  // Ensure customer exists
  await ensureCustomer(customerId);

  // Always use folder_path from CUSTOMER_MASTER
  const folderPath =
    await getCustomerFolderPath(customerId);

  const [
    ,
    projectName,
    ,
    fileType,
    retentionHours,
    isEnabled,
    disableReason,
    excludeFolder,
  ] = values;

  // =========================================================
  // PREVENT DUPLICATE ACTIVE JOB DURING EDIT
  //
  // Same:
  // customer + folder path + file type
  //
  // But ignore the job currently being edited.
  // =========================================================

  if (isEnabled) {
    const existingJobs = await db.query(
      `
      SELECT job_id
      FROM JOB_MASTER
      WHERE customer_id = ?
        AND LOWER(TRIM(folder_path)) = LOWER(TRIM(?))
        AND UPPER(TRIM(file_type)) = UPPER(TRIM(?))
        AND is_enabled = 1
        AND job_id <> ?
      LIMIT 1
      `,
      [
        customerId,
        folderPath,
        fileType,
        id,
      ]
    );

    if (existingJobs.length) {
      throw new AppError(
        409,
        "An active retention job already exists for this customer, folder, and file type.",
        "DUPLICATE_JOB"
      );
    }
  }

  // =========================================================
  // UPDATE JOB
  // =========================================================

  await db.query(
    `
    UPDATE JOB_MASTER
    SET
      customer_id = ?,
      project_name = ?,
      folder_path = ?,
      file_type = ?,
      retention_hours = ?,
      is_enabled = ?,
      disable_reason = ?,
      exclude_folder = ?
    WHERE job_id = ?
    `,
    [
      customerId,
      projectName,
      folderPath,
      fileType,
      retentionHours,
      isEnabled,
      disableReason,
      excludeFolder,
      id,
    ]
  );

  return getJob(id);
}
async function setJobStatus(
  id,
  changedBy,
  enabled,
  reason = null
) {
  await getJob(id);

  const nextEnabled = enabled ? 1 : 0;

  const action = enabled
    ? "Enabled"
    : "Disabled";

  const finalReason = enabled
    ? null
    : optionalString(
        reason || "Disabled by administrator",
        "reason",
        255
      );

  await db.transaction(async (connection) => {
    // =========================================================
    // LOCK + GET CURRENT JOB
    // =========================================================

    const [currentRows] =
      await connection.execute(
        `
        SELECT
          job_id,
          customer_id,
          folder_path,
          file_type,
          is_enabled
        FROM JOB_MASTER
        WHERE job_id = ?
        FOR UPDATE
        `,
        [id]
      );

    if (!currentRows.length) {
      throw new AppError(
        404,
        "Job not found",
        "NOT_FOUND"
      );
    }

    const currentJob = currentRows[0];

    const currentlyEnabled =
      Number(currentJob.is_enabled) === 1;

    // =========================================================
    // CHECK CURRENT STATUS
    // =========================================================

    if (
      currentlyEnabled ===
      Boolean(enabled)
    ) {
      throw new AppError(
        409,
        enabled
          ? "Job is already active."
          : "Job is already disabled.",
        enabled
          ? "JOB_ALREADY_ACTIVE"
          : "JOB_ALREADY_DISABLED"
      );
    }

    // =========================================================
    // IF ENABLING:
    // PREVENT DUPLICATE ACTIVE JOB
    // =========================================================

    if (enabled) {
      const [existingJobs] =
        await connection.execute(
          `
          SELECT job_id
          FROM JOB_MASTER
          WHERE customer_id = ?
            AND LOWER(TRIM(folder_path))
                = LOWER(TRIM(?))
            AND UPPER(TRIM(file_type))
                = UPPER(TRIM(?))
            AND is_enabled = 1
            AND job_id <> ?
          LIMIT 1
          `,
          [
            currentJob.customer_id,
            currentJob.folder_path,
            currentJob.file_type,
            id,
          ]
        );

      if (existingJobs.length) {
        throw new AppError(
          409,
          "Cannot activate this job because another active retention job already exists for this customer, folder, and file type.",
          "DUPLICATE_JOB"
        );
      }
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    const [updateResult] =
      await connection.execute(
        `
        UPDATE JOB_MASTER
        SET
          is_enabled = ?,
          disable_reason = ?
        WHERE job_id = ?
        `,
        [
          nextEnabled,
          finalReason,
          id,
        ]
      );

    if (
      updateResult.affectedRows !== 1
    ) {
      throw new AppError(
        409,
        enabled
          ? "Job could not be activated."
          : "Job could not be disabled.",
        enabled
          ? "JOB_ACTIVATE_FAILED"
          : "JOB_DISABLE_FAILED"
      );
    }

    // =========================================================
    // AUDIT HISTORY
    // =========================================================

    await connection.execute(
      `
      INSERT INTO JOB_STATUS_HISTORY
      (
        job_id,
        action,
        reason,
        changed_by
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        id,
        action,
        enabled
          ? "Activated by administrator"
          : finalReason,
        changedBy,
      ]
    );
  });

  return getJob(id);
}
function userStatusLabel(row) {
  if (row.role_name === "Customer User" && row.customer_id === null) return "Pending Customer Setup";
  return Number(row.status_flag) === 1 ? "Active" : "Inactive";
}

function userSelect() {
  return `SELECT u.user_id, u.username, u.role_id, r.role_name, r.role_name AS role, u.customer_id, c.customer_name, u.status AS status_flag, CASE WHEN r.role_name = 'Customer User' AND u.customer_id IS NULL THEN 'Pending Customer Setup' WHEN u.status = 1 THEN 'Active' ELSE 'Inactive' END AS status, u.created_at FROM USERS u LEFT JOIN ROLES r ON r.role_id = u.role_id LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = u.customer_id`;
}

async function listUsers(params) {
  const { page, pageSize, offset } = params;
  const search = params.search ? `%${params.search}%` : null;
  const status = params.status === undefined ? null : (params.status === "true" || params.status === "1" || params.status === "Active" ? 1 : 0);
  const where = ["(? IS NULL OR u.username LIKE ?)", "(? IS NULL OR u.status = ?)"];
  const values = [search, search, status, status];
  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM USERS u WHERE ${where.join(" AND ")}`, values);
  const rows = await db.query(`${userSelect()} WHERE ${where.join(" AND ")} ORDER BY u.user_id DESC LIMIT ${pageSize} OFFSET ${offset}`, values);
  return { rows: rows.map((row) => ({ ...row, status: userStatusLabel(row) })), meta: pageMeta(page, pageSize, totalFrom(totalRows)) };
}

async function listPendingCustomerUsers() {
  const rows = await db.query(`${userSelect()} WHERE r.role_name = 'Customer User' AND u.customer_id IS NULL AND u.status = 0 ORDER BY u.username ASC`);
  return rows.map((row) => ({ ...row, status: "Pending Customer Setup" }));
}

async function getUser(id) {
  const rows = await db.query(`${userSelect()} WHERE u.user_id = ?`, [id]);
  if (!rows.length) throw new AppError(404, "User not found", "NOT_FOUND");
  return { ...rows[0], status: userStatusLabel(rows[0]) };
}

async function resolveRoleId(body) {
  if (body.role_id !== undefined || body.roleId !== undefined) return integer(body.role_id ?? body.roleId, "role_id", { min: 1 });
  if (body.role !== undefined || body.role_name !== undefined || body.roleName !== undefined) {
    const roleName = requireString(body.role ?? body.role_name ?? body.roleName, "role", 50);
    const rows = await db.query("SELECT role_id FROM ROLES WHERE role_name = ?", [roleName]);
    if (!rows.length) throw new AppError(400, "role does not exist", "VALIDATION_ERROR");
    return rows[0].role_id;
  }
  throw new AppError(400, "role_id or role is required", "VALIDATION_ERROR");
}

async function roleNameFor(roleId) {
  const roleRows = await db.query("SELECT role_name FROM ROLES WHERE role_id = ?", [roleId]);
  if (!roleRows.length) throw new AppError(400, "role_id does not exist", "VALIDATION_ERROR");
  if (!["Admin", "Customer User"].includes(roleRows[0].role_name)) throw new AppError(400, "Only Admin and Customer User roles are supported", "VALIDATION_ERROR");
  return roleRows[0].role_name;
}

async function assertUsernameAvailable(username, excludeId = null) {
  const rows = await db.query(`SELECT user_id FROM USERS WHERE username = ? ${excludeId === null ? "" : "AND user_id <> ?"}`, excludeId === null ? [username] : [username, excludeId]);
  if (rows.length) throw new AppError(409, "Username already exists.", "USERNAME_EXISTS");
}

async function createUser(body) {
  const username = requireString(body.username, "username", 50);
  const password = requireString(body.password, "password", 200);
  const roleId = await resolveRoleId(body);
  const roleName = await roleNameFor(roleId);
  await assertUsernameAvailable(username);
  let customerId = null;
  let status = body.status === undefined ? true : booleanValue(body.status, "status");
  if (roleName === "Customer User") {
    if (body.customer_id === undefined && body.customerId === undefined || body.customer_id === null || body.customerId === null || body.customer_id === "" || body.customerId === "") {
      customerId = null;
      status = false;
    } else {
      customerId = integer(body.customer_id ?? body.customerId, "customer_id", { min: 1 });
      await ensureCustomer(customerId);
    }
  }
  if (roleName === "Admin") customerId = null;
  const hash = await bcrypt.hash(password, 12);
  try {
    const result = await db.query("INSERT INTO USERS (username, password, role_id, customer_id, status) VALUES (?, ?, ?, ?, ?)", [username, hash, roleId, customerId, status]);
    return getUser(result.insertId);
  } catch (error) {
    throw duplicateUsernameError(error);
  }
}

async function updateUser(id, body) {
  const current = await getUser(id);
  const fields = [];
  const values = [];
  if (body.username !== undefined) { const username = requireString(body.username, "username", 50); await assertUsernameAvailable(username, id); fields.push("username = ?"); values.push(username); }
  let roleId = current.role_id;
  if (has(body, "role_id", "roleId", "role", "role_name", "roleName")) {
    roleId = await resolveRoleId(body);
    fields.push("role_id = ?"); values.push(roleId);
  }
  const roleName = await roleNameFor(roleId);
  if (roleName === "Customer User") {
    const requested = has(body, "customer_id", "customerId") ? (body.customer_id ?? body.customerId) : current.customer_id;
    if (requested === null || requested === "" || requested === undefined) {
      fields.push("customer_id = NULL", "status = 0");
    } else {
      const customerId = integer(requested, "customer_id", { min: 1 });
      await ensureCustomer(customerId);
      fields.push("customer_id = ?"); values.push(customerId);
      if (body.status !== undefined) fields.push("status = ?"), values.push(booleanValue(body.status, "status"));
      else if (current.customer_id === null) fields.push("status = 1");
    }
  } else {
    fields.push("customer_id = NULL");
    if (body.status !== undefined) fields.push("status = ?"), values.push(booleanValue(body.status, "status"));
  }
  if (body.password !== undefined && String(body.password).trim()) { fields.push("password = ?"); values.push(await bcrypt.hash(requireString(body.password, "password", 200), 12)); }
  if (!fields.length) throw new AppError(400, "No supported fields supplied", "VALIDATION_ERROR");
  values.push(id);
  try {
    await db.query(`UPDATE USERS SET ${fields.join(", ")} WHERE user_id = ?`, values);
  } catch (error) {
    throw duplicateUsernameError(error);
  }
  return getUser(id);
}

async function deleteUser(id) {
  await getUser(id);
  if (Number(id) === 1) throw new AppError(409, "The primary administrator cannot be deleted", "USER_PROTECTED");
  await db.query("UPDATE USERS SET status = 0 WHERE user_id = ?", [id]);
  return { user_id: Number(id), disabled: true };
}

async function listRoles(params) {
  const { page, pageSize, offset } = params;
  const totalRows = await db.query("SELECT COUNT(*) AS total FROM ROLES WHERE role_name IN ('Admin', 'Customer User')");
  const rows = await db.query(`SELECT role_id, role_name, 'Active' AS status FROM ROLES WHERE role_name IN ('Admin', 'Customer User') ORDER BY role_id ASC LIMIT ${pageSize} OFFSET ${offset}`);
  return { rows, meta: pageMeta(page, pageSize, totalFrom(totalRows)) };
}

async function getRole(id) {
  const rows = await db.query("SELECT role_id, role_name, 'Active' AS status FROM ROLES WHERE role_id = ? AND role_name IN ('Admin', 'Customer User')", [id]);
  if (!rows.length) throw new AppError(404, "Role not found", "NOT_FOUND");
  return rows[0];
}

function fixedRoleMutation() {
  throw new AppError(405, "Roles are fixed system roles and cannot be changed.", "FIXED_ROLES");
}

module.exports = {
  listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
  listJobs,getJob,createJob,updateJob,setJobStatus,
  listUsers, listPendingCustomerUsers, getUser, createUser, updateUser, deleteUser,
  listRoles, getRole, createRole: fixedRoleMutation, updateRole: fixedRoleMutation, deleteRole: fixedRoleMutation
};
