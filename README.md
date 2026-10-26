# File Retention System

A file retention management system that automates the identification and deletion of expired files based on configurable retention policies.

## Overview

The File Retention System helps manage files stored in designated directories by checking their age against configured retention periods. It uses a web-based interface for job management and monitoring, a backend API for application operations, a MySQL database for configuration and logs, and a C# .NET console application for file retention processing.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **File Processing:** C# with .NET 8
- **Automation:** Windows Task Scheduler
- **API Communication:** REST APIs

## Architecture

```text
React Frontend
      |
      v
Node.js + Express REST APIs
      |
      v
    MySQL
      ^
      |
C# .NET 8 Console Worker
      ^
      |
Windows Task Scheduler
      |
      v
File System Processing
```

## Key Features

- **Configurable Retention Policies:** Manage file retention jobs using settings such as folder path, file type, and retention period.
- **Automated File Processing:** Scan configured directories and identify files that have exceeded their retention period.
- **Safe Deletion Testing:** Use dry-run mode to identify files eligible for deletion without actually deleting them.
- **Execution Logging:** Maintain logs for deletion operations, errors, and scheduled execution runs.
- **Automated Scheduling:** Use Windows Task Scheduler to execute the retention worker at configured intervals.
- **Database Connectivity Checks:** Verify database connectivity before processing jobs.
- **Self-Testing:** Run built-in tests to validate supported worker functionality.

## How It Works

1. Retention job configurations are stored in the `JOB_MASTER` table in MySQL.
2. The C# .NET worker retrieves enabled jobs from the database.
3. The worker scans the configured directories and identifies relevant files.
4. It compares each file's last modified time with the configured retention period.
5. Files that meet the expiration criteria are deleted.
6. Deletion results, errors, and execution details are recorded in the relevant logging tables.
7. Windows Task Scheduler automatically launches the worker according to its configured schedule.

## Database Tables

| Table | Purpose |
|---|---|
| `JOB_MASTER` | Stores retention job configurations. |
| `DELETE_LOGS` | Records file deletion operations. |
| `ERROR_LOGS` | Records processing errors. |
| `SCHEDULER_LOGS` | Records execution and scheduling information. |

## Running the Worker

Run the following commands from the directory containing the published worker executable.

**Check database connectivity**

```bash
FileRetentionConsole.exe --check-db
```

**Run self-tests**

```bash
FileRetentionConsole.exe --self-test
```

**Run in dry-run mode**

```bash
FileRetentionConsole.exe --dry-run
```

Dry-run mode checks retention eligibility without performing actual file deletion.

> Actual execution and deletion depend on the worker's configuration, database connectivity, and filesystem permissions.

## Automated Execution

Windows Task Scheduler is configured to launch the C# console application at the required intervals. This allows file retention processing to run automatically without requiring manual execution each time.

## Benefits

- Reduces manual effort in managing stored files.
- Enforces consistent, configurable retention policies.
- Improves traceability through execution and error logs.
- Supports safer validation through dry-run testing.
- Separates the web application from the scheduled file-processing workload.

## Future Enhancements

- Email notifications for failed execution runs.
- Advanced retention reports and analytics.
- Enhanced audit trails and configurable access controls.
- Additional safeguards and recovery options for file deletion.

## Conclusion

The File Retention System combines a React frontend, Node.js and Express backend, MySQL database, and C# .NET worker to automate file lifecycle management. Windows Task Scheduler enables periodic execution, while database-backed configurations and logs support centralized management and monitoring.
