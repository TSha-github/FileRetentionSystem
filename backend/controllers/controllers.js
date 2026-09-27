// const { AppError, asyncHandler, ok, created, pageParams, requireString } = require("../utils/core");
// const master = require("../services/masterService");
// const system = require("../services/systemServices");
// const logs = require("../services/logServices");
// const reports = require("../services/reportService");
// const retention = require("../services/retentionServices");

// const id = (req) => {
//   const value = Number(req.params.id);
//   if (!Number.isInteger(value) || value < 1) throw new AppError(400, "Invalid id", "VALIDATION_ERROR");
//   return value;
// };

// const login = asyncHandler(async (req, res) => {
//   const username = requireString(req.body.username, "username", 100);
//   const password = requireString(req.body.password, "password", 200);
//   return ok(res, await system.login(username, password));
// });

// function crud(service) {
//   return {
//     list: asyncHandler(async (req, res) => { const p = pageParams(req); const result = await service.list({ ...p, ...req.query }); return ok(res, result.rows, 200, result.meta); }),
//     get: asyncHandler(async (req, res) => ok(res, await service.get(id(req)))),
//     create: asyncHandler(async (req, res) => created(res, await service.create(req.body))),
//     update: asyncHandler(async (req, res) => ok(res, await service.update(id(req), req.body))),
//     remove: asyncHandler(async (req, res) => ok(res, await service.remove(id(req))))
//   };
// }

// const customers = crud({ list: master.listCustomers, get: master.getCustomer, create: master.createCustomer, update: master.updateCustomer, remove: master.deleteCustomer });
// const jobs = {
//   list: asyncHandler(async (req, res) => { const p = pageParams(req); const result = await master.listJobs({ ...p, ...req.query, user: req.user }); return ok(res, result.rows, 200, result.meta); }),
//   get: asyncHandler(async (req, res) => ok(res, await master.getJob(id(req), req.user))),
//   create: asyncHandler(async (req, res) => { const createdJob = await master.createJob(req.body); await logs.addHistory({ jobId: createdJob.job_id, action: "Created", reason: req.body.reason || null, changedBy: req.user.user_id }); return created(res, createdJob); }),
//   update: asyncHandler(async (req, res) => { const jobId = id(req); const result = await master.updateJob(jobId, req.body); await logs.addHistory({ jobId, action: "Updated", reason: req.body.reason || null, changedBy: req.user.user_id }); return ok(res, result); }),
//   retire: asyncHandler(async (req, res) => { const jobId = id(req); const result = await master.retireJob(jobId); await logs.addHistory({ jobId, action: "Disabled", reason: req.body.reason || "Retired", changedBy: req.user.user_id }); return ok(res, result); })
// };

// const users = crud({ list: master.listUsers, get: master.getUser, create: master.createUser, update: master.updateUser, remove: master.deleteUser });
// users.pending = asyncHandler(async (req, res) => ok(res, await master.listPendingCustomerUsers()));
// users.resetPassword = asyncHandler(async (req, res) => ok(res, await system.resetPassword(id(req), req.body)));

// const roles = crud({ list: master.listRoles, get: master.getRole, create: master.createRole, update: master.updateRole, remove: master.deleteRole });

