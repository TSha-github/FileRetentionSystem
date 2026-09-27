-- =====================================================================
-- FILE RETENTION SYSTEM
-- FINAL DATABASE SCRIPT
-- Database: FileRetentionSystemSecure2Shu
-- =====================================================================
--
-- PURPOSE
-- -------
-- This is the final clean database script for the File Retention System.
--
-- It contains:
--
--   1. Database creation
--   2. ROLES
--   3. CUSTOMER_MASTER
--   4. USERS
--   5. JOB_MASTER
--   6. DELETE_LOGS
--   7. ERROR_LOGS
--   8. SCHEDULER_LOGS
--   9. JOB_STATUS_HISTORY
--  10. Initial required data
--  11. Verification queries
--  12. Commented testing queries
--
-- IMPORTANT
-- ---------
-- The C# FileRetentionConsole.exe is the automatic retention executor.
-- Node automatic scheduling should remain disabled when the C# worker is used.
--
-- Testing SQL near the bottom is COMMENTED OUT.
-- Uncomment only the specific test that you want to perform.
--
-- =====================================================================


-- =====================================================================
-- PART A
-- DATABASE
-- =====================================================================

CREATE DATABASE IF NOT EXISTS FileRetentionSystemSecure2Shu;

USE FileRetentionSystemSecure2Shu;


