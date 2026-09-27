using FileRetentionConsole.Models;
using MySqlConnector;

namespace FileRetentionConsole.Data;

public sealed class DatabaseService : IAsyncDisposable
{
    private readonly MySqlConnection _connection;
    private readonly int _commandTimeoutSeconds;
    private bool _hasSchedulerMetrics = true;

    public DatabaseService(string connectionString, int commandTimeoutSeconds)
    {
        _connection = new MySqlConnection(connectionString);
        _commandTimeoutSeconds = Math.Max(5, commandTimeoutSeconds);
    }

    public async Task OpenAsync(CancellationToken cancellationToken = default)
    {
        await _connection.OpenAsync(cancellationToken);
    }

    public async Task<bool> CanConnectAsync(CancellationToken cancellationToken = default)
    {
        await using var command = CreateCommand("SELECT 1", cancellationToken);
        var value = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(value) == 1;
    }

    public async Task<IReadOnlyList<RetentionJob>> GetActiveJobsAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT job_id, customer_id, project_name, folder_path, file_type,
                   retention_hours, is_enabled, disable_reason, exclude_folder
            FROM JOB_MASTER
            WHERE is_enabled = 1
            ORDER BY job_id ASC;
            """;

        await using var command = CreateCommand(sql, cancellationToken);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var jobs = new List<RetentionJob>();
        while (await reader.ReadAsync(cancellationToken))
        {
            jobs.Add(new RetentionJob
            {
                JobId = reader.GetInt32("job_id"),
                CustomerId = reader.GetInt32("customer_id"),
                ProjectName = reader.GetString("project_name"),
                FolderPath = reader.IsDBNull(reader.GetOrdinal("folder_path")) ? string.Empty : reader.GetString("folder_path"),
                FileType = reader.IsDBNull(reader.GetOrdinal("file_type")) ? "all" : reader.GetString("file_type"),
                RetentionHours = reader.IsDBNull(reader.GetOrdinal("retention_hours")) ? 0 : reader.GetInt32("retention_hours"),
                IsEnabled = reader.GetBoolean("is_enabled"),
                DisableReason = reader.IsDBNull(reader.GetOrdinal("disable_reason")) ? null : reader.GetString("disable_reason"),
                ExcludeFolder = !reader.IsDBNull(reader.GetOrdinal("exclude_folder")) && reader.GetBoolean("exclude_folder")
            });
        }

        return jobs;
    }

    public async Task<long> InsertSchedulerStartAsync(DateTime startedAt, CancellationToken cancellationToken = default)
    {
        try
        {
            const string extendedSql = """
                INSERT INTO SCHEDULER_LOGS
                    (start_time, end_time, jobs_processed, job_id, files_scanned,
                     files_deleted, files_retained, errors_count, status)
                VALUES (@start_time, NULL, 0, NULL, 0, 0, 0, 0, 'Running');
                """;
            await using var command = CreateCommand(extendedSql, cancellationToken);
            command.Parameters.AddWithValue("@start_time", startedAt);
            await command.ExecuteNonQueryAsync(cancellationToken);
            return command.LastInsertedId;
        }
        catch (MySqlException ex) when (ex.Number == 1054 || ex.Number == 1064)
        {
            _hasSchedulerMetrics = false;
            const string legacySql = """
                INSERT INTO SCHEDULER_LOGS
                    (start_time, end_time, jobs_processed, job_id, files_deleted, errors_count, status)
                VALUES (@start_time, NULL, 0, NULL, 0, 0, 'Running');
                """;
            await using var command = CreateCommand(legacySql, cancellationToken);
            command.Parameters.AddWithValue("@start_time", startedAt);
            await command.ExecuteNonQueryAsync(cancellationToken);
            return command.LastInsertedId;
        }
    }

    public async Task FinishSchedulerAsync(long schedulerLogId, RunSummary summary, CancellationToken cancellationToken = default)
    {
        if (_hasSchedulerMetrics)
        {
            const string extendedSql = """
                UPDATE SCHEDULER_LOGS
                SET end_time = @end_time,
                    jobs_processed = @jobs_processed,
                    files_scanned = @files_scanned,
                    files_deleted = @files_deleted,
                    files_retained = @files_retained,
                    errors_count = @errors_count,
                    status = @status
                WHERE scheduler_log_id = @scheduler_log_id;
                """;
            try
            {
                await using var command = CreateCommand(extendedSql, cancellationToken);
                AddSummaryParameters(command, schedulerLogId, summary);
                await command.ExecuteNonQueryAsync(cancellationToken);
                return;
            }
            catch (MySqlException ex) when (ex.Number == 1054 || ex.Number == 1064)
            {
                _hasSchedulerMetrics = false;
            }
        }

        const string legacySql = """
            UPDATE SCHEDULER_LOGS
            SET end_time = @end_time,
                jobs_processed = @jobs_processed,
                files_deleted = @files_deleted,
                errors_count = @errors_count,
                status = @status
            WHERE scheduler_log_id = @scheduler_log_id;
            """;
        await using var legacyCommand = CreateCommand(legacySql, cancellationToken);
        AddSummaryParameters(legacyCommand, schedulerLogId, summary);
        await legacyCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task InsertDeleteLogAsync(RetentionJob job, FileCandidate file, DateTime deletedAt, string status, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO DELETE_LOGS
                (job_id, customer_id, file_name, file_path, file_type,
                 file_created_at, deleted_at, retention_hours, status)
            VALUES (@job_id, @customer_id, @file_name, @file_path, @file_type,
                    @file_created_at, @deleted_at, @retention_hours, @status);
            """;
        await using var command = CreateCommand(sql, cancellationToken);
        command.Parameters.AddWithValue("@job_id", job.JobId);
        command.Parameters.AddWithValue("@customer_id", job.CustomerId);
        command.Parameters.AddWithValue("@file_name", file.FileName);
        command.Parameters.AddWithValue("@file_path", file.FilePath);
        command.Parameters.AddWithValue("@file_type", job.FileType);
        command.Parameters.AddWithValue("@file_created_at", file.CreatedAt);
        command.Parameters.AddWithValue("@deleted_at", status == "Success" ? deletedAt : DBNull.Value);
        command.Parameters.AddWithValue("@retention_hours", job.RetentionHours);
        command.Parameters.AddWithValue("@status", status);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task InsertErrorLogAsync(FileFailure failure, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO ERROR_LOGS
                (job_id, file_name, file_path, error_message, error_type,
                 status_code, module, severity, stack_trace)
            VALUES (@job_id, @file_name, @file_path, @error_message, @error_type,
                    @status_code, 'retention-console', @severity, @stack_trace);
            """;
        await using var command = CreateCommand(sql, cancellationToken);
        command.Parameters.AddWithValue("@job_id", failure.JobId);
        command.Parameters.AddWithValue("@file_name", failure.FileName);
        command.Parameters.AddWithValue("@file_path", failure.FilePath);
        command.Parameters.AddWithValue("@error_message", failure.Message.Length > 10000 ? failure.Message[..10000] : failure.Message);
        command.Parameters.AddWithValue("@error_type", failure.ErrorType);
        command.Parameters.AddWithValue("@status_code", failure.StatusCode);
        command.Parameters.AddWithValue("@severity", failure.Severity);
        command.Parameters.AddWithValue("@stack_trace", (object?)failure.StackTrace ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private MySqlCommand CreateCommand(string sql, CancellationToken cancellationToken)
    {
        var command = new MySqlCommand(sql, _connection)
        {
            CommandTimeout = _commandTimeoutSeconds
        };
        return command;
    }

    private static void AddSummaryParameters(MySqlCommand command, long schedulerLogId, RunSummary summary)
    {
        command.Parameters.AddWithValue("@scheduler_log_id", schedulerLogId);
        command.Parameters.AddWithValue("@end_time", summary.EndedAt);
        command.Parameters.AddWithValue("@jobs_processed", summary.JobsProcessed);
        command.Parameters.AddWithValue("@files_scanned", summary.FilesScanned);
        command.Parameters.AddWithValue("@files_deleted", summary.FilesDeleted);
        command.Parameters.AddWithValue("@files_retained", summary.FilesRetained);
        command.Parameters.AddWithValue("@errors_count", summary.ErrorsCount);
        command.Parameters.AddWithValue("@status", summary.Status);
    }

    public async ValueTask DisposeAsync()
    {
        await _connection.DisposeAsync();
    }
}
