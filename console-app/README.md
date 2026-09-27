# FileRetentionConsole

`FileRetentionConsole` is the official retention executor for the staging architecture. The React application remains an administration and reporting interface, while the Node.js backend provides authentication, authorization, CRUD, reports, and audit-log APIs. Automatic Node scheduling should remain disabled when this worker is enabled.

## Configuration

Copy `appsettings.json` to the published worker directory and replace the placeholder password. Alternatively, set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `RETENTION_ROOT`, `FileTimeMode`, and `CommandTimeoutSeconds` as environment variables. The canonical staging database name is `FileRetentionSystemSecure1`.

`RetentionRoot` is mandatory. Every configured job folder must be the root itself or a child of that root. The worker scans only the immediate files in each job folder and never recursively deletes subdirectories.

`FileTimeMode` accepts `CreationTime` or `LastWriteTime`. The selected mode must match the retention policy agreed by the project owner. The default is `CreationTime` to match the current Node reference implementation.

## Commands

```text
FileRetentionConsole.exe --help
FileRetentionConsole.exe --self-test
FileRetentionConsole.exe --check-db
FileRetentionConsole.exe --dry-run
FileRetentionConsole.exe
```

`--self-test` runs filesystem safety tests without MySQL. `--check-db` verifies the configured database connection only. `--dry-run` performs job and file selection but never calls physical deletion. The default command performs real deletion and should first be run against a disposable staging folder.

## Database setup

Run `database/fileSystemRetentionSecure1.sql` against a fresh staging database, then run `database/002_scheduler_metrics.sql`. The migration adds `files_scanned` and `files_retained` to `SCHEDULER_LOGS`. If an older schema is used without those columns, the worker falls back to the legacy scheduler-log shape, but the two metrics will not be stored.

The worker writes successful and failed deletion attempts to `DELETE_LOGS`, processing failures to `ERROR_LOGS`, and one aggregate run row to `SCHEDULER_LOGS`. A retained file is not inserted into `DELETE_LOGS`; its count is recorded in `SCHEDULER_LOGS.files_retained`.

## Build and publish

```bash
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --runtime win-x64 --self-contained true --output ./publish
```

The Windows deliverable is `publish/FileRetentionConsole.exe`.

## Safety requirements

Keep `SCHEDULER_ENABLED=false` in the Node backend when the worker is active. Do not run the worker and Node retention scheduler concurrently for the same jobs. Test with `--dry-run`, then use a controlled canary job before enabling real deletion. Use a Windows service account with only the required read/delete permissions and keep the worker’s logs and MySQL audit tables backed up.
