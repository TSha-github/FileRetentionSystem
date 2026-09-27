-- File Retention System: centralized error logging migration.
-- Apply after FileRetentionSystemSecure.sql.
-- This migration preserves existing ERROR_LOGS rows and allows request-level errors
-- that are not associated with a retention job.

ALTER TABLE ERROR_LOGS
  MODIFY job_id INT NULL;

DELIMITER $$

CREATE PROCEDURE migrate_error_logs_centralized()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'error_type') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN error_type VARCHAR(100) NULL AFTER error_message;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'status_code') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN status_code SMALLINT NULL AFTER error_type;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'http_method') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN http_method VARCHAR(16) NULL AFTER status_code;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'api_endpoint') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN api_endpoint VARCHAR(500) NULL AFTER http_method;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'user_id') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN user_id INT NULL AFTER api_endpoint;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'username') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN username VARCHAR(100) NULL AFTER user_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'ip_address') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN ip_address VARCHAR(64) NULL AFTER username;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'stack_trace') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN stack_trace TEXT NULL AFTER ip_address;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'request_data') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN request_data JSON NULL AFTER stack_trace;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'module') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN module VARCHAR(100) NULL AFTER request_data;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'severity') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'ERROR' AFTER module;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND column_name = 'request_id') THEN
    ALTER TABLE ERROR_LOGS ADD COLUMN request_id VARCHAR(64) NULL AFTER severity;
  END IF;

  UPDATE ERROR_LOGS SET error_type = COALESCE(error_type, 'RETENTION_FILE_ERROR') WHERE error_type IS NULL;
  UPDATE ERROR_LOGS SET severity = COALESCE(severity, 'ERROR') WHERE severity IS NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND index_name = 'idx_error_logs_time') THEN
    CREATE INDEX idx_error_logs_time ON ERROR_LOGS (error_time);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND index_name = 'idx_error_logs_severity') THEN
    CREATE INDEX idx_error_logs_severity ON ERROR_LOGS (severity);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND index_name = 'idx_error_logs_module') THEN
    CREATE INDEX idx_error_logs_module ON ERROR_LOGS (module);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ERROR_LOGS' AND index_name = 'idx_error_logs_status') THEN
    CREATE INDEX idx_error_logs_status ON ERROR_LOGS (status_code);
  END IF;
END$$

CALL migrate_error_logs_centralized()$$
DROP PROCEDURE migrate_error_logs_centralized$$

DELIMITER ;
