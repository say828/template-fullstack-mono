#!/usr/bin/env node
import path from "node:path";
import { createRequire } from "node:module";
import { loadAdapter } from "../core/load-adapter.mjs";
import { loadContract } from "../core/load-contract.mjs";
import { runProof } from "../core/proof-runner.mjs";
import { createPlaywrightRuntime } from "../runtime/playwright-runtime.mjs";

function parseArgs(argv) {
  const args = {
    adapter: "",
    contract: "",
    out: "",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--adapter" && argv[index + 1]) {
      args.adapter = argv[++index];
    } else if (token === "--contract" && argv[index + 1]) {
      args.contract = argv[++index];
    } else if (token === "--out" && argv[index + 1]) {
      args.out = argv[++index];
    }
  }
  if (!args.adapter || !args.contract || !args.out) {
    throw new Error("Usage: run-proof.mjs --adapter <path> --contract <path> --out <path>");
  }
  return args;
}

const args = parseArgs(process.argv);
const { resolvedPath, adapter } = await loadAdapter(args.adapter);
const requireFromAdapter = createRequire(resolvedPath);
const yaml = requireFromAdapter("yaml");
const { resolvedPath: resolvedContractPath, contract } = loadContract(args.contract, (text) => yaml.parse(text));
const runtime = await createPlaywrightRuntime(requireFromAdapter);
const payload = await runProof({
  adapterPath: path.relative(process.cwd(), resolvedPath),
  contractPath: path.relative(process.cwd(), resolvedContractPath),
  outPath: path.resolve(args.out),
  adapter,
  contract,
  browser: runtime.browser,
  requireFromAdapter,
});
await runtime.dispose();
console.log(`proof_output=${path.resolve(args.out)}`);
console.log(`screens=${payload.summary.total}`);
console.log(`missing_reference=${payload.summary.missing_reference}`);
console.log(`capture_error=${payload.summary.capture_error}`);