// const changePassword = asyncHandler(async (req, res) => ok(res, await system.changePassword(req.user.user_id, req.body)));
// const dashboard = asyncHandler(async (req, res) => ok(res, await system.dashboard(req.user)));
// const deleteLogs = asyncHandler(async (req, res) => { const p = pageParams(req); const result = await logs.listDeleteLogs({ ...p, user: req.user, customerId: req.query.customer_id, jobId: req.query.job_id, status: req.query.status, from: req.query.from, to: req.query.to }); return ok(res, result.rows, 200, result.meta); });
// const errorLogs = asyncHandler(async (req, res) => { const p = pageParams(req); const result = await logs.listErrorLogs({ ...p, user: req.user, jobId: req.query.job_id, severity: req.query.severity, module: req.query.module, statusCode: req.query.status_code, from: req.query.from, to: req.query.to }); return ok(res, result.rows, 200, result.meta); });
// const jobHistory = asyncHandler(async (req, res) => { const p = pageParams(req); const result = await logs.listHistory({ ...p, user: req.user, jobId: req.query.job_id, action: req.query.action }); return ok(res, result.rows, 200, result.meta); });
// const schedulerLogs = asyncHandler(async (req, res) => { const p = pageParams(req); const result = await logs.listSchedulerLogs({ ...p, user: req.user, status: req.query.status, from: req.query.from, to: req.query.to }); return ok(res, result.rows, 200, result.meta); });
// const report = asyncHandler(async (req, res) => { const p = pageParams(req); const summary = await reports.getSummary({ user: req.user, from: req.query.from, to: req.query.to, customerId: req.query.customer_id, jobId: req.query.job_id }); const detail = await reports.listRows({ ...p, user: req.user, from: req.query.from, to: req.query.to, customerId: req.query.customer_id, jobId: req.query.job_id }); return ok(res, { summary, rows: detail.rows }, 200, detail.meta); });
// const downloadReport = asyncHandler(async (req, res) => {
//   const customerId = req.query.customer_id === undefined ? undefined : Number(req.query.customer_id);
//   if (customerId !== undefined && (!Number.isInteger(customerId) || customerId < 1)) throw new AppError(400, "customer_id must be a positive integer", "VALIDATION_ERROR");
//   const file = await reports.generateDownloadReport({ user: req.user, customerId, from: req.query.from, to: req.query.to });
//   res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
//   res.setHeader("Content-Type", file.contentType);
//   return res.send(file.buffer);
// });
// const runRetention = asyncHandler(async (req, res) => { const jobId = req.body.job_id === undefined ? null : Number(req.body.job_id); if (jobId !== null && (!Number.isInteger(jobId) || jobId < 1)) throw new AppError(400, "job_id must be a positive integer", "VALIDATION_ERROR"); const dryRun = req.body.dry_run === true || req.body.dry_run === "true"; return created(res, await retention.runRetention({ jobId, dryRun })); });
// const schedulerStatus = asyncHandler(async (req, res) => ok(res, retention.status()));
// const health = asyncHandler(async (req, res) => ok(res, await system.health()));

// module.exports = { login, changePassword, customers, jobs, users, roles, dashboard, deleteLogs, errorLogs, jobHistory, schedulerLogs, report, downloadReport, runRetention, schedulerStatus, health };

const {
  AppError,
  asyncHandler,
  ok,
  created,
  pageParams,
  requireString,
} = require("../utils/core");

const master = require("../services/masterService");
const system = require("../services/systemServices");
const logs = require("../services/logServices");
const reports = require("../services/reportService");
const retention = require("../services/retentionServices");

// ==================================================
// ID VALIDATION
// ==================================================

const id = (req) => {
  const value = Number(req.params.id);

  if (!Number.isInteger(value) || value < 1) {
    throw new AppError(
      400,
      "Invalid id",
      "VALIDATION_ERROR"
    );
  }

  return value;
};

// ==================================================
// SAFE REQUEST BODY
// ==================================================

const bodyOf = (req) =>
  req.body && typeof req.body === "object"
    ? req.body
    : {};

// ==================================================
// LOGIN
// ==================================================

const login = asyncHandler(async (req, res) => {
  const body = bodyOf(req);

  const username = requireString(
    body.username,
    "username",
    100
  );

  const password = requireString(
    body.password,
    "password",
    200
  );

  return ok(
    res,
    await system.login(
      username,
      password
    )
  );
});

// ==================================================
// GENERIC CRUD
// ==================================================

function crud(service) {
  return {
    list: asyncHandler(async (req, res) => {
      const p = pageParams(req);

      const result = await service.list({
        ...p,
        ...req.query,
      });

      return ok(
        res,
        result.rows,
        200,
        result.meta
      );
    }),

    get: asyncHandler(async (req, res) => {
      return ok(
        res,
        await service.get(id(req))
      );
    }),

    create: asyncHandler(async (req, res) => {
      return created(
        res,
        await service.create(
          bodyOf(req)
        )
      );
    }),

    update: asyncHandler(async (req, res) => {
      return ok(
        res,
        await service.update(
          id(req),
          bodyOf(req)
        )
      );
    }),

    remove: asyncHandler(async (req, res) => {
      return ok(
        res,
        await service.remove(
          id(req)
        )
      );
    }),
  };
}

