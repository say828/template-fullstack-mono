import fs from "node:fs";
import path from "node:path";

export function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function timestampUtc(now = new Date()) {
  const parts = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ];
  return `${parts[0]}${parts[1]}${parts[2]}${parts[3]}${parts[4]}${parts[5]}`;
}

export function writeJson(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
