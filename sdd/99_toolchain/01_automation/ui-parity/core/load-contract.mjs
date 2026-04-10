import fs from "node:fs";
import path from "node:path";

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseViewport(value) {
  if (!value || typeof value !== "object") return null;
  const width = normalizeNumber(value.width, NaN);
  const height = normalizeNumber(value.height, NaN);
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseRect(value) {
  if (!value || typeof value !== "object") return null;
  const x = normalizeNumber(value.x, NaN);
  const y = normalizeNumber(value.y, NaN);
  const width = normalizeNumber(value.width, NaN);
  const height = normalizeNumber(value.height, NaN);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

function parseRectList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(parseRect).filter(Boolean);
}

function inferRepoRoot(contractPath) {
  const parts = path.resolve(contractPath).split(path.sep);
  const sddIndex = parts.lastIndexOf("sdd");
  if (sddIndex <= 0) {
    return path.dirname(path.resolve(contractPath));
  }
  const rootParts = parts.slice(0, sddIndex);
  return rootParts.length === 0 ? path.sep : rootParts.join(path.sep) || path.sep;
}

export function loadContract(contractPath, loadYaml) {
  const resolvedPath = path.resolve(contractPath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = loadYaml(raw) ?? {};
  const screens = Array.isArray(parsed.screens)
    ? parsed.screens.map((screen) => ({
        id: screen.id,
        route: screen.route,
        referenceImage: screen.reference_image ?? screen.referenceImage ?? null,
        captureFullPage: screen.capture_full_page ?? screen.captureFullPage ?? false,
        allowResize: normalizeBoolean(screen.allow_resize, false),
        pixelmatchThreshold: normalizeNumber(screen.pixelmatch_threshold, 0.1),
        includeAA: normalizeBoolean(screen.include_aa, true),
        viewport: parseViewport(screen.viewport),
        maskRects: parseRectList(screen.mask_rects),
        maxDiffRatio: Number.isFinite(Number(screen.max_diff_ratio))
          ? Number(screen.max_diff_ratio)
          : 0,
      }))
    : [];
  const targetBaseUrl = parsed?.spec?.target_base_url ?? parsed?.target_base_url ?? "";
  return {
    resolvedPath,
    contract: {
      ...parsed,
      screens,
      targetBaseUrl,
      repoRoot: inferRepoRoot(resolvedPath),
    },
  };
}
