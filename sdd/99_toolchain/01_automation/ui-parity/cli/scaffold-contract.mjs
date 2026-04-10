#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadAdapter } from "../core/load-adapter.mjs";
import { ensureDirectory } from "../core/paths.mjs";

function parseArgs(argv) {
  const args = {
    adapter: "",
    out: "",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--adapter" && argv[index + 1]) {
      args.adapter = argv[++index];
    } else if (token === "--out" && argv[index + 1]) {
      args.out = argv[++index];
    }
  }
  if (!args.adapter || !args.out) {
    throw new Error("Usage: scaffold-contract.mjs --adapter <path> --out <path>");
  }
  return args;
}

function renderYaml(adapterPath, adapter) {
  const screens = Array.isArray(adapter.screens) ? adapter.screens : [];
  const lines = [
    "kind: ui-parity",
    "metadata:",
    `  service: ${adapter.service ?? "replace-service-name"}`,
    "  generated_by: sdd/99_toolchain/01_automation/ui-parity/cli/scaffold-contract.mjs",
    "spec:",
    `  target_base_url: ${adapter.targetBaseUrl ?? "http://127.0.0.1:4301"}`,
    `  adapter_path: ${adapterPath}`,
    "screens:",
  ];
  if (screens.length === 0) {
    lines.push("  - id: TMP_001");
    lines.push("    route: /");
    lines.push("    reference_image: sdd/03_verify/10_test/ui_parity/reference/TMP_001.png");
  } else {
    for (const screen of screens) {
      lines.push(`  - id: ${screen.id}`);
      lines.push(`    route: ${screen.route}`);
      lines.push(
        `    reference_image: ${screen.referenceImage ?? `sdd/03_verify/10_test/ui_parity/reference/${screen.id}.png`}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

const args = parseArgs(process.argv);
const { resolvedPath, adapter } = await loadAdapter(args.adapter);
ensureDirectory(path.dirname(path.resolve(args.out)));
fs.writeFileSync(
  path.resolve(args.out),
  renderYaml(path.relative(process.cwd(), resolvedPath), adapter),
  "utf8",
);
console.log(`contract_output=${path.resolve(args.out)}`);
