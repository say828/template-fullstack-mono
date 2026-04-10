#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDirectory, writeJson } from "../core/paths.mjs";

function loadJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function parseArgs(argv) {
  const args = {
    service: "",
    screens: "",
    routes: "",
    out: "",
    markdownOut: "",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--service" && argv[index + 1]) {
      args.service = argv[++index];
    } else if (token === "--screens" && argv[index + 1]) {
      args.screens = argv[++index];
    } else if (token === "--routes" && argv[index + 1]) {
      args.routes = argv[++index];
    } else if (token === "--out" && argv[index + 1]) {
      args.out = argv[++index];
    } else if (token === "--markdown-out" && argv[index + 1]) {
      args.markdownOut = argv[++index];
    }
  }
  if (!args.screens || !args.routes || !args.out) {
    throw new Error(
      "Usage: route-gap-report.mjs [--service <name>] --screens <json> --routes <json> --out <json> [--markdown-out <md>]",
    );
  }
  return args;
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function routeStatusFor(entry, routeUsage) {
  if (!entry) return "missing";
  const binding = String(entry.binding ?? entry.mode ?? "direct").trim().toLowerCase();
  if (binding === "stateful") return "stateful";
  if (binding === "shared") return "shared";
  if (binding === "missing") return "missing";
  const route = String(entry.route ?? "").trim();
  if (!route) return "missing";
  if ((routeUsage.get(route) ?? 0) > 1) return "shared";
  return "direct";
}

function bindingSourceFor(entry) {
  if (!entry) return "missing";
  return entry.binding || entry.mode ? "explicit" : "inferred";
}

function coverageStateFor(status) {
  if (status === "direct") return "route_bound";
  if (status === "shared") return "shared_route";
  if (status === "stateful") return "state_transition";
  return "unmapped";
}

function evidenceLevelFor(status, bindingSource, hasNotes, hasTags) {
  if (status === "missing") return "missing";
  if (status === "stateful") return "weak";
  if (status === "shared") return hasNotes || hasTags ? "medium" : "weak";
  if (bindingSource === "explicit" && (hasNotes || hasTags)) return "strong";
  if (bindingSource === "explicit") return "medium";
  return hasNotes || hasTags ? "medium" : "weak";
}

function renderMarkdown(report) {
  const lines = [
    "# UI Parity Route Gap Report",
    "",
    `- Service: ${report.service}`,
    `- Generated At: ${report.generated_at}`,
    `- Total: ${report.summary.total}`,
    `- Direct: ${report.summary.direct}`,
    `- Shared: ${report.summary.shared}`,
    `- Stateful: ${report.summary.stateful}`,
    `- Missing: ${report.summary.missing}`,
    `- Coverage Ratio: ${report.summary.coverage_ratio}`,
    `- Strong Evidence: ${report.summary.strong_evidence}`,
    `- With Notes: ${report.summary.with_notes}`,
    `- With Tags: ${report.summary.with_tags}`,
    "",
    "| ID | Title | Route | Status | Evidence | Tags | Linked Screens |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const screen of report.screens) {
    lines.push(
      `| ${screen.id} | ${screen.title} | ${screen.route ?? ""} | ${screen.status} | ${screen.evidence_level} | ${screen.tags.join(", ")} | ${screen.duplicate_route_ids.join(", ")} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

const args = parseArgs(process.argv);
const screens = loadJson(path.resolve(args.screens));
const routes = loadJson(path.resolve(args.routes));
const routeUsage = new Map();
for (const routeEntry of routes) {
  const route = String(routeEntry.route ?? "").trim();
  if (!route) continue;
  routeUsage.set(route, (routeUsage.get(route) ?? 0) + 1);
}

const routeMap = new Map(routes.map((entry) => [entry.id, entry]));
const duplicateRouteGroups = [];
const rows = screens.map((screen) => {
  const entry = routeMap.get(screen.id) ?? null;
  const status = routeStatusFor(entry, routeUsage);
  const route = entry?.route ?? null;
  const duplicateRouteIds =
    route && (routeUsage.get(route) ?? 0) > 1
      ? routes.filter((routeEntry) => routeEntry.route === route && routeEntry.id !== screen.id).map((routeEntry) => routeEntry.id)
      : [];
  if (route && duplicateRouteIds.length > 0 && !duplicateRouteGroups.some((group) => group.route === route)) {
    duplicateRouteGroups.push({
      route,
      screen_ids: routes.filter((routeEntry) => routeEntry.route === route).map((routeEntry) => routeEntry.id),
    });
  }
  const tags = normalizeStringArray([...(screen.tags ?? []), ...(entry?.tags ?? [])]);
  const notes = normalizeStringArray([...(screen.notes ?? []), ...(entry?.notes ?? [])]);
  const bindingSource = bindingSourceFor(entry);
  return {
    id: screen.id,
    title: screen.title,
    route,
    status,
    binding: String(entry?.binding ?? entry?.mode ?? status),
    binding_source: bindingSource,
    coverage_state: coverageStateFor(status),
    evidence_level: evidenceLevelFor(status, bindingSource, notes.length > 0, tags.length > 0),
    route_defined: Boolean(route),
    has_notes: notes.length > 0,
    has_tags: tags.length > 0,
    duplicate_route_ids: duplicateRouteIds,
    tags,
    notes,
  };
});

const report = {
  generated_at: new Date().toISOString(),
  service: args.service || path.basename(path.dirname(path.resolve(args.screens))),
  screens_path: path.resolve(args.screens),
  routes_path: path.resolve(args.routes),
  summary: {
    total: rows.length,
    direct: rows.filter((row) => row.status === "direct").length,
    shared: rows.filter((row) => row.status === "shared").length,
    stateful: rows.filter((row) => row.status === "stateful").length,
    missing: rows.filter((row) => row.status === "missing").length,
    coverage_ratio: rows.length > 0 ? Number((rows.filter((row) => row.status === "direct").length / rows.length).toFixed(4)) : 0,
    explicit_bindings: rows.filter((row) => row.binding_source === "explicit").length,
    strong_evidence: rows.filter((row) => row.evidence_level === "strong").length,
    medium_evidence: rows.filter((row) => row.evidence_level === "medium").length,
    weak_evidence: rows.filter((row) => row.evidence_level === "weak").length,
    with_notes: rows.filter((row) => row.has_notes).length,
    with_tags: rows.filter((row) => row.has_tags).length,
    duplicate_route_groups: duplicateRouteGroups.length,
  },
  duplicate_route_groups: duplicateRouteGroups,
  screens: rows,
};

ensureDirectory(path.dirname(path.resolve(args.out)));
writeJson(path.resolve(args.out), report);

if (args.markdownOut) {
  ensureDirectory(path.dirname(path.resolve(args.markdownOut)));
  fs.writeFileSync(path.resolve(args.markdownOut), renderMarkdown(report), "utf8");
}

console.log(`route_gap_output=${path.resolve(args.out)}`);
if (args.markdownOut) {
  console.log(`route_gap_markdown=${path.resolve(args.markdownOut)}`);
}
