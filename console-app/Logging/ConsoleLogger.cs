using FileRetentionConsole.Models;

namespace FileRetentionConsole.Logging;

public sealed class ConsoleLogger
{
    private readonly object _sync = new();

    public void Banner()
    {
        WriteRaw("==================================================", ConsoleColor.DarkCyan);
        WriteRaw("FILE RETENTION SYSTEM", ConsoleColor.Cyan);
        WriteRaw("==================================================", ConsoleColor.DarkCyan);
    }

    public void Info(string message) => Write("INFO", message, ConsoleColor.Gray);
    public void Success(string message) => Write("SUCCESS", message, ConsoleColor.Green);
    public void Warning(string message) => Write("WARN", message, ConsoleColor.Yellow);
    public void Error(string message) => Write("ERROR", message, ConsoleColor.Red);

    public void JobStarted(RetentionJob job) => Info($"Processing Job {job.JobId}: {job.ProjectName}");
    public void FileDecision(FileCandidate file, double ageHours, int retentionHours, bool expired)
    {
        Info($"{file.FileName} | Age: {ageHours:F2} hours | Retention: {retentionHours} hours | Decision: {(expired ? "DELETE" : "KEEP")}");
    }

    private void Write(string level, string message, ConsoleColor color)
    {
        lock (_sync)
        {
            var previous = Console.ForegroundColor;
            Console.ForegroundColor = color;
            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level}] {message}");
            Console.ForegroundColor = previous;
        }
    }

    private void WriteRaw(string message, ConsoleColor color)
    {
        lock (_sync)
        {
            var previous = Console.ForegroundColor;
            Console.ForegroundColor = color;
            Console.WriteLine(message);
            Console.ForegroundColor = previous;
        }
    }
}
