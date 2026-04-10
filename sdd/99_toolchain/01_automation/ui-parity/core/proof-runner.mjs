import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDirectory, timestampUtc, writeJson } from "./paths.mjs";
import { captureScreen, sanitizeFileName } from "./capture-runner.mjs";

function loadPng(filePath) {
  const { PNG } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  return PNG.sync.read(fs.readFileSync(filePath));
}

function clonePng(png) {
  const { PNG } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  const next = new PNG({ width: png.width, height: png.height });
  png.data.copy(next.data);
  return next;
}

function writePng(filePath, png) {
  const { PNG } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function createBlankDiff(width, height) {
  const { PNG } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  return new PNG({ width, height });
}

function applyMaskRects(png, rects) {
  if (!Array.isArray(rects) || rects.length === 0) return png;
  const masked = clonePng(png);
  for (const rect of rects) {
    const xStart = Math.max(0, Math.floor(rect.x));
    const yStart = Math.max(0, Math.floor(rect.y));
    const xEnd = Math.min(masked.width, xStart + Math.floor(rect.width));
    const yEnd = Math.min(masked.height, yStart + Math.floor(rect.height));
    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        const index = (masked.width * y + x) * 4;
        masked.data[index] = 255;
        masked.data[index + 1] = 255;
        masked.data[index + 2] = 255;
        masked.data[index + 3] = 255;
      }
    }
  }
  return masked;
}

function resizeNearestNeighbor(source, targetWidth, targetHeight) {
  const { PNG } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  const resized = new PNG({ width: targetWidth, height: targetHeight });
  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const srcX = Math.min(source.width - 1, Math.floor((x / targetWidth) * source.width));
      const srcY = Math.min(source.height - 1, Math.floor((y / targetHeight) * source.height));
      const srcIndex = (source.width * srcY + srcX) * 4;
      const dstIndex = (targetWidth * y + x) * 4;
      resized.data[dstIndex] = source.data[srcIndex];
      resized.data[dstIndex + 1] = source.data[srcIndex + 1];
      resized.data[dstIndex + 2] = source.data[srcIndex + 2];
      resized.data[dstIndex + 3] = source.data[srcIndex + 3];
    }
  }
  return resized;
}

function compareImages(referencePath, actualPath, diffPath, options = {}) {
  const { pixelmatch } = globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  let reference = loadPng(referencePath);
  let actual = loadPng(actualPath);
  reference = applyMaskRects(reference, options.maskRects);
  actual = applyMaskRects(actual, options.maskRects);
  if (reference.width !== actual.width || reference.height !== actual.height) {
    if (options.allowResize) {
      actual = resizeNearestNeighbor(actual, reference.width, reference.height);
    } else {
      return {
        diffRatio: 1,
        status: "size_mismatch",
        detail: `reference=${reference.width}x${reference.height} actual=${actual.width}x${actual.height}`,
      };
    }
  }

  if (reference.width !== actual.width || reference.height !== actual.height) {
    return {
      diffRatio: 1,
      status: "size_mismatch",
      detail: `reference=${reference.width}x${reference.height} actual=${actual.width}x${actual.height}`,
    };
  }

  const diff = createBlankDiff(reference.width, reference.height);
  const diffPixels = pixelmatch(
    reference.data,
    actual.data,
    diff.data,
    reference.width,
    reference.height,
    {
      threshold: options.pixelmatchThreshold ?? 0.1,
      includeAA: options.includeAA ?? true,
    },
  );
  writePng(diffPath, diff);
  return {
    diffRatio: diffPixels / (reference.width * reference.height),
    status: diffPixels === 0 ? "passed" : "failed",
    detail: `reference=${reference.width}x${reference.height} actual=${actual.width}x${actual.height} diff_pixels=${diffPixels}`,
  };
}

