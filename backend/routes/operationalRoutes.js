// // // const express = require("express");
// // // const { authenticateToken, authorizeRoles } = require("../middleware/auth");
// // // const { dashboard, deleteLogs, errorLogs, jobHistory, schedulerLogs, report, runRetention, schedulerStatus, health } = require("../controllers/controllers");

// // // const router = express.Router();
// // // const protect = authenticateToken;
// // // const readRoles = authorizeRoles("Admin", "Report User");

// // // router.get("/health", health);
// // // router.get("/dashboard", protect, readRoles, dashboard);
// // // router.get("/deleteLogs", protect, readRoles, deleteLogs);
// // // router.get("/errorlogs", protect, adminOnly, errorLogs);
// // // router.get("/errorLogs", protect, adminOnly, errorLogs);
// // // router.get("/job-history", protect, readRoles, jobHistory);
// // // router.get("/jobHistory", protect, readRoles, jobHistory);
// // // router.get("/scheduler-logs", protect, readRoles, schedulerLogs);
// // // router.get("/schedulerLogs", protect, readRoles, schedulerLogs);
// // // router.get("/reports", protect, readRoles, report);
// // // router.get("/scheduler/status", protect, readRoles, schedulerStatus);
// // // router.post("/retention/run", protect, authorizeRoles("Admin"), runRetention);

// // // module.exports = router;
// // const express = require("express");
// // const { authenticateToken, authorizeRoles } = require("../middleware/auth");
// // const {
// //   dashboard,
// //   deleteLogs,
// //   errorLogs,
// //   jobHistory,
// //   schedulerLogs,
// //   report,
// //   runRetention,
// //   schedulerStatus,
// //   health,
// // } = require("../controllers/controllers");

// // const router = express.Router();
// // const protect = authenticateToken;
// // const readRoles = authorizeRoles("Admin", "Report User");
// // const adminOnly = authorizeRoles("Admin");

// // router.get("/health", health);

// // // Dashboard and Reports are available to Admin and Report User.
// // router.get("/dashboard", protect, readRoles, dashboard);
// // router.get("/reports", protect, readRoles, report);

// // // Operational logs are Admin-only.
// // router.get("/deleteLogs", protect, adminOnly, deleteLogs);
// // router.get("/errorlogs", protect, adminOnly, errorLogs);
// // router.get("/errorLogs", protect, adminOnly, errorLogs);
// // router.get("/job-history", protect, adminOnly, jobHistory);
// // router.get("/jobHistory", protect, adminOnly, jobHistory);
// // router.get("/scheduler-logs", protect, adminOnly, schedulerLogs);
// // router.get("/schedulerLogs", protect, adminOnly, schedulerLogs);
// // router.get("/scheduler/status", protect, adminOnly, schedulerStatus);

// // // Only Admin can manually run retention.
// // router.post("/retention/run", protect, adminOnly, runRetention);

// // module.exports = router;
// const express = require("express");
// const { authenticateToken, authorizeRoles } = require("../middleware/auth");
// const { dashboard, deleteLogs, errorLogs, jobHistory, schedulerLogs, report, runRetention, schedulerStatus, health } = require("../controllers/controllers");

// const router = express.Router();
// const protect = authenticateToken;
// const readRoles = authorizeRoles("Admin", "Report User");

// router.get("/health", health);
// router.get("/dashboard", protect, readRoles, dashboard);
// router.get("/deleteLogs", protect, readRoles, deleteLogs);
// router.get("/errorlogs", protect, adminOnly, errorLogs);
// router.get("/errorLogs", protect, adminOnly, errorLogs);
// router.get("/job-history", protect, readRoles, jobHistory);
// router.get("/jobHistory", protect, readRoles, jobHistory);
// router.get("/scheduler-logs", protect, readRoles, schedulerLogs);
// router.get("/schedulerLogs", protect, readRoles, schedulerLogs);
// router.get("/reports", protect, readRoles, report);
// router.get("/scheduler/status", protect, readRoles, schedulerStatus);
// router.post("/retention/run", protect, authorizeRoles("Admin"), runRetention);

// module.exports = router;
const express = require("express");
const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth");

const {
  dashboard,
  deleteLogs,
  errorLogs,
  jobHistory,
  schedulerLogs,
  report,
  downloadReport,
  runRetention,
  schedulerStatus,
  health
} = require("../controllers/controllers");

const router = express.Router();

const protect = authenticateToken;
const readRoles = authorizeRoles("Admin", "Customer User");
const adminOnly = authorizeRoles("Admin");

// Health
router.get("/health", health);

// Dashboard
router.get("/dashboard", protect, readRoles, dashboard);

// Reports
router.get("/reports", protect, readRoles, report);

// Download Report
router.get("/reports/download", protect, readRoles, downloadReport);

// Delete Logs
router.get("/deleteLogs", protect, readRoles, deleteLogs);

// Error Logs
router.get("/errorlogs", protect, adminOnly, errorLogs);
router.get("/errorLogs", protect, adminOnly, errorLogs);

// Job History
router.get("/job-history", protect, readRoles, jobHistory);
router.get("/jobHistory", protect, readRoles, jobHistory);

// Scheduler Logs
router.get("/scheduler-logs", protect, readRoles, schedulerLogs);
router.get("/schedulerLogs", protect, readRoles, schedulerLogs);

// Scheduler Status
router.get("/scheduler/status", protect, readRoles, schedulerStatus);

// Retention - Admin only
router.post("/retention/run", protect, adminOnly, runRetention);

module.exports = router;