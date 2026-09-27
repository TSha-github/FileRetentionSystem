using FileRetentionConsole.Configuration;
using FileRetentionConsole.Data;
using FileRetentionConsole.Logging;
using FileRetentionConsole.Services;

namespace FileRetentionConsole;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        if (args.Any(arg => arg.Equals("--help", StringComparison.OrdinalIgnoreCase) || arg.Equals("-h", StringComparison.OrdinalIgnoreCase)))
        {
            PrintHelp();
            return 0;
        }

        if (args.Any(arg => arg.Equals("--self-test", StringComparison.OrdinalIgnoreCase)))
        {
            var result = new SelfTestService().Run();
            Console.WriteLine($"Self-test complete. Passed: {result.Passed}; Failed: {result.Failed}");
            return result.Success ? 0 : 1;
        }

        var logger = new ConsoleLogger();
        logger.Banner();
        var dryRun = args.Any(arg => arg.Equals("--dry-run", StringComparison.OrdinalIgnoreCase));
        var checkDatabaseOnly = args.Any(arg => arg.Equals("--check-db", StringComparison.OrdinalIgnoreCase));
        var baseDirectory = AppContext.BaseDirectory;

        try
        {
            var options = ConfigurationLoader.Load(baseDirectory, dryRun);
            if (string.IsNullOrWhiteSpace(options.ConnectionString))
                throw new InvalidOperationException("A MySQL connection string is required. Configure appsettings.json or DB_* environment variables.");

            await using var database = new DatabaseService(options.ConnectionString, options.CommandTimeoutSeconds);
            logger.Info("Connecting to MySQL");
            await database.OpenAsync();
            if (!await database.CanConnectAsync())
                throw new InvalidOperationException("The database connection test did not return the expected result.");
            logger.Success("Database Connected");

            if (checkDatabaseOnly)
            {
                logger.Success("Database check completed");
                return 0;
            }

            if (string.IsNullOrWhiteSpace(options.RetentionRoot))
                throw new InvalidOperationException("RetentionRoot is required. Configure it before running the worker.");

            using var cancellation = new CancellationTokenSource();
            Console.CancelKeyPress += (_, eventArgs) =>
            {
                eventArgs.Cancel = true;
                cancellation.Cancel();
                logger.Warning("Cancellation requested; finishing the current safe operation");
            };

            logger.Info(options.DryRun ? "DRY RUN enabled: no files will be deleted" : "Destructive retention mode enabled");
            var filesystem = new FileSystemService(options.RetentionRoot, options.FileTimeMode);
            var retention = new RetentionService(database, filesystem, logger);
            var summary = await retention.RunAsync(options.DryRun, cancellation.Token);
            PrintSummary(summary);
            return summary.ErrorsCount == 0 ? 0 : 2;
        }
        catch (OperationCanceledException)
        {
            logger.Warning("Scheduler cancelled");
            return 2;
        }
        catch (Exception ex)
        {
            logger.Error(ex.Message);
            return 1;
        }
    }

    private static void PrintSummary(FileRetentionConsole.Models.RunSummary summary)
    {
        Console.WriteLine();
        Console.WriteLine("==================================================");
        Console.WriteLine("SCHEDULER SUMMARY");
        Console.WriteLine("==================================================");
        Console.WriteLine($"Status          : {summary.Status}");
        Console.WriteLine($"Jobs Processed  : {summary.JobsProcessed}");
        Console.WriteLine($"Files Scanned   : {summary.FilesScanned}");
        Console.WriteLine($"Files Retained  : {summary.FilesRetained}");
        Console.WriteLine($"Files Deleted   : {summary.FilesDeleted}");
        Console.WriteLine($"Errors          : {summary.ErrorsCount}");
        Console.WriteLine($"Started         : {summary.StartedAt:O}");
        Console.WriteLine($"Ended           : {summary.EndedAt:O}");
        Console.WriteLine("==================================================");
    }

    private static void PrintHelp()
    {
        Console.WriteLine("FileRetentionConsole");
        Console.WriteLine();
        Console.WriteLine("Usage:");
        Console.WriteLine("  FileRetentionConsole.exe              Run the configured retention job");
        Console.WriteLine("  FileRetentionConsole.exe --dry-run   Run selection logic without deleting files");
        Console.WriteLine("  FileRetentionConsole.exe --check-db  Test the configured MySQL connection only");
        Console.WriteLine("  FileRetentionConsole.exe --self-test Run local filesystem safety tests");
        Console.WriteLine("  FileRetentionConsole.exe --help      Show this help");
    }
}