export async function runProof({
  adapterPath,
  contractPath,
  outPath,
  adapter,
  contract,
  browser,
  requireFromAdapter,
}) {
  const pixelmatchModule = await import(pathToFileURL(requireFromAdapter.resolve("pixelmatch")).href);
  const { PNG } = requireFromAdapter("pngjs");
  globalThis.__TEMPLATE_UI_PARITY_DEPS__ = {
    pixelmatch: pixelmatchModule.default ?? pixelmatchModule,
    PNG,
  };
  const evidenceRoot = path.dirname(path.resolve(outPath));
  const timestamp = timestampUtc();
  const timestampRoot = path.join(evidenceRoot, timestamp);
  const actualRoot = path.join(timestampRoot, "actual");
  const diffRoot = path.join(timestampRoot, "diff");
  ensureDirectory(actualRoot);
  ensureDirectory(diffRoot);

  const configuredScreens = Array.isArray(contract?.screens) && contract.screens.length > 0 ? contract.screens : adapter.screens ?? [];
  const baseUrl = adapter.targetBaseUrl ?? contract?.targetBaseUrl ?? "http://127.0.0.1:4301";
  const defaultViewport = adapter.viewport ?? { width: 1440, height: 1024 };
  const repoRoot = contract?.repoRoot ?? process.cwd();

  const results = [];
  for (const configuredScreen of configuredScreens) {
    const screen = {
      ...configuredScreen,
      referenceImage:
        configuredScreen.referenceImage ??
        configuredScreen.reference_image ??
        `sdd/03_verify/10_test/ui_parity/reference/${configuredScreen.id}.png`,
    };
    const stem = sanitizeFileName(screen.id || screen.route);
    const actualPath = path.join(actualRoot, `${stem}.png`);
    const diffPath = path.join(diffRoot, `${stem}.png`);
    const referencePath = screen.referenceImage ? path.resolve(screen.referenceImage) : null;
    const resolvedReferencePath =
      screen.referenceImage && !path.isAbsolute(screen.referenceImage)
        ? path.resolve(repoRoot, screen.referenceImage)
        : referencePath;

    try {
      const capture = await captureScreen({
        browser,
        screen,
        adapter,
        outputPath: actualPath,
        baseUrl,
        viewport: screen.viewport ?? defaultViewport,
      });
      const actualRelative = path.relative(path.dirname(outPath), actualPath).split(path.sep).join("/");

      if (!resolvedReferencePath || !fs.existsSync(resolvedReferencePath)) {
        results.push({
          id: screen.id,
          title: screen.title ?? null,
          route: screen.route,
          tags: Array.isArray(screen.tags) ? screen.tags : [],
          status: "missing_reference",
          diff_ratio: 1,
          reference_image: screen.referenceImage ?? null,
          actual_image: actualRelative,
          diff_image: null,
          detail: "Reference image is missing. Capture succeeded but comparison was skipped.",
          target_url: capture.targetUrl,
        });
        continue;
      }

      const compared = compareImages(resolvedReferencePath, actualPath, diffPath, {
        allowResize: Boolean(screen.allowResize),
        pixelmatchThreshold: screen.pixelmatchThreshold,
        includeAA: screen.includeAA,
        maskRects:
          typeof adapter.resolveMaskRects === "function"
            ? await adapter.resolveMaskRects({ screen, baseUrl, defaultViewport })
            : screen.maskRects,
      });
      const threshold = Number.isFinite(Number(screen.maxDiffRatio)) ? Number(screen.maxDiffRatio) : 0;
      const withinThreshold = compared.diffRatio <= threshold;
      results.push({
        id: screen.id,
        title: screen.title ?? null,
        route: screen.route,
        tags: Array.isArray(screen.tags) ? screen.tags : [],
        status: compared.status === "size_mismatch" ? compared.status : withinThreshold ? "passed" : "failed",
        diff_ratio: compared.diffRatio,
        max_diff_ratio: threshold,
        reference_image: screen.referenceImage,
        actual_image: actualRelative,
        diff_image: path.relative(path.dirname(outPath), diffPath).split(path.sep).join("/"),
        detail: compared.detail,
        target_url: capture.targetUrl,
      });
    } catch (error) {
      results.push({
        id: screen.id,
        title: screen.title ?? null,
        route: screen.route,
        tags: Array.isArray(screen.tags) ? screen.tags : [],
        status: "capture_error",
        diff_ratio: 1,
        max_diff_ratio: Number.isFinite(Number(screen.maxDiffRatio)) ? Number(screen.maxDiffRatio) : 0,
        reference_image: screen.referenceImage ?? null,
        actual_image: null,
        diff_image: null,
        detail: error instanceof Error ? error.message : String(error),
        target_url: new URL(screen.route, baseUrl).toString(),
      });
    }
  }

  const summary = {
    total: results.length,
    passed: results.filter((screen) => screen.status === "passed").length,
    failed: results.filter((screen) => screen.status === "failed" || screen.status === "size_mismatch").length,
    missing_reference: results.filter((screen) => screen.status === "missing_reference").length,
    capture_error: results.filter((screen) => screen.status === "capture_error").length,
    matched: results.filter((screen) => screen.status === "passed").length === results.length && results.length > 0,
  };

  const payload = {
    generated_at: new Date().toISOString(),
    service: adapter.service ?? "replace-service-name",
    adapter_path: adapterPath,
    contract_path: contractPath,
    target_base_url: baseUrl,
    default_viewport: defaultViewport,
    screens: results,
    summary,
  };

  writeJson(outPath, payload);
  delete globalThis.__TEMPLATE_UI_PARITY_DEPS__;
  return payload;
}
