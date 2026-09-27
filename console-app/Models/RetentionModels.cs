namespace FileRetentionConsole.Models;

public sealed class WorkerOptions
{
    public string ConnectionString { get; init; } = string.Empty;
    public string RetentionRoot { get; init; } = string.Empty;
    public bool DryRun { get; init; }
    public string FileTimeMode { get; init; } = "CreationTime";
    public int CommandTimeoutSeconds { get; init; } = 30;
}

public sealed class RetentionJob
{
    public int JobId { get; init; }
    public int CustomerId { get; init; }
    public string ProjectName { get; init; } = string.Empty;
    public string FolderPath { get; init; } = string.Empty;
    public string FileType { get; init; } = string.Empty;
    public int RetentionHours { get; init; }
    public bool IsEnabled { get; init; }
    public bool ExcludeFolder { get; init; }
    public string? DisableReason { get; init; }
}

public sealed class FileCandidate
{
    public string FileName { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class RunSummary
{
    public DateTime StartedAt { get; init; }
    public DateTime EndedAt { get; set; }
    public int JobsProcessed { get; set; }
    public int FilesScanned { get; set; }
    public int FilesDeleted { get; set; }
    public int FilesRetained { get; set; }
    public int ErrorsCount { get; set; }
    public string Status { get; set; } = "Running";
}

public sealed class JobSummary
{
    public int JobId { get; init; }
    public string ProjectName { get; init; } = string.Empty;
    public int FilesScanned { get; set; }
    public int FilesDeleted { get; set; }
    public int FilesRetained { get; set; }
    public int ErrorsCount { get; set; }
    public string Status { get; set; } = "Running";
}

public sealed class FileFailure
{
    public int JobId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
    public string ErrorType { get; init; } = "FILE_DELETE_ERROR";
    public string Message { get; init; } = string.Empty;
    public int StatusCode { get; init; } = 500;
    public string Severity { get; init; } = "ERROR";
    public string? StackTrace { get; init; }
}

public sealed class SelfTestResult
{
    public int Passed { get; set; }
    public int Failed { get; set; }
    public bool Success => Failed == 0;
}
