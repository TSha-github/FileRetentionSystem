require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const authRoutes = require("./routes/authRoutes");
const masterRoutes = require("./routes/masterRoutes");
const operationalRoutes = require("./routes/operationalRoutes");
const { requestContext, notFound, errorHandler, handleProcessError } = require("./middleware/http");
const { runRetention } = require("./services/retentionServices");
const { createErrorLog } = require("./services/logServices");
const db = require("./config/db");

const app = express();
const port = Number(process.env.PORT || 3000);
const origins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);

app.use(cors({ origin: origins, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(requestContext);
app.use("/api/auth", authRoutes);
app.use("/api", masterRoutes);
app.use("/api", operationalRoutes);
app.get("/", (req, res) => res.json({ data: { service: "File Retention System Backend", status: "running" } }));
app.use(notFound);
app.use(errorHandler);

let schedulerTask;
if (process.env.SCHEDULER_ENABLED === "true") {
  schedulerTask = cron.schedule(process.env.SCHEDULER_CRON || "*/15 * * * *", async () => {
    try {
      await runRetention({ dryRun: false });
    } catch (error) {
      handleProcessError(error, "scheduler");
      await createErrorLog({ error_type: "SCHEDULER_FAILURE", error_message: error.message, status_code: 500, module: "scheduler", severity: "ERROR", stack_trace: error.stack });
    }
  });
}

const server = app.listen(port, () => console.log(`File Retention System backend listening on port ${port}`));

async function shutdown(signal) {
  console.log(`${signal}: shutting down`);
  if (schedulerTask) schedulerTask.stop();
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", async (error) => {
  handleProcessError(error, "unhandledRejection");
  try { await createErrorLog({ error_type: "UNHANDLED_REJECTION", error_message: error?.message, status_code: 500, module: "process", severity: "CRITICAL", stack_trace: error?.stack }); } catch (logError) { handleProcessError(logError, "unhandledRejection.logger"); }
});

process.on("uncaughtException", async (error) => {
  handleProcessError(error, "uncaughtException");
  try { await createErrorLog({ error_type: "UNCAUGHT_EXCEPTION", error_message: error?.message, status_code: 500, module: "process", severity: "CRITICAL", stack_trace: error?.stack }); } catch (logError) { handleProcessError(logError, "uncaughtException.logger"); }
  process.exit(1);
});

module.exports = { app, server };
