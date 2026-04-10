import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadAdapter(adapterPath) {
  const resolvedPath = path.resolve(adapterPath);
  const moduleUrl = pathToFileURL(resolvedPath).href;
  const loaded = await import(moduleUrl);
  const adapter = loaded.default ?? loaded.adapter ?? loaded;
  if (!adapter || typeof adapter !== "object") {
    throw new Error(`Invalid adapter module: ${resolvedPath}`);
  }
  if (typeof adapter.service !== "string" || !adapter.service.trim()) {
    throw new Error(`Adapter is missing required string field: service (${resolvedPath})`);
  }
  if (typeof adapter.targetBaseUrl !== "string" || !adapter.targetBaseUrl.trim()) {
    throw new Error(`Adapter is missing required string field: targetBaseUrl (${resolvedPath})`);
  }
  if (!Array.isArray(adapter.screens) || adapter.screens.length === 0) {
    throw new Error(`Adapter must expose a non-empty screens array (${resolvedPath})`);
  }
  return {
    resolvedPath,
    adapter,
  };
}
