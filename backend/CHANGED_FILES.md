# Member 3 — Centralized Error Handling and Error Logging

This package contains the changes applied to the uploaded File Retention System. The implementation preserves the existing Express, MySQL, JWT, React, and Axios architecture and adds centralized error capture, classification, database logging, safe responses, an administrator-only Error Logs API, and a filterable React page.

## Backend files changed or added

| File | Purpose |
|---|---|
| `middleware/http.js` | Adds request IDs, structured request logging, a proper unknown-route handler, centralized error classification, request sanitization, `ERROR_LOGS` persistence, safe JSON responses, and process-level console handling. |
| `utils/core.js` | Adds standard status constants, richer `AppError` metadata, and 422 validation behavior while preserving the existing response and async-handler helpers. |
| `utils/errorClassification.js` | Classifies application, database, filesystem, and unknown failures; infers modules from endpoint paths; assigns severity; and redacts sensitive request keys. |
| `services/logServices.js` | Stores extended structured errors, provides paginated/filterable Error Logs queries, and retains a temporary job-scoped fallback for the legacy schema during rollout. |
| `services/retentionServices.js` | Validates retention configuration, records `FILE_DELETE_ERROR` and retention failures with job/file context, continues after individual delete failures, and keeps scheduler-run state recoverable. |
| `controllers/controllers.js` | Passes severity, module, and status-code filters to the Error Logs query. |
| `routes/masterRoutes.js` | Makes the canonical `/error-logs` endpoint Admin-only. |
| `routes/operationalRoutes.js` | Makes `/errorlogs` and `/errorLogs` aliases Admin-only. |
| `server.js` | Sends scheduler failures, unhandled promise rejections, and uncaught exceptions into the centralized logging path. |
| `database/001_error_logs_centralized.sql` | Idempotent migration that makes `ERROR_LOGS.job_id` nullable, adds debugging metadata, and creates lookup indexes without creating a separate database. |
| `test/errorHandling.test.js` | Tests classification, module inference, safe database/filesystem messages, and sensitive request-data redaction. |
| `package.json` | Adds `npm run test:error`. |
| `.env.example` | Safe non-secret configuration template. |
| `README.md` | Documents migration, response envelopes, central middleware, and validation commands. |

## Frontend files changed

| File | Purpose |
|---|---|
| `src/App.jsx` | Places `/error-logs` under the Admin-only route guard. |
| `src/components/Sidebar.jsx` | Shows Error Logs only to administrators. |
| `src/pages/ErrorLogs.jsx` | Replaces the simple table with a filterable, paginated Admin Error Logs page displaying timestamp, severity, module, error type, status, endpoint, message, and request ID. It does not show stack traces or raw request payloads by default. |
| `src/styles/errorLogs.css` | Adds styling for filters, safe severity labels, wide-table scrolling, empty/error states, and pagination. |

## Database rollout

Apply the supplied base schema first, then apply `database/001_error_logs_centralized.sql` against the same database. No separate database is created. The migration preserves existing rows and allows errors without a retention `job_id`, which is required for authentication, routing, database, and other request-level failures.

## Verification completed

The backend passed `node --check` for every JavaScript file, `npm run check`, and `npm run test:error`. The frontend production bundle passed after restoring the missing optional Vite native binding in the supplied `node_modules` directory. A live MySQL integration test was not performed because the uploaded environment did not provide a running database connection.
