using System.Text.Json;
using FileRetentionConsole.Models;

namespace FileRetentionConsole.Configuration;

public static class ConfigurationLoader
{
    public static WorkerOptions Load(string baseDirectory, bool dryRunOverride)
    {
        var path = Path.Combine(baseDirectory, "appsettings.json");
        var settings = File.Exists(path)
            ? JsonSerializer.Deserialize<JsonElement>(File.ReadAllText(path))
            : default;

        string GetString(string key, string fallback = "")
        {
            var env = Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(env)) return env;
            if (settings.ValueKind == JsonValueKind.Object && settings.TryGetProperty(key, out var value))
                return value.GetString() ?? fallback;
            return fallback;
        }

        bool GetBool(string key, bool fallback = false)
        {
            var value = GetString(key, fallback.ToString());
            return bool.TryParse(value, out var result) ? result : fallback;
        }

        int GetInt(string key, int fallback)
        {
            var value = GetString(key, fallback.ToString());
            return int.TryParse(value, out var result) ? result : fallback;
        }

        var connectionString = GetString("ConnectionString");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var host = GetString("DB_HOST", "localhost");
            var port = GetString("DB_PORT", "3306");
            var database = GetString("DB_NAME", "FileRetentionSystemSecure1");
            var user = GetString("DB_USER", "root");
            var password = GetString("DB_PASSWORD");
            connectionString = $"Server={host};Port={port};Database={database};User ID={user};Password={password};Allow User Variables=True;";
        }

        return new WorkerOptions
        {
            ConnectionString = connectionString,
            RetentionRoot = GetString("RetentionRoot", GetString("RETENTION_ROOT")),
            DryRun = dryRunOverride || GetBool("DryRun"),
            FileTimeMode = GetString("FileTimeMode", "CreationTime"),
            CommandTimeoutSeconds = GetInt("CommandTimeoutSeconds", 30)
        };
    }
}
