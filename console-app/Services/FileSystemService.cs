using FileRetentionConsole.Models;

namespace FileRetentionConsole.Services;

public sealed class FileSystemService
{
    private readonly string _retentionRoot;
    private readonly bool _caseInsensitivePaths;
    private readonly string _fileTimeMode;

    public FileSystemService(string retentionRoot, string fileTimeMode)
    {
        if (string.IsNullOrWhiteSpace(retentionRoot))
            throw new ArgumentException("RetentionRoot is required for filesystem processing.", nameof(retentionRoot));

        _retentionRoot = Path.GetFullPath(retentionRoot.Trim());
        _caseInsensitivePaths = OperatingSystem.IsWindows();
        _fileTimeMode = fileTimeMode;
    }

    public string ValidateFolder(string folderPath)
    {
        if (string.IsNullOrWhiteSpace(folderPath))
            throw new DirectoryNotFoundException("Job folder path is empty.");

        var resolvedRoot = Path.GetFullPath(_retentionRoot);
        var resolvedFolder = Path.GetFullPath(folderPath.Trim());
        var comparison = _caseInsensitivePaths ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        var rootWithSeparator = resolvedRoot.EndsWith(Path.DirectorySeparatorChar)
            ? resolvedRoot
            : resolvedRoot + Path.DirectorySeparatorChar;

        if (!string.Equals(resolvedFolder, resolvedRoot, comparison) &&
            !resolvedFolder.StartsWith(rootWithSeparator, comparison))
        {
            throw new UnauthorizedAccessException($"Job folder is outside RETENTION_ROOT: {resolvedFolder}");
        }

        if (!Directory.Exists(resolvedFolder))
            throw new DirectoryNotFoundException($"Job folder does not exist: {resolvedFolder}");

        return resolvedFolder;
    }

    public IReadOnlyList<FileCandidate> ListFiles(string folderPath)
    {
        var resolvedFolder = ValidateFolder(folderPath);
        var result = new List<FileCandidate>();
        foreach (var path in Directory.EnumerateFiles(resolvedFolder, "*", SearchOption.TopDirectoryOnly))
        {
            var attributes = File.GetAttributes(path);
            if ((attributes & FileAttributes.ReparsePoint) != 0) continue;
            var info = new FileInfo(path);
            var createdAt = _fileTimeMode.Equals("LastWriteTime", StringComparison.OrdinalIgnoreCase)
                ? info.LastWriteTime
                : info.CreationTime;
            result.Add(new FileCandidate
            {
                FileName = info.Name,
                FilePath = info.FullName,
                CreatedAt = createdAt
            });
        }
        return result;
    }

    public bool MatchesFileType(string fileName, string? configuredType)
    {
        if (string.IsNullOrWhiteSpace(configuredType) || configuredType.Trim().Equals("all", StringComparison.OrdinalIgnoreCase))
            return true;

        var wanted = configuredType.Trim().TrimStart('.');
        var actual = Path.GetExtension(fileName).TrimStart('.');
        return actual.Equals(wanted, StringComparison.OrdinalIgnoreCase);
    }

    public bool IsExpired(FileCandidate file, int retentionHours, DateTime now)
    {
        var ageHours = Math.Max(0, (now - file.CreatedAt).TotalHours);
        return ageHours >= retentionHours;
    }

    public void Delete(FileCandidate file)
    {
        File.Delete(file.FilePath);
    }
}
