#!/usr/bin/env node
import path from "node:path";
import { createRequire } from "node:module";

import { loadAdapter } from "../core/load-adapter.mjs";
import { loadContract } from "../core/load-contract.mjs";
import { captureScreen, sanitizeFileName } from "../core/capture-runner.mjs";
import { createPlaywrightRuntime } from "../runtime/playwright-runtime.mjs";

function parseArgs(argv) {
  const args = {
    adapter: "",
    contract: "",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--adapter" && argv[index + 1]) {
      args.adapter = argv[++index];
    } else if (token === "--contract" && argv[index + 1]) {
      args.contract = argv[++index];
    }
  }
  if (!args.adapter || !args.contract) {
    throw new Error("Usage: materialize-reference-assets.mjs --adapter <path> --contract <path>");
  }
  return args;
}

const args = parseArgs(process.argv);
const { resolvedPath, adapter } = await loadAdapter(args.adapter);
const requireFromAdapter = createRequire(resolvedPath);
const yaml = requireFromAdapter("yaml");
const { contract } = loadContract(args.contract, (text) => yaml.parse(text));
const runtime = await createPlaywrightRuntime(requireFromAdapter);
const baseUrl = adapter.targetBaseUrl ?? contract.targetBaseUrl ?? "http://127.0.0.1:4301";
const viewport = adapter.viewport ?? { width: 1440, height: 1024 };
const repoRoot = contract.repoRoot ?? process.cwd();

let generated = 0;
for (const screen of contract.screens) {
  const targetPath = path.resolve(
    repoRoot,
    screen.referenceImage ?? `sdd/03_verify/10_test/ui_parity/reference/${sanitizeFileName(screen.id)}.png`,
  );
  await captureScreen({
    browser: runtime.browser,
    screen,
    adapter,
    outputPath: targetPath,
    baseUrl,
    viewport,
  });
  generated += 1;
  console.log(`reference_image=${targetPath}`);
}

await runtime.dispose();
console.log(`generated=${generated}`);