// ==================================================
// CUSTOMERS
// ==================================================

const customers = crud({
  list: master.listCustomers,
  get: master.getCustomer,
  create: master.createCustomer,
  update: master.updateCustomer,
  remove: master.deleteCustomer,
});

// ==================================================
// JOBS
// ==================================================

const jobs = {
  list: asyncHandler(async (req, res) => {
    const p = pageParams(req);

    const result = await master.listJobs({
      ...p,
      ...req.query,
      user: req.user,
    });

    return ok(
      res,
      result.rows,
      200,
      result.meta
    );
  }),

  get: asyncHandler(async (req, res) => {
    return ok(
      res,
      await master.getJob(
        id(req),
        req.user
      )
    );
  }),

  create: asyncHandler(async (req, res) => {
    const body = bodyOf(req);

    const createdJob =
      await master.createJob(body);

    /*
     * Job creation is still logged here.
     * Retire is different because retire + history
     * should happen together transactionally
     * inside masterService.
     */
    await logs.addHistory({
      jobId: createdJob.job_id,
      action: "Created",
      reason:
        typeof body.reason === "string" &&
        body.reason.trim()
          ? body.reason.trim()
          : null,
      changedBy: req.user.user_id,
    });

    return created(
      res,
      createdJob
    );
  }),

  update: asyncHandler(async (req, res) => {
    const body = bodyOf(req);
    const jobId = id(req);

    const result =
      await master.updateJob(
        jobId,
        body
      );

    await logs.addHistory({
      jobId,
      action: "Updated",
      reason:
        typeof body.reason === "string" &&
        body.reason.trim()
          ? body.reason.trim()
          : null,
      changedBy: req.user.user_id,
    });

    return ok(
      res,
      result
    );
  }),

setStatus: asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  const jobId = id(req);

  if (
    typeof body.is_enabled !==
    "boolean"
  ) {
    throw new AppError(
      400,
      "is_enabled must be true or false",
      "VALIDATION_ERROR"
    );
  }

  const reason =
    typeof body.reason === "string" &&
    body.reason.trim()
      ? body.reason.trim()
      : body.is_enabled
        ? "Activated by administrator"
        : "Disabled by administrator";

  const result =
    await master.setJobStatus(
      jobId,
      req.user.user_id,
      body.is_enabled,
      reason
    );

  return ok(
    res,
    result
  );
}),
};

// ==================================================
// USERS
// ==================================================

const users = crud({
  list: master.listUsers,
  get: master.getUser,
  create: master.createUser,
  update: master.updateUser,
  remove: master.deleteUser,
});

users.pending = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      await master.listPendingCustomerUsers()
    );
  }
);

users.resetPassword = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      await system.resetPassword(
        id(req),
        bodyOf(req)
      )
    );
  }
);

// ==================================================
// ROLES
// ==================================================

const roles = crud({
  list: master.listRoles,
  get: master.getRole,
  create: master.createRole,
  update: master.updateRole,
  remove: master.deleteRole,
});

// ==================================================
// CHANGE PASSWORD
// ==================================================

const changePassword = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      await system.changePassword(
        req.user.user_id,
        bodyOf(req)
      )
    );
  }
);

// ==================================================
// DASHBOARD
// ==================================================

const dashboard = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      await system.dashboard(
        req.user
      )
    );
  }
);

// ==================================================
// DELETE LOGS
// ==================================================

const deleteLogs = asyncHandler(
  async (req, res) => {
    const p = pageParams(req);

    const result =
      await logs.listDeleteLogs({
        ...p,
        user: req.user,
        customerId:
          req.query.customer_id,
        jobId:
          req.query.job_id,
        status:
          req.query.status,
        from:
          req.query.from,
        to:
          req.query.to,
      });

    return ok(
      res,
      result.rows,
      200,
      result.meta
    );
  }
);

// ==================================================
// ERROR LOGS
// ==================================================

