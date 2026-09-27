using FileRetentionConsole.Data;
using FileRetentionConsole.Logging;
using FileRetentionConsole.Models;

namespace FileRetentionConsole.Services;

public sealed class RetentionService
{
    private readonly DatabaseService _database;
    private readonly FileSystemService _filesystem;
    private readonly ConsoleLogger _logger;

    public RetentionService(DatabaseService database, FileSystemService filesystem, ConsoleLogger logger)
    {
        _database = database;
        _filesystem = filesystem;
        _logger = logger;
    }

    public async Task<RunSummary> RunAsync(bool dryRun, CancellationToken cancellationToken = default)
    {
        var summary = new RunSummary { StartedAt = DateTime.Now, Status = "Running" };
        long schedulerLogId = 0;
        try
        {
            schedulerLogId = await _database.InsertSchedulerStartAsync(summary.StartedAt, cancellationToken);
            _logger.Success("Scheduler audit row created");
            _logger.Info("Reading active jobs");
            var jobs = await _database.GetActiveJobsAsync(cancellationToken);
            _logger.Success($"Active jobs found: {jobs.Count}");

            foreach (var job in jobs)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var result = await ProcessJobAsync(job, dryRun, cancellationToken);
                summary.JobsProcessed += 1;
                summary.FilesScanned += result.FilesScanned;
                summary.FilesDeleted += result.FilesDeleted;
                summary.FilesRetained += result.FilesRetained;
                summary.ErrorsCount += result.ErrorsCount;
            }

            summary.EndedAt = DateTime.Now;
            summary.Status = dryRun ? "Dry Run" : summary.ErrorsCount > 0 ? "Completed with Errors" : "Completed";
            if (schedulerLogId != 0)
                await _database.FinishSchedulerAsync(schedulerLogId, summary, cancellationToken);
            return summary;
        }
        catch (OperationCanceledException)
        {
            summary.ErrorsCount += 1;
            summary.EndedAt = DateTime.Now;
            summary.Status = "Cancelled";
            if (schedulerLogId != 0)
                await _database.FinishSchedulerAsync(schedulerLogId, summary, CancellationToken.None);
            throw;
        }
        catch (Exception ex)
        {
            summary.ErrorsCount += 1;
            summary.EndedAt = DateTime.Now;
            summary.Status = "Failed";
            _logger.Error($"Scheduler failed: {ex.Message}");
            if (schedulerLogId != 0)
            {
                try { await _database.FinishSchedulerAsync(schedulerLogId, summary, CancellationToken.None); }
                catch (Exception logError) { _logger.Error($"Unable to finish scheduler audit row: {logError.Message}"); }
            }
            throw;
        }
    }

    private async Task<JobSummary> ProcessJobAsync(RetentionJob job, bool dryRun, CancellationToken cancellationToken)
    {
        var result = new JobSummary { JobId = job.JobId, ProjectName = job.ProjectName };
        _logger.JobStarted(job);

        if (job.ExcludeFolder)
        {
            result.Status = "Skipped";
            _logger.Warning($"Job {job.JobId} is marked exclude_folder; skipping");
            return result;
        }

        if (string.IsNullOrWhiteSpace(job.FolderPath) || job.RetentionHours <= 0)
        {
            result.ErrorsCount = 1;
            result.Status = "Failed";
            var failure = new FileFailure
            {
                JobId = job.JobId,
                FilePath = job.FolderPath,
                ErrorType = "RETENTION_CONFIGURATION_ERROR",
                Message = "Job has an invalid folder path or retention_hours value.",
                StatusCode = 422,
                Severity = "ERROR"
            };
            await RecordErrorAsync(failure, cancellationToken);
            _logger.Error($"Job {job.JobId} has invalid retention configuration");
            return result;
        }

        IReadOnlyList<FileCandidate> files;
        try
        {
            var folder = _filesystem.ValidateFolder(job.FolderPath);
            _logger.Success($"Folder found: {folder}");
            files = _filesystem.ListFiles(folder);
            _logger.Info($"Files found: {files.Count}");
        }
        catch (Exception ex)
        {
            result.ErrorsCount = 1;
            result.Status = "Failed";
            await RecordErrorAsync(ToFailure(job, ex, "RETENTION_FOLDER_ERROR", job.FolderPath), cancellationToken);
            _logger.Error($"Unable to read folder for Job {job.JobId}: {ex.Message}");
            return result;
        }
foreach (var file in files)
{
    cancellationToken.ThrowIfCancellationRequested();

    if (!_filesystem.MatchesFileType(file.FileName, job.FileType))
    {
        _logger.Info($"Ignored {file.FileName}: file type does not match {job.FileType}");
        continue;
    }

    result.FilesScanned += 1;

    var now = DateTime.Now;
            var ageHours = Math.Max(0, (now - file.CreatedAt).TotalHours);
            var expired = _filesystem.IsExpired(file, job.RetentionHours, now);
            _logger.FileDecision(file, ageHours, job.RetentionHours, expired);

            if (!expired)
            {
                result.FilesRetained += 1;
                continue;
            }

            if (dryRun)
            {
                _logger.Info($"DRY RUN: would delete {file.FilePath}");
                continue;
            }

            try
            {
                _filesystem.Delete(file);
                await _database.InsertDeleteLogAsync(job, file, DateTime.Now, "Success", cancellationToken);
                result.FilesDeleted += 1;
                _logger.Success($"File deleted: {file.FilePath}");
            }
            catch (Exception ex)
            {
                result.ErrorsCount += 1;
                try
                {
                    await _database.InsertDeleteLogAsync(job, file, DateTime.Now, "Failed", cancellationToken);
                }
                catch (Exception logError)
                {
                    _logger.Warning($"Unable to write failed DELETE_LOGS row for {file.FileName}: {logError.Message}");
                }

                await RecordErrorAsync(ToFailure(job, ex, "FILE_DELETE_ERROR", file.FilePath, file.FileName), cancellationToken);
                _logger.Error($"Unable to delete {file.FilePath}: {ex.Message}");
            }
        }

        result.Status = dryRun ? "Dry Run" : result.ErrorsCount > 0 ? "Completed with Errors" : "Completed";
        _logger.Info($"Job {job.JobId} complete: scanned={result.FilesScanned}, retained={result.FilesRetained}, deleted={result.FilesDeleted}, errors={result.ErrorsCount}");
        return result;
    }

    private async Task RecordErrorAsync(FileFailure failure, CancellationToken cancellationToken)
    {
        try
        {
            await _database.InsertErrorLogAsync(failure, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.Warning($"Unable to write ERROR_LOGS row: {ex.Message}");
        }
    }

    private static FileFailure ToFailure(RetentionJob job, Exception ex, string type, string path, string fileName = "")
    {
        var statusCode = ex switch
        {
            FileNotFoundException or DirectoryNotFoundException => 404,
            UnauthorizedAccessException => 403,
            IOException => 503,
            _ => 500
        };
        return new FileFailure
        {
            JobId = job.JobId,
            FileName = fileName,
            FilePath = path,
            ErrorType = type,
            Message = ex.Message,
            StatusCode = statusCode,
            Severity = statusCode >= 500 ? "ERROR" : "WARN",
            StackTrace = ex.ToString()
        };
    }
}
