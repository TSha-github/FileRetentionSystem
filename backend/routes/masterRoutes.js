const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { customers, jobs, users, roles, changePassword, schedulerLogs, jobHistory, deleteLogs, errorLogs } = require("../controllers/controllers");

const router = express.Router();
const protect = authenticateToken;
const adminOnly = authorizeRoles("Admin");
const readRoles = authorizeRoles("Admin", "Customer User");

router.get("/customers", protect, adminOnly, customers.list);
router.get("/customers/:id", protect, adminOnly, customers.get);
router.post("/customers", protect, adminOnly, customers.create);
router.patch("/customers/:id", protect, adminOnly, customers.update);
router.delete("/customers/:id", protect, adminOnly, customers.remove);

router.get("/jobs", protect, readRoles, jobs.list);
router.get("/jobs/:id", protect, readRoles, jobs.get);
router.post("/jobs", protect, adminOnly, jobs.create);
router.patch("/jobs/:id", protect, adminOnly, jobs.update);
router.patch(
  "/jobs/:id/status",
  protect,
  adminOnly,
  jobs.setStatus
);
router.get("/users", protect, adminOnly, users.list);
router.get("/users/pending-customer-users", protect, adminOnly, users.pending);
router.get("/users/:id", protect, adminOnly, users.get);
router.post("/users", protect, adminOnly, users.create);
router.patch("/users/:id", protect, adminOnly, users.update);
router.patch("/users/:id/password", protect, adminOnly, users.resetPassword);
router.delete("/users/:id", protect, adminOnly, users.remove);

router.get("/roles", protect, adminOnly, roles.list);
router.get("/roles/:id", protect, adminOnly, roles.get);
router.post("/roles", protect, adminOnly, roles.create);
router.patch("/roles/:id", protect, adminOnly, roles.update);
router.delete("/roles/:id", protect, adminOnly, roles.remove);

router.patch("/me/password", protect, changePassword);

router.get("/delete-logs", protect, readRoles, deleteLogs);
router.get("/error-logs", protect, adminOnly, errorLogs);
router.get("/job-history", protect, readRoles, jobHistory);
router.get("/scheduler-logs", protect, readRoles, schedulerLogs);

module.exports = router;