const errorLogs = asyncHandler(
  async (req, res) => {
    const p = pageParams(req);

    const result =
      await logs.listErrorLogs({
        ...p,
        user: req.user,
        jobId:
          req.query.job_id,
        severity:
          req.query.severity,
        module:
          req.query.module,
        statusCode:
          req.query.status_code,
        from:
          req.query.from,
        to:
          req.query.to,
      });

    return ok(
      res,
      result.rows,
      200,
      result.meta
    );
  }
);

// ==================================================
// JOB HISTORY
// ==================================================

const jobHistory = asyncHandler(
  async (req, res) => {
    const p = pageParams(req);

    const result =
      await logs.listHistory({
        ...p,
        user: req.user,
        jobId:
          req.query.job_id,
        action:
          req.query.action,
      });

    return ok(
      res,
      result.rows,
      200,
      result.meta
    );
  }
);

// ==================================================
// SCHEDULER LOGS
// ==================================================

const schedulerLogs = asyncHandler(
  async (req, res) => {
    const p = pageParams(req);

    const result =
      await logs.listSchedulerLogs({
        ...p,
        user: req.user,
        status:
          req.query.status,
        from:
          req.query.from,
        to:
          req.query.to,
      });

    return ok(
      res,
      result.rows,
      200,
      result.meta
    );
  }
);

// ==================================================
// REPORT
// ==================================================

const report = asyncHandler(
  async (req, res) => {
    const p = pageParams(req);

    const summary =
      await reports.getSummary({
        user: req.user,
        from:
          req.query.from,
        to:
          req.query.to,
        customerId:
          req.query.customer_id,
        jobId:
          req.query.job_id,
      });

    const detail =
      await reports.listRows({
        ...p,
        user: req.user,
        from:
          req.query.from,
        to:
          req.query.to,
        customerId:
          req.query.customer_id,
        jobId:
          req.query.job_id,
      });

    return ok(
      res,
      {
        summary,
        rows: detail.rows,
      },
      200,
      detail.meta
    );
  }
);

// ==================================================
// DOWNLOAD REPORT
// ==================================================

const downloadReport = asyncHandler(
  async (req, res) => {
    const customerId =
      req.query.customer_id === undefined
        ? undefined
        : Number(
            req.query.customer_id
          );

    if (
      customerId !== undefined &&
      (
        !Number.isInteger(
          customerId
        ) ||
        customerId < 1
      )
    ) {
      throw new AppError(
        400,
        "customer_id must be a positive integer",
        "VALIDATION_ERROR"
      );
    }

    const file =
      await reports.generateDownloadReport(
        {
          user: req.user,
          customerId,
          from:
            req.query.from,
          to:
            req.query.to,
        }
      );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );

    res.setHeader(
      "Content-Type",
      file.contentType
    );

    return res.send(
      file.buffer
    );
  }
);

// ==================================================
// RETENTION API
// ==================================================

const runRetention = asyncHandler(
  async (req, res) => {
    const body = bodyOf(req);

    const jobId =
      body.job_id === undefined
        ? null
        : Number(
            body.job_id
          );

    if (
      jobId !== null &&
      (
        !Number.isInteger(jobId) ||
        jobId < 1
      )
    ) {
      throw new AppError(
        400,
        "job_id must be a positive integer",
        "VALIDATION_ERROR"
      );
    }

    const dryRun =
      body.dry_run === true ||
      body.dry_run === "true";

    return created(
      res,
      await retention.runRetention(
        {
          jobId,
          dryRun,
        }
      )
    );
  }
);

// ==================================================
// SCHEDULER STATUS
// ==================================================

const schedulerStatus = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      retention.status()
    );
  }
);

// ==================================================
// HEALTH
// ==================================================

const health = asyncHandler(
  async (req, res) => {
    return ok(
      res,
      await system.health()
    );
  }
);

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
  login,
  changePassword,
  customers,
  jobs,
  users,
  roles,
  dashboard,
  deleteLogs,
  errorLogs,
  jobHistory,
  schedulerLogs,
  report,
  downloadReport,
  runRetention,
  schedulerStatus,
  health,
};