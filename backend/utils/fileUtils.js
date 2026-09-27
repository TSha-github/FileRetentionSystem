const path = require("path");
const fs = require("fs/promises");
const { AppError } = require("./core");

function normalizeRoot(value) {
  return value ? path.resolve(value) : null;
}

function assertAllowedPath(folderPath) {
  const resolved = path.resolve(folderPath);
  const root = normalizeRoot(process.env.RETENTION_ROOT);
  if (process.env.NODE_ENV === "production" && !root) {
    throw new AppError(500, "RETENTION_ROOT is required in production", "RETENTION_CONFIGURATION_ERROR");
  }
  if (root && resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new AppError(400, "Job folder is outside the configured retention root", "INVALID_RETENTION_PATH");
  }
  return resolved;
}

async function listFiles(folderPath) {
  const resolved = assertAllowedPath(folderPath);
  let entries;
  try {
    entries = await fs.readdir(resolved, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new AppError(404, "Job folder does not exist", "RETENTION_FOLDER_NOT_FOUND");
    }
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(resolved, entry.name);
    const stat = await fs.stat(filePath);
    files.push({ fileName: entry.name, filePath, stat });
  }
  return files;
}

function parseExcludedNames(value) {
  if (!value) return [];
  return String(value).split(",").map((part) => part.trim()).filter(Boolean);
}

function isExcluded(fileName, filePath, excludeFolder) {
  const exclusions = parseExcludedNames(excludeFolder);
  return exclusions.some((part) => fileName === part || filePath.includes(part));
}

function matchesFileType(fileName, fileType) {
  if (!fileType || String(fileType).toLowerCase() === "all") return true;
  const wanted = String(fileType).trim().toLowerCase().replace(/^\./, "");
  return path.extname(fileName).replace(/^\./, "").toLowerCase() === wanted;
}

function ageInHours(createdAt, now = new Date()) {
  return Math.max(0, (now.getTime() - new Date(createdAt).getTime()) / 3600000);
}

module.exports = {
  assertAllowedPath,
  listFiles,
  isExcluded,
  matchesFileType,
  ageInHours
};
