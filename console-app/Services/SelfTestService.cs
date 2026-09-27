using FileRetentionConsole.Models;

namespace FileRetentionConsole.Services;

public sealed class SelfTestService
{
    public SelfTestResult Run()
    {
        var result = new SelfTestResult();
        var root = Path.Combine(Path.GetTempPath(), "FileRetentionConsoleSelfTest", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            var service = new FileSystemService(root, "LastWriteTime");
            var oldFile = Path.Combine(root, "old.xml");
            var newFile = Path.Combine(root, "new.xml");
            var pdfFile = Path.Combine(root, "document.pdf");
            File.WriteAllText(oldFile, "old");
            File.WriteAllText(newFile, "new");
            File.WriteAllText(pdfFile, "pdf");
            File.SetLastWriteTime(oldFile, DateTime.Now.AddHours(-48));
            File.SetLastWriteTime(newFile, DateTime.Now.AddHours(-1));

            var files = service.ListFiles(root);
            Check(files.Count == 3, "Lists only direct files", result);
            Check(service.MatchesFileType("old.xml", "XML"), "Matches configured extension", result);
            Check(!service.MatchesFileType("document.pdf", "XML"), "Rejects wrong extension", result);
            var oldCandidate = files.Single(file => file.FileName == "old.xml");
            var newCandidate = files.Single(file => file.FileName == "new.xml");
            Check(service.IsExpired(oldCandidate, 24, DateTime.Now), "Marks expired file", result);
            Check(!service.IsExpired(newCandidate, 24, DateTime.Now), "Retains non-expired file", result);

            var outside = Path.Combine(Path.GetTempPath(), "outside-retention-test.txt");
            try
            {
                service.ValidateFolder(Path.GetDirectoryName(outside)!);
                result.Failed++;
            }
            catch (UnauthorizedAccessException)
            {
                result.Passed++;
            }

            service.Delete(oldCandidate);
            Check(!File.Exists(oldFile), "Deletes only the requested file", result);
            Check(File.Exists(newFile), "Leaves newer file untouched", result);
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
        return result;
    }

    private static void Check(bool condition, string description, SelfTestResult result)
    {
        if (condition)
        {
            Console.WriteLine($"[PASS] {description}");
            result.Passed++;
        }
        else
        {
            Console.WriteLine($"[FAIL] {description}");
            result.Failed++;
        }
    }
}