-- =====================================================================
-- 1. ROLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS ROLES (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- 2. CUSTOMER MASTER
-- =====================================================================
--
-- folder_path:
-- Base/customer retention folder used while configuring a customer.
--
-- Example:
-- D:\Retention\HDFC Bank
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS CUSTOMER_MASTER (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,

    customer_name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    folder_path VARCHAR(500),

    status BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- 3. USERS
-- =====================================================================
--
-- ADMIN:
--   customer_id = NULL
--
-- CUSTOMER USER:
--   Initially:
--       customer_id = NULL
--       status = 0
--
--   This means:
--       Pending Customer Setup
--
--   When the Admin creates the customer and selects that pending user,
--   the backend transaction:
--
--       creates CUSTOMER_MASTER
--       ↓
--       assigns customer_id
--       ↓
--       changes status = 1
--
-- Passwords are BCrypt hashes.
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS USERS (
    user_id INT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role_id INT NOT NULL,

    customer_id INT NULL,

    status BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES ROLES(role_id),

    CONSTRAINT fk_users_customer
        FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER_MASTER(customer_id)
);


-- =====================================================================
-- 4. JOB MASTER
-- =====================================================================
--
-- Each retention job belongs to one customer.
--
-- file_type examples:
-- XML
-- PDF
--
-- retention_hours examples:
-- 24
-- 48
-- 72
--
-- exclude_folder = 1
-- means the automatic retention worker skips the job.
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS JOB_MASTER (
    job_id INT PRIMARY KEY AUTO_INCREMENT,

    customer_id INT NOT NULL,

    project_name VARCHAR(150) NOT NULL,

    folder_path VARCHAR(500) NOT NULL,

    file_type VARCHAR(20) NOT NULL,

    retention_hours INT NOT NULL,

    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    disable_reason TEXT,

    exclude_folder BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jobs_customer
        FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER_MASTER(customer_id)
);


-- =====================================================================
-- 5. DELETE LOGS
-- =====================================================================
--
-- A row is written when the retention worker attempts a REAL deletion.
--
-- Typical status:
--
-- Success
-- Failed
--
-- DRY RUN does not create a successful real deletion.
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS DELETE_LOGS (
    delete_log_id INT PRIMARY KEY AUTO_INCREMENT,

    job_id INT NOT NULL,

    customer_id INT NOT NULL,

    file_name VARCHAR(255),

    file_path VARCHAR(500),

    file_type VARCHAR(20),

    file_created_at DATETIME,

    deleted_at DATETIME,

    retention_hours INT,

    status VARCHAR(20),

    CONSTRAINT fk_delete_logs_job
        FOREIGN KEY (job_id)
        REFERENCES JOB_MASTER(job_id),

    CONSTRAINT fk_delete_logs_customer
        FOREIGN KEY (customer_id)
        REFERENCES CUSTOMER_MASTER(customer_id)
);


-- =====================================================================
-- 6. ERROR LOGS
-- =====================================================================
--
-- Central error logging for:
--
-- Authentication
-- Authorization
-- Validation/API errors
-- Database failures
-- Worker filesystem errors
-- Folder access errors
-- File deletion errors
-- Retention configuration errors
-- Routing errors
-- Internal application errors
--
-- job_id is nullable because some errors are not related to a job.
--
-- IMPORTANT SECURITY RULE
-- -----------------------
-- Never store:
--
-- Plain-text passwords
-- BCrypt hashes from request bodies
-- JWT tokens
-- Authorization headers
-- Cookies
-- OTP
-- CVV
-- Aadhaar values
-- Database passwords
-- JWT secrets
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS ERROR_LOGS (
    error_id INT PRIMARY KEY AUTO_INCREMENT,

    job_id INT NULL,

    file_name VARCHAR(255),

    file_path VARCHAR(500),

    error_message TEXT,

    error_type VARCHAR(100)
        NOT NULL DEFAULT 'INTERNAL_ERROR',

    status_code SMALLINT,

    http_method VARCHAR(16),

    api_endpoint VARCHAR(500),

    user_id INT NULL,

    username VARCHAR(100),

    ip_address VARCHAR(64),

    stack_trace TEXT,

    request_data JSON,

    module VARCHAR(100),

    severity VARCHAR(20)
        NOT NULL DEFAULT 'ERROR',

    request_id VARCHAR(64),

    error_time DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_error_logs_job
        FOREIGN KEY (job_id)
        REFERENCES JOB_MASTER(job_id),

    INDEX idx_error_logs_time (error_time),

    INDEX idx_error_logs_severity (severity),

    INDEX idx_error_logs_module (module),

    INDEX idx_error_logs_status (status_code),

    INDEX idx_error_logs_type (error_type)
);


-- =====================================================================
-- 7. SCHEDULER LOGS
-- =====================================================================
--
-- One scheduler summary row is written for worker execution.
--
-- Important metrics:
--
-- jobs_processed
-- files_scanned
-- files_retained
-- files_deleted
-- errors_count
--
-- status examples:
--
-- Dry Run
-- Completed
-- Completed with Errors
-- Failed
-- Cancelled
--
-- files_scanned and files_retained are INCLUDED HERE DIRECTLY.
-- Therefore the old ALTER TABLE migration is NOT needed on a fresh DB.
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS SCHEDULER_LOGS (
    scheduler_log_id INT PRIMARY KEY AUTO_INCREMENT,

    start_time DATETIME,

    end_time DATETIME,

    jobs_processed INT NOT NULL DEFAULT 0,

    job_id INT NULL,

    files_scanned INT NOT NULL DEFAULT 0,

    files_deleted INT NOT NULL DEFAULT 0,

    files_retained INT NOT NULL DEFAULT 0,

    errors_count INT NOT NULL DEFAULT 0,

    status VARCHAR(30),

    CONSTRAINT fk_scheduler_logs_job
        FOREIGN KEY (job_id)
        REFERENCES JOB_MASTER(job_id)
);


-- =====================================================================
-- 8. JOB STATUS HISTORY
-- =====================================================================
--
-- Stores job enable / disable activity.
--
-- Examples:
--
-- Disabled
-- Enabled
--
-- =====================================================================

CREATE TABLE IF NOT EXISTS JOB_STATUS_HISTORY (
    history_id INT PRIMARY KEY AUTO_INCREMENT,

    job_id INT NOT NULL,

    action VARCHAR(30),

    reason TEXT,

    changed_by INT,

    changed_at DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_job
        FOREIGN KEY (job_id)
        REFERENCES JOB_MASTER(job_id),

    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by)
        REFERENCES USERS(user_id)
);

show tables;

USE FileRetentionSystemSecure2Shu;

-- 1. Roles
SELECT * FROM ROLES;

-- 2. Customers
SELECT * FROM CUSTOMER_MASTER;

-- 3. Users
SELECT * FROM USERS;

-- 4. Jobs
SELECT * FROM JOB_MASTER;

-- 5. Delete Logs
SELECT * FROM DELETE_LOGS;

-- 6. Error Logs
SELECT * FROM ERROR_LOGS;

-- 7. Scheduler Logs
SELECT * FROM SCHEDULER_LOGS;

-- 8. Job Status History
SELECT * FROM JOB_STATUS_HISTORY;


USE FileRetentionSystemSecure2Shu;

SET SQL_SAFE_UPDATES = 0;

-- =========================================================
-- CLEAN OLD TEST DATA
-- =========================================================

DELETE FROM JOB_STATUS_HISTORY;
DELETE FROM DELETE_LOGS;
DELETE FROM ERROR_LOGS;
DELETE FROM SCHEDULER_LOGS;

DELETE FROM JOB_MASTER;

-- Keep admin1 only
DELETE FROM USERS
WHERE username <> 'admin1';

DELETE FROM CUSTOMER_MASTER;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE CUSTOMER_MASTER AUTO_INCREMENT = 1;
ALTER TABLE JOB_MASTER AUTO_INCREMENT = 1;
ALTER TABLE DELETE_LOGS AUTO_INCREMENT = 1;
ALTER TABLE ERROR_LOGS AUTO_INCREMENT = 1;
ALTER TABLE SCHEDULER_LOGS AUTO_INCREMENT = 1;
ALTER TABLE JOB_STATUS_HISTORY AUTO_INCREMENT = 1;

ALTER TABLE USERS AUTO_INCREMENT = 2;

-- =========================================================
-- RESET AUTO_INCREMENT IDs
-- =========================================================

-- Customers: next customer_id = 1
ALTER TABLE CUSTOMER_MASTER AUTO_INCREMENT = 1;

-- Jobs: next job_id = 1
ALTER TABLE JOB_MASTER AUTO_INCREMENT = 1;

-- Delete logs: next delete_log_id = 1
ALTER TABLE DELETE_LOGS AUTO_INCREMENT = 1;

-- Error logs: next error_id = 1
ALTER TABLE ERROR_LOGS AUTO_INCREMENT = 1;

-- Scheduler logs: next scheduler_log_id = 1
ALTER TABLE SCHEDULER_LOGS AUTO_INCREMENT = 1;

-- Job history: next history_id = 1
ALTER TABLE JOB_STATUS_HISTORY AUTO_INCREMENT = 1;

-- admin1 already has user_id = 1,
-- therefore next created user should receive user_id = 2.
ALTER TABLE USERS AUTO_INCREMENT = 2;


-- VERIFY
SELECT
    user_id,
    username,
    role_id,
    customer_id,
    status
FROM USERS;


SELECT
    TABLE_NAME,
    AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'FileRetentionSystemSecure2Shu'
AND TABLE_NAME IN (
    'CUSTOMER_MASTER',
    'USERS',
    'JOB_MASTER',
    'DELETE_LOGS',
    'ERROR_LOGS',
    'SCHEDULER_LOGS',
    'JOB_STATUS_HISTORY'
);


UPDATE JOB_MASTER
SET project_name = 'ICICI XLSX Retention'
WHERE job_id = 15;



-- PASSWORD FOR ADMIN1
USE FileRetentionSystemSecure2Shu;

SELECT
    user_id,
    username,
    LENGTH(password) AS password_length,
    role_id,
    customer_id,
    status
FROM USERS
WHERE username = 'admin1';
----------------------------------------------------------
--     cd "C:\Users\HP\Desktop\mtl_final\FileRetentionSystem-FINAL\backend"

--     node -e "const bcrypt=require('bcrypt'); bcrypt.hash('Admin@2026!',12).then(console.log)"

-----------------------------------------------------------
-- UPDADATE THE PASSWORD
UPDATE USERS
SET password = '$2b$12$6H8qWHXQHQu.ErORfIArjOg0t4D81GGH9Zbs4bmKth8O6KHktCpvy',
    status = 1
WHERE username = 'admin1';

-- VERIFY
SELECT
    username,
    LENGTH(password) AS password_length,
    status
FROM USERS
WHERE username = 'admin1';

USE FileRetentionSystemSecure2Shu;

SELECT
    scheduler_log_id,
    job_id,
    jobs_processed,
    files_scanned,
    files_retained,
    files_deleted,
    errors_count,
    status,
    start_time,
    end_time
FROM SCHEDULER_LOGS
ORDER BY start_time DESC;

USE FileRetentionSystemSecure2Shu;

SELECT COUNT(*) AS customers
FROM CUSTOMER_MASTER;

SELECT COUNT(*) AS users
FROM USERS;

SELECT COUNT(*) AS active_jobs
FROM JOB_MASTER
WHERE is_enabled = 1;


























-- =========================================
-- PART B
-- INITIAL REQUIRED DATA
-- =====================================================================


-- =====================================================================
-- 9. FIXED ROLES
-- =====================================================================
--
-- Roles are fixed in the application.
--
-- Admin
-- Customer User
--
-- =====================================================================

INSERT IGNORE INTO ROLES (role_name)
VALUES
    ('Admin'),
    ('Customer User');


-- =====================================================================
-- 10. INITIAL ADMIN USER
-- =====================================================================
--
-- IMPORTANT
-- ---------
-- The password below MUST be a BCrypt hash generated for the password
-- that you actually want to use.
--
-- Do NOT paste a normal plain-text password here.
--
-- Generate one from backend PowerShell using:
--
-- node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PASSWORD',12).then(console.log)"
--
-- Then replace PASTE_BCRYPT_HASH_HERE below.
--
-- Run the INSERT only once for a fresh DB.
--
-- =====================================================================

/*

INSERT INTO USERS
(
    username,
    password,
    role_id,
    customer_id,
    status
)
SELECT
    'admin1',
    'PASTE_BCRYPT_HASH_HERE',
    r.role_id,
    NULL,
    TRUE
FROM ROLES r
WHERE r.role_name = 'Admin'
AND NOT EXISTS (
    SELECT 1
    FROM USERS
    WHERE username = 'admin1'
);

*/


-- =====================================================================
-- NOTE ABOUT CUSTOMER USERS
-- =====================================================================
--
-- Do NOT manually seed Customer Users for the normal final workflow.
--
-- Create them from:
--
-- Admin
--   ↓
-- User Management
--   ↓
-- Add Customer User
--
-- New Customer User:
--
-- customer_id = NULL
-- status      = 0
--
-- Then:
--
-- Customer Master
--   ↓
-- Add Customer
--   ↓
-- Select pending Customer User
--   ↓
-- Backend creates customer + assigns user transactionally
--
-- =====================================================================



-- =====================================================================
-- PART C
-- SAFE DATABASE VERIFICATION
-- =====================================================================
--
-- These SELECT statements are safe.
-- They do NOT modify data.
--
-- =====================================================================


-- Current database

SELECT DATABASE();


-- Show all tables

SHOW TABLES;


-- Roles

SELECT *
FROM ROLES
ORDER BY role_id;


-- Users

SELECT
    u.user_id,
    u.username,
    u.role_id,
    r.role_name,
    u.customer_id,
    c.customer_name,
    u.status,
    LENGTH(u.password) AS password_length,
    u.created_at
FROM USERS u
JOIN ROLES r
    ON r.role_id = u.role_id
LEFT JOIN CUSTOMER_MASTER c
    ON c.customer_id = u.customer_id
ORDER BY u.user_id;


-- Customers

SELECT
    customer_id,
    customer_name,
    description,
    folder_path,
    status,
    created_at
FROM CUSTOMER_MASTER
ORDER BY customer_id;


-- Jobs with Customer

SELECT
    j.job_id,
    j.customer_id,
    c.customer_name,
    j.project_name,
    j.folder_path,
    j.file_type,
    j.retention_hours,
    j.is_enabled,
    j.disable_reason,
    j.exclude_folder,
    j.created_at
FROM JOB_MASTER j
JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
ORDER BY j.job_id;


-- Delete Logs

SELECT
    d.delete_log_id,
    d.job_id,
    d.customer_id,
    c.customer_name,
    d.file_name,
    d.file_path,
    d.file_type,
    d.file_created_at,
    d.deleted_at,
    d.retention_hours,
    d.status
FROM DELETE_LOGS d
JOIN CUSTOMER_MASTER c
    ON c.customer_id = d.customer_id
ORDER BY d.deleted_at DESC;


-- Error Logs

SELECT
    e.error_id,
    e.job_id,
    c.customer_name,
    e.file_name,
    e.file_path,
    e.error_type,
    e.error_message,
    e.status_code,
    e.http_method,
    e.api_endpoint,
    e.user_id,
    e.username,
    e.module,
    e.severity,
    e.request_id,
    e.error_time
FROM ERROR_LOGS e
LEFT JOIN JOB_MASTER j
    ON j.job_id = e.job_id
LEFT JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
ORDER BY e.error_time DESC;


-- Scheduler Logs

SELECT
    scheduler_log_id,
    start_time,
    end_time,
    jobs_processed,
    job_id,
    files_scanned,
    files_retained,
    files_deleted,
    errors_count,
    status
FROM SCHEDULER_LOGS
ORDER BY start_time DESC;


-- Job Status History

SELECT
    h.history_id,
    h.job_id,
    j.project_name,
    c.customer_name,
    h.action,
    h.reason,
    u.username AS changed_by,
    h.changed_at
FROM JOB_STATUS_HISTORY h
JOIN JOB_MASTER j
    ON j.job_id = h.job_id
JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
LEFT JOIN USERS u
    ON u.user_id = h.changed_by
ORDER BY h.changed_at DESC;


-- =====================================================================
-- DASHBOARD VERIFICATION
-- =====================================================================


-- Total customers

SELECT
    COUNT(*) AS total_customers
FROM CUSTOMER_MASTER;


-- Total / active / disabled jobs

SELECT
    COUNT(*) AS total_jobs,

    SUM(
        CASE
            WHEN is_enabled = 1
            THEN 1
            ELSE 0
        END
    ) AS active_jobs,

    SUM(
        CASE
            WHEN is_enabled = 0
            THEN 1
            ELSE 0
        END
    ) AS disabled_jobs

FROM JOB_MASTER;


-- Successful deletions

SELECT
    COUNT(*) AS files_deleted
FROM DELETE_LOGS
WHERE status = 'Success';


-- Total errors

SELECT
    COUNT(*) AS total_errors
FROM ERROR_LOGS;


-- Latest scheduler run

SELECT
    scheduler_log_id,
    jobs_processed,
    files_scanned,
    files_retained,
    files_deleted,
    errors_count,
    status,
    start_time,
    end_time
FROM SCHEDULER_LOGS
ORDER BY start_time DESC
LIMIT 1;



-- =====================================================================
-- =====================================================================
-- PART D
-- TESTING COMMANDS
-- =====================================================================
-- =====================================================================
--
-- EVERYTHING BELOW THIS POINT IS FOR TESTING ONLY.
--
-- DO NOT RUN THE WHOLE SECTION.
--
-- Uncomment ONLY the test that you specifically want to perform.
--
-- =====================================================================



-- =====================================================================
-- TEST 1
-- CLEAN APPLICATION DATA
-- =====================================================================
--
-- PURPOSE:
--
-- Return the application to a clean state while keeping:
--
-- ROLES
-- admin1
--
-- Removes:
--
-- Job history
-- Delete logs
-- Error logs
-- Scheduler logs
-- Jobs
-- Customer Users
-- Customers
--
-- WARNING:
-- DELETES DATA.
--
-- =====================================================================

/*

SET SQL_SAFE_UPDATES = 0;

DELETE FROM JOB_STATUS_HISTORY;

DELETE FROM DELETE_LOGS;

DELETE FROM ERROR_LOGS;

DELETE FROM SCHEDULER_LOGS;

DELETE FROM JOB_MASTER;

DELETE FROM USERS
WHERE username <> 'admin1';

DELETE FROM CUSTOMER_MASTER;

SET SQL_SAFE_UPDATES = 1;


-- Verify clean state

SELECT
    user_id,
    username,
    role_id,
    customer_id,
    status
FROM USERS;

SELECT *
FROM CUSTOMER_MASTER;

SELECT *
FROM JOB_MASTER;

SELECT *
FROM DELETE_LOGS;

SELECT *
FROM ERROR_LOGS;

SELECT *
FROM SCHEDULER_LOGS;

SELECT *
FROM JOB_STATUS_HISTORY;

*/



-- =====================================================================
-- TEST 2
-- CHECK ADMIN USER
-- =====================================================================

/*

SELECT
    u.user_id,
    u.username,
    u.role_id,
    r.role_name,
    u.customer_id,
    u.status,
    LENGTH(u.password) AS password_length
FROM USERS u
JOIN ROLES r
    ON r.role_id = u.role_id
WHERE u.username = 'admin1';

*/


-- Expected:
--
-- role_name       = Admin
-- customer_id     = NULL
-- status          = 1
-- password_length = 60



-- =====================================================================
-- TEST 3
-- RESET ADMIN PASSWORD
-- =====================================================================
--
-- Generate the hash FIRST in backend PowerShell:
--
-- node -e "const bcrypt=require('bcrypt'); bcrypt.hash('Admin@2026!',12).then(console.log)"
--
-- Copy that hash and replace:
--
-- PASTE_NEW_BCRYPT_HASH_HERE
--
-- =====================================================================

/*

UPDATE USERS
SET
    password = 'PASTE_NEW_BCRYPT_HASH_HERE',
    status = 1
WHERE username = 'admin1';


SELECT
    username,
    LENGTH(password) AS password_length,
    role_id,
    customer_id,
    status
FROM USERS
WHERE username = 'admin1';

*/



-- =====================================================================
-- TEST 4
-- CHECK CUSTOMERS
-- =====================================================================

/*

SELECT
    customer_id,
    customer_name,
    folder_path,
    status
FROM CUSTOMER_MASTER
ORDER BY customer_id;

*/



-- =====================================================================
-- TEST 5
-- CHECK CUSTOMER USER ASSIGNMENT
-- =====================================================================

/*

SELECT
    u.user_id,
    u.username,
    r.role_name,
    u.customer_id,
    c.customer_name,
    u.status
FROM USERS u
JOIN ROLES r
    ON r.role_id = u.role_id
LEFT JOIN CUSTOMER_MASTER c
    ON c.customer_id = u.customer_id
WHERE r.role_name = 'Customer User'
ORDER BY u.user_id;

*/



-- =====================================================================
-- TEST 6
-- CHECK PENDING CUSTOMER USERS
-- =====================================================================
--
-- Pending Customer User:
--
-- role = Customer User
-- customer_id = NULL
-- status = 0
--
-- =====================================================================

/*

SELECT
    u.user_id,
    u.username,
    u.customer_id,
    u.status
FROM USERS u
JOIN ROLES r
    ON r.role_id = u.role_id
WHERE
    r.role_name = 'Customer User'
    AND u.customer_id IS NULL
    AND u.status = 0;

*/



-- =====================================================================
-- TEST 7
-- CHECK HDFC JOBS
-- =====================================================================

/*

SELECT
    j.job_id,
    c.customer_name,
    j.project_name,
    j.folder_path,
    j.file_type,
    j.retention_hours,
    j.is_enabled
FROM JOB_MASTER j
JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
WHERE c.customer_name = 'HDFC Bank'
ORDER BY j.job_id;

*/



-- =====================================================================
-- TEST 8
-- INVALID RETENTION CONFIGURATION
-- =====================================================================
--
-- PURPOSE:
--
-- Force the C# worker to generate:
--
-- RETENTION_CONFIGURATION_ERROR
--
-- Example workflow:
--
-- 1. Find a TEST job.
-- 2. Remember its original retention_hours.
-- 3. Temporarily set retention_hours = 0.
-- 4. Run FileRetentionConsole.exe --dry-run.
-- 5. Check ERROR_LOGS.
-- 6. Restore the original retention_hours.
--
-- DO NOT USE AN IMPORTANT PRODUCTION JOB.
--
-- =====================================================================

/*

-- Example only:
-- Replace 20 with actual TEST job ID.

SELECT
    job_id,
    project_name,
    folder_path,
    retention_hours,
    is_enabled
FROM JOB_MASTER
WHERE job_id = 20;


UPDATE JOB_MASTER
SET retention_hours = 0
WHERE job_id = 20;


-- Run the C# worker:
--
-- .\FileRetentionConsole.exe --dry-run
--
-- Expected:
--
-- RETENTION_CONFIGURATION_ERROR
-- HTTP-style Status Code = 422
-- Severity = ERROR


SELECT
    error_id,
    job_id,
    error_type,
    error_message,
    status_code,
    severity,
    error_time
FROM ERROR_LOGS
ORDER BY error_time DESC
LIMIT 10;


-- RESTORE ORIGINAL VALUE.
-- Example if original was 23:

UPDATE JOB_MASTER
SET retention_hours = 23
WHERE job_id = 20;

*/



-- =====================================================================
-- TEST 9
-- MISSING FOLDER ERROR
-- =====================================================================
--
-- Create an active test job with a folder such as:
--
-- D:\Retention\DOES_NOT_EXIST
--
-- Then run:
--
-- FileRetentionConsole.exe --dry-run
--
-- Expected:
--
-- RETENTION_FOLDER_ERROR
-- Folder does not exist
--
-- =====================================================================

/*

SELECT
    error_id,
    job_id,
    file_path,
    error_type,
    error_message,
    status_code,
    severity,
    error_time
FROM ERROR_LOGS
ORDER BY error_time DESC
LIMIT 10;

*/



-- =====================================================================
-- TEST 10
-- ACCESS DENIED ERROR
-- =====================================================================
--
-- This error is created from Windows PowerShell, NOT MySQL.
--
-- Example:
--
-- icacls "D:\Retention\HDFC Bank" /deny "${env:USERNAME}:(OI)(CI)F"
--
-- Run:
--
-- .\FileRetentionConsole.exe --dry-run
--
-- Expected:
--
-- Access to the path 'D:\Retention\HDFC Bank' is denied.
--
-- Then ALWAYS restore:
--
-- icacls "D:\Retention\HDFC Bank" /remove:d "${env:USERNAME}"
--
-- Check the result with:
--
-- =====================================================================

/*

SELECT
    error_id,
    job_id,
    file_path,
    error_type,
    error_message,
    status_code,
    severity,
    error_time
FROM ERROR_LOGS
ORDER BY error_time DESC
LIMIT 10;

*/



-- =====================================================================
-- TEST 11
-- DELETE LOG VERIFICATION
-- =====================================================================
--
-- Run after a REAL worker deletion.
--
-- =====================================================================

/*

SELECT
    d.delete_log_id,
    d.job_id,
    c.customer_name,
    d.file_name,
    d.file_path,
    d.file_type,
    d.file_created_at,
    d.deleted_at,
    d.retention_hours,
    d.status
FROM DELETE_LOGS d
JOIN CUSTOMER_MASTER c
    ON c.customer_id = d.customer_id
ORDER BY d.deleted_at DESC
LIMIT 20;

*/



-- =====================================================================
-- TEST 12
-- SCHEDULER LOG VERIFICATION
-- =====================================================================

/*

SELECT
    scheduler_log_id,
    start_time,
    end_time,
    jobs_processed,
    job_id,
    files_scanned,
    files_retained,
    files_deleted,
    errors_count,
    status
FROM SCHEDULER_LOGS
ORDER BY start_time DESC
LIMIT 20;

*/



-- =====================================================================
-- TEST 13
-- ERROR LOG VERIFICATION
-- =====================================================================

/*

SELECT
    error_id,
    job_id,
    file_name,
    file_path,
    error_type,
    error_message,
    status_code,
    http_method,
    api_endpoint,
    user_id,
    username,
    module,
    severity,
    request_id,
    error_time
FROM ERROR_LOGS
ORDER BY error_time DESC
LIMIT 50;

*/



-- =====================================================================
-- TEST 14
-- JOB STATUS HISTORY VERIFICATION
-- =====================================================================

/*

SELECT
    h.history_id,
    h.job_id,
    j.project_name,
    c.customer_name,
    h.action,
    h.reason,
    u.username AS changed_by,
    h.changed_at
FROM JOB_STATUS_HISTORY h
JOIN JOB_MASTER j
    ON j.job_id = h.job_id
JOIN CUSTOMER_MASTER c
    ON c.customer_id = j.customer_id
LEFT JOIN USERS u
    ON u.user_id = h.changed_by
ORDER BY h.changed_at DESC;

*/



-- =====================================================================
-- TEST 15
-- DUPLICATE CUSTOMER CHECK
-- =====================================================================
--
-- This is only a verification SELECT.
--
-- The Node backend itself performs the actual duplicate validation.
--
-- =====================================================================

/*

SELECT
    customer_id,
    customer_name
FROM CUSTOMER_MASTER
WHERE
    LOWER(TRIM(customer_name))
    =
    LOWER(TRIM('HDFC Bank'))
LIMIT 1;

*/



-- =====================================================================
-- TEST 16
-- VERIFY PASSWORD HASH LENGTH
-- =====================================================================
--
-- BCrypt hash length should normally be 60.
--
-- =====================================================================

/*

SELECT
    username,
    LENGTH(password) AS password_length,
    role_id,
    customer_id,
    status
FROM USERS
ORDER BY user_id;

*/



-- =====================================================================
-- TEST 17
-- CUSTOMER ISOLATION SUPPORT QUERY
-- =====================================================================
--
-- Use this only to identify customer IDs before testing API isolation.
--
-- Example:
--
-- SBI user attempts HDFC report.
--
-- The backend must either reject the request or scope it to the
-- authenticated SBI customer, depending on the endpoint design.
--
-- =====================================================================

/*

SELECT
    customer_id,
    customer_name
FROM CUSTOMER_MASTER
ORDER BY customer_id;

*/



-- =====================================================================
-- TEST 18
-- JOB ACTIVE / DISABLED STATUS
-- =====================================================================

/*

SELECT
    job_id,
    project_name,
    customer_id,
    file_type,
    retention_hours,
    is_enabled,
    disable_reason,
    exclude_folder
FROM JOB_MASTER
ORDER BY job_id;

*/



-- =====================================================================
-- TEST 19
-- DATABASE SUMMARY
-- =====================================================================

/*

SELECT
    (SELECT COUNT(*) FROM CUSTOMER_MASTER)
        AS total_customers,

    (SELECT COUNT(*) FROM JOB_MASTER)
        AS total_jobs,

    (
        SELECT COUNT(*)
        FROM JOB_MASTER
        WHERE is_enabled = 1
    )
        AS active_jobs,

    (
        SELECT COUNT(*)
        FROM JOB_MASTER
        WHERE is_enabled = 0
    )
        AS disabled_jobs,

    (
        SELECT COUNT(*)
        FROM DELETE_LOGS
        WHERE status = 'Success'
    )
        AS successful_deletions,

    (
        SELECT COUNT(*)
        FROM ERROR_LOGS
    )
        AS total_errors,

    (
        SELECT COUNT(*)
        FROM SCHEDULER_LOGS
    )
        AS scheduler_runs;

*/



-- =====================================================================
-- TEST 20
-- VIEW EVERYTHING
-- =====================================================================
--
-- SAFE SELECTS.
--
-- Useful while debugging.
--
-- =====================================================================

/*

SELECT * FROM ROLES;

SELECT * FROM USERS;

SELECT * FROM CUSTOMER_MASTER;

SELECT * FROM JOB_MASTER;

SELECT * FROM DELETE_LOGS;

SELECT * FROM ERROR_LOGS;

SELECT * FROM SCHEDULER_LOGS;

SELECT * FROM JOB_STATUS_HISTORY;

*/



-- =====================================================================
-- PART E
-- OLD MIGRATION - DO NOT RUN ON A FRESH DATABASE
-- =====================================================================
--
-- Your older database originally did not contain:
--
-- files_scanned
-- files_retained
--
-- They are ALREADY included in the CREATE TABLE above.
--
-- Therefore:
--
-- DO NOT RUN THIS ON A FRESH DATABASE.
--
-- Only use this when upgrading an OLD database that does not have
-- these columns.
--
-- =====================================================================

/*

ALTER TABLE SCHEDULER_LOGS
ADD COLUMN files_scanned
INT NOT NULL DEFAULT 0
AFTER job_id;


ALTER TABLE SCHEDULER_LOGS
ADD COLUMN files_retained
INT NOT NULL DEFAULT 0
AFTER files_deleted;

*/



-- =====================================================================
-- OLD CUSTOMER FOLDER-PATH MIGRATION
-- =====================================================================
--
-- DO NOT RUN ON A FRESH DATABASE.
--
-- CUSTOMER_MASTER.folder_path is already included in the CREATE TABLE.
--
-- Only use this on an OLD database where the column is missing.
--
-- =====================================================================

/*

ALTER TABLE CUSTOMER_MASTER
ADD COLUMN folder_path
VARCHAR(500)
NULL
AFTER description;

*/



-- =====================================================================
-- FINAL NOTES
-- =====================================================================
--
-- NORMAL PROJECT FLOW
-- -------------------
--
-- Admin Login
--      ↓
-- Create Customer User
--      ↓
-- User is Pending
-- customer_id = NULL
-- status = 0
--      ↓
-- Create Customer
--      ↓
-- Select Pending Customer User
--      ↓
-- Backend Transaction
--      ↓
-- Customer created
-- User linked
-- User activated
--      ↓
-- Create Retention Job
--      ↓
-- C# FileRetentionConsole.exe
--      ↓
-- Reads Active Jobs
--      ↓
-- Scans Configured Folder
--      ↓
-- Checks File Type
--      ↓
-- Checks File Age
--      ↓
-- KEEP or DELETE
--      ↓
-- DELETE_LOGS
-- ERROR_LOGS
-- SCHEDULER_LOGS
--      ↓
-- Dashboard
-- Reports
-- Logs
--
--
-- SECURITY
-- --------
--
-- Passwords use BCrypt.
--
-- JWT authentication is handled by the Node/Express backend.
--
-- Admin:
-- customer_id = NULL
-- Can access administrative functionality.
--
-- Customer User:
-- customer_id points to exactly one customer after onboarding.
-- Backend must enforce customer isolation.
--
-- Frontend hiding a page is NOT sufficient security.
-- Backend authorization remains authoritative.
--
--
-- RETENTION EXECUTOR
-- ------------------
--
-- C# FileRetentionConsole.exe is the automatic retention executor.
--
-- Keep Node scheduler disabled when using the C# worker:
--
-- SCHEDULER_ENABLED=false
--
--
-- DRY RUN
-- -------
--
-- .\FileRetentionConsole.exe --dry-run
--
-- Checks what WOULD be deleted.
-- Does not delete files.
--
--
-- REAL RUN
-- --------
--
-- .\FileRetentionConsole.exe
--
-- Deletes files that:
--
-- 1. Belong to an active job
-- 2. Match the configured file type
-- 3. Are older than the configured retention period
-- 4. Are not excluded
--
--
-- ERROR HANDLING
-- --------------
--
-- User input validation:
-- Display on frontend.
-- Normally do not pollute ERROR_LOGS.
--
-- Backend / security / filesystem / worker failures:
-- Log to ERROR_LOGS where appropriate.
--
-- Examples:
--
-- INVALID_CREDENTIALS
-- CUSTOMER_ASSIGNMENT_REQUIRED
-- USERNAME_EXISTS
-- CUSTOMER_EXISTS
-- FORBIDDEN
-- VALIDATION_ERROR
-- NOT_FOUND
-- RETENTION_CONFIGURATION_ERROR
-- RETENTION_FOLDER_ERROR
-- FILE_DELETE_ERROR
-- DATABASE_UNAVAILABLE
-- INTERNAL_ERROR
--
--
-- =====================================================================
-- END OF FILE RETENTION SYSTEM FINAL DATABASE SCRIPT
-- =====================================================================