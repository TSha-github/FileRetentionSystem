# File Retention System Backend

This is the corrected backend implementation for the exact SQL database supplied in `pasted_content_5.txt`. The database schema is the source of truth. The backend does not create, rename, or duplicate tables, and it does not query a table that is absent from that SQL.

## Exact tables used

The backend uses only these tables and the columns defined by the supplied SQL:

| Table | Columns used |
|---|---|
| `ROLES` | `role_id`, `role_name` |
| `USERS` | `user_id`, `username`, `password`, `role_id`, `status`, `created_at` |
| `CUSTOMER_MASTER` | `customer_id`, `customer_name`, `description`, `status`, `created_at` |
| `JOB_MASTER` | `job_id`, `customer_id`, `project_name`, `folder_path`, `file_type`, `retention_hours`, `is_enabled`, `disable_reason`, `exclude_folder`, `created_at` |
| `DELETE_LOGS` | `delete_log_id`, `job_id`, `customer_id`, `file_name`, `file_path`, `file_type`, `file_created_at`, `deleted_at`, `retention_hours`, `status` |
| `ERROR_LOGS` | Base columns plus `error_type`, `status_code`, `http_method`, `api_endpoint`, `user_id`, `username`, `ip_address`, `stack_trace`, `request_data`, `module`, `severity`, `request_id` after migration |
| `SCHEDULER_LOGS` | `scheduler_log_id`, `start_time`, `end_time`, `jobs_processed`, `job_id`, `files_deleted`, `errors_count`, `status` |
| `JOB_STATUS_HISTORY` | `history_id`, `job_id`, `action`, `reason`, `changed_by`, `changed_at` |

The schema defines `JOB_STATUS_HISTORY.changed_by` as an integer foreign key to `USERS.user_id`. The backend therefore writes the authenticated numeric `user_id` and joins `USERS` when returning history so React receives the username in the `changed_by` display field.

The schema does not define `ROLES.status`. The backend returns a compatibility-only `status: "Active"` alias for the existing Role Management UI, but it does not store or update role status. A persistent role status feature would require a schema change, which this implementation deliberately does not make.

## Authentication and sample users

`POST /login` looks up `USERS`, rejects inactive accounts, compares the supplied password with the stored value using bcrypt, and returns a JWT containing `user_id`, `username`, `role_id`, and the joined role name. The sample SQL values such as `encrypted_admin123` are not valid bcrypt hashes merely because they contain the word `encrypted`; login will fail until those rows are replaced with real bcrypt hashes. The backend does not add a plaintext-password fallback.

## Important retention safety behavior

`GET /jobs` only executes a parameterized `SELECT` against `JOB_MASTER` and `CUSTOMER_MASTER`. It never scans folders, runs retention, or deletes files.

File deletion is available only through `POST /retention/run` or `POST /api/retention/run`, and that operation requires an Admin JWT. The request body may contain `{ "job_id": 1, "dry_run": false }`; omit `job_id` to process all enabled jobs. `dry_run: true` scans but never calls `unlink`. `RETENTION_ROOT` restricts deletion to an approved root. Jobs with `exclude_folder = TRUE`, no folder path, or no retention hours are logged as `Skipped`.

Successful physical deletion creates a `DELETE_LOGS` row with status `Success`. A failed deletion attempts to create a `DELETE_LOGS` row with status `Failed` and also creates an `ERROR_LOGS` row. Scheduler execution writes `SCHEDULER_LOGS` rows using the supplied columns and status vocabulary such as `Running`, `Completed`, `Completed with Errors`, `Failed`, and `Skipped`.

## Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/login`, `/api/login`, `/api/auth/login` | Public | bcrypt login and JWT creation |
| GET | `/health`, `/api/health` | Public | Database readiness check |
| GET | `/customers`, `/api/customers` | Admin/Report User | Paginated customer list |
| POST/PATCH/DELETE | `/customers`, `/customers/:id` and `/api/...` | Admin | Customer CRUD; deletion is blocked when jobs reference the customer |
| GET | `/jobs`, `/jobs/:id` and `/api/...` | Admin/Report User | Safe job reads only |
| POST/PATCH/DELETE | `/jobs`, `/jobs/:id` and `/api/...` | Admin | Job CRUD/retirement plus status history |
| GET | `/users`, `/users/:id` and `/api/...` | Admin | User reads |
| POST/PATCH/DELETE | `/users`, `/users/:id` and `/api/...` | Admin | User CRUD with bcrypt hashing and disable-on-delete behavior |
| GET | `/roles`, `/roles/:id` and `/api/...` | Admin/Report User | Role reads |
| POST/PATCH/DELETE | `/roles`, `/roles/:id` and `/api/...` | Admin | Role CRUD; status is not persisted because the schema has no status column |
| GET | `/dashboard`, `/api/dashboard` | Admin/Report User | Dashboard counts and recent logs |
| GET | `/deleteLogs`, `/api/deleteLogs` | Admin/Report User | Paginated deletion history |
| GET | `/error-logs`, `/errorlogs`, `/errorLogs` and `/api/...` | Admin | Paginated, filterable technical error history |
| GET | `/job-history`, `/jobHistory`, `/api/job-history` | Admin/Report User | Job status history with username display alias |
| GET | `/scheduler-logs`, `/schedulerLogs`, `/api/scheduler-logs` | Admin/Report User | Scheduler history |
| GET | `/reports`, `/api/reports` | Admin/Report User | Derived per-job report aggregates and summary |
| GET | `/scheduler/status`, `/api/scheduler/status` | Admin/Report User | Current in-process scheduler state |
| POST | `/retention/run`, `/api/retention/run` | Admin | Explicit retention execution or dry run |

Collections return `{ data: [...], meta: { page, pageSize, total, totalPages } }`. Objects return `{ data: {...} }`; failures return `{ success: false, message, error: { code, message, requestId } }`. Internal stack traces, SQL details, credentials, and raw passwords are never returned to the frontend.

## Centralized error handling

Every asynchronous controller uses `asyncHandler`, so rejected promises reach `middleware/http.js` instead of requiring repetitive controller-level `try/catch` blocks. The final middleware classifies known application, database, filesystem, and unknown errors; sanitizes request data; writes `ERROR_LOGS`; emits structured console output; and returns a safe response. Apply `database/001_error_logs_centralized.sql` after the base SQL before starting the server. The migration makes `job_id` nullable so route, authentication, database, and other request-level failures can be recorded without a retention job.

Use `npm run test:error` for deterministic classification and sanitization checks, `npm run check` for backend syntax checks, and `npm run build` in the frontend project for the production bundle.

## React compatibility mapping

The backend includes both exact schema-native values and aliases used by the uploaded React mock pages. For example, customers include `customer_id` and `id`, `customer_name` and `name`, plus `status_flag` and display `status`. Jobs include `customer_name`, `project_name`, `folder_path`, `file_type`, `retention_hours`, `is_enabled`, and the existing React-friendly display aliases. Users include both `role_name` and `role`; error logs include both `error_id`/`error_message`/`error_time` and `id`/`message`/`time` aliases.

The uploaded React pages are currently local-state/mock-data pages rather than API-connected pages. The backend now exposes the required contracts, but the frontend still needs its `api.js`, page state, and form handlers connected to these endpoints to replace the imported mock arrays.

Reports are derived from existing tables because the exact schema has no report table. Each report row is grouped by job and includes the frontend fields `report_id`, `customer_name`, `project_name`, `file_type`, `files_processed`, `files_deleted`, `errors`, and `status`.

## Configuration and run

Copy `.env.example` to `.env`, set the real database credentials and a strong `JWT_SECRET`, and configure `CORS_ORIGINS` to the React origin. On a Windows host, use a Windows path for `RETENTION_ROOT` that contains the configured job folders. Automatic scheduling is disabled by default; enable it only after manually testing `POST /retention/run` with `dry_run: true`.

```bash
npm install
npm start
```

## Verification and remaining environment dependency

The generated JavaScript is syntax-checked with `node --check`, and static checks confirm that only the eight supplied tables are referenced, no `USER_LOGS` SQL remains, and `GET /jobs` is not wired to retention execution. The server can start with isolated configuration; a live CRUD/login/report/retention test requires access to the actual MySQL database. The supplied SQL defines data types and foreign keys, so the backend has been aligned to those definitions, but the real database still needs to be running and populated with bcrypt-compatible passwords before end-to-end verification.
