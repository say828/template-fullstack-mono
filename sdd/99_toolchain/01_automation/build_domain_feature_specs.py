#!/usr/bin/env python3
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
FEATURE_ROOT = REPO_ROOT / "sdd" / "01_planning" / "01_feature"

SOURCE_FILES = [
    FEATURE_ROOT / "admin_feature_spec.md",
    FEATURE_ROOT / "platform_feature_spec.md",
    FEATURE_ROOT / "mobile_feature_spec.md",
    FEATURE_ROOT / "landing_feature_spec.md",
]
SOURCE_FILES_BY_SERVICE = {
    source.stem.removesuffix("_feature_spec"): source
    for source in SOURCE_FILES
}

EXPECTED_HEADER = [
    "Feature Code",
    "Use Case",
    "Actor",
    "Bounded Context",
    "Aggregate / Model",
    "Type",
    "Preconditions",
    "Domain Outcome",
    "Invariant / Business Rule",
]

CANONICAL_FEATURE_RE = re.compile(r"^(?P<domain>[A-Z]{3})-F(?P<seq>\d{3})$")
SERVICE_FEATURE_RE = re.compile(r"^(?P<service>[A-Z]{3})-(?P<domain>[A-Z]{3})-F(?P<seq>\d{3})$")
DOMAIN_ALIAS_MAP = {
    "AUT": "USR",
    "CAT": "PRD",
}


@dataclass(frozen=True)
class DomainMeta:
    code: str
    slug: str
    module: str
    owner: str
    title: str
    owner_path: str | None = None

    @property
    def primary_backend_path(self) -> str:
        return self.owner_path or f"server/contexts/{self.module}"


DOMAIN_MAP = {
    "USR": DomainMeta(
        "USR",
        "users",
        "user",
        "UserService / AdminUserService",
        "USERS FEATURE SPEC",
        owner_path="server/contexts/user",
    ),
    "ORG": DomainMeta(
        "ORG",
        "organizations",
        "organizations",
        "OrganizationService",
        "ORGANIZATIONS FEATURE SPEC",
        owner_path="server/contexts/organizations",
    ),
    "PRD": DomainMeta(
        "PRD",
        "products",
        "products",
        "CategoryService / AgentService",
        "PRODUCTS FEATURE SPEC",
        owner_path="server/contexts/products",
    ),
    "BLD": DomainMeta(
        "BLD",
        "chatbot_builder",
        "chatbot_builder",
        "ChatbotBuilderService",
        "CHATBOT BUILDER FEATURE SPEC",
        owner_path="server/contexts/chatbot_builder",
    ),
    "PAY": DomainMeta(
        "PAY",
        "payments",
        "payments",
        "PaymentService / SubscriptionService / WalletService",
        "PAYMENTS FEATURE SPEC",
        owner_path="server/contexts/payments",
    ),
    "SLR": DomainMeta(
        "SLR",
        "sellers",
        "sellers",
        "SellerService",
        "SELLERS FEATURE SPEC",
        owner_path="server/contexts/sellers",
    ),
    "SUP": DomainMeta(
        "SUP",
        "support",
        "support",
        "SupportInquiryService / NotificationService",
        "SUPPORT FEATURE SPEC",
        owner_path="server/contexts/support",
    ),
    "GDE": DomainMeta(
        "GDE",
        "guides",
        "guides",
        "GuideService",
        "GUIDES FEATURE SPEC",
        owner_path="server/contexts/guides",
    ),
    "SUR": DomainMeta(
        "SUR",
        "surveys",
        "surveys",
        "SurveyService / EvaluationReportService",
        "SURVEYS FEATURE SPEC",
        owner_path="server/contexts/surveys",
    ),
    "ASM": DomainMeta(
        "ASM",
        "assessments",
        "assessments",
        "Assessments module owner",
        "ASSESSMENTS FEATURE SPEC",
        owner_path="server/contexts/assessments",
    ),
    "CHT": DomainMeta(
        "CHT",
        "chatbot_core",
        "chatbot_core",
        "SessionService / MessageService",
        "CHATBOT CORE FEATURE SPEC",
        owner_path="server/contexts/chatbot_core",
    ),
    "VOI": DomainMeta(
        "VOI",
        "voice",
        "voice",
        "VoiceService",
        "VOICE FEATURE SPEC",
        owner_path="server/contexts/voice",
    ),
    "AVT": DomainMeta(
        "AVT",
        "avatar",
        "avatar",
        "AvatarService",
        "AVATAR FEATURE SPEC",
        owner_path="server/contexts/avatar",
    ),
    "INW": DomainMeta(
        "INW",
        "in_workspace",
        "in_service",
        "InWorkspaceService",
        "IN WORKSPACE FEATURE SPEC",
        owner_path="server/contexts/in_service",
    ),
}

SOURCE_PRIORITY = ["platform", "admin", "mobile", "landing"]
SOURCE_ORDER = {name: idx for idx, name in enumerate(SOURCE_PRIORITY)}


def parse_table_line(line: str) -> list[str]:
    cells = [cell.strip() for cell in line.strip().split("|")]
    return cells[1:-1]


def strip_code_ticks(value: str) -> str:
    return value.strip().strip("`")


def normalize_inline_code(value: str) -> str:
    return value.strip().strip("`")


def parse_feature_rows(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("| Feature Code |"):
            header = parse_table_line(lines[i])
            if header != EXPECTED_HEADER:
                i += 1
                continue
            i += 2
            while i < len(lines):
                row_line = lines[i].strip()
                if not row_line.startswith("|"):
                    break
                cells = parse_table_line(lines[i])
                if len(cells) != len(EXPECTED_HEADER):
                    break
                row = {EXPECTED_HEADER[idx]: cells[idx] for idx in range(len(EXPECTED_HEADER))}
                rows.append(row)
                i += 1
            continue
        i += 1
    return rows


def canonical_domain_for_code(code: str) -> str | None:
    canonical_match = CANONICAL_FEATURE_RE.match(code)
    if canonical_match:
        return canonical_match.group("domain")

    service_match = SERVICE_FEATURE_RE.match(code)
    if not service_match:
        return None

    service_domain = service_match.group("domain")
    return DOMAIN_ALIAS_MAP.get(service_domain, service_domain)


def feature_sort_key(row: dict[str, str]) -> tuple[int, int, int, str]:
    code = row["Feature Code"]
    service = row.get("_source_service", "")
    service_order = SOURCE_ORDER.get(service, len(SOURCE_ORDER))
    canonical_match = CANONICAL_FEATURE_RE.match(code)
    if canonical_match:
        return (0, int(canonical_match.group("seq")), service_order, code)

    service_match = SERVICE_FEATURE_RE.match(code)
    if service_match:
        return (1, service_order, int(service_match.group("seq")), code)

    return (2, service_order, 0, code)


def collect_rows() -> tuple[dict[str, dict[str, str]], dict[str, set[str]], dict[str, list[dict[str, str]]]]:
    canonical_rows: dict[str, dict[str, str]] = {}
    sources_by_code: dict[str, set[str]] = defaultdict(set)
    variants_by_code: dict[str, list[dict[str, str]]] = defaultdict(list)

    for source_path in SOURCE_FILES:
        service = source_path.stem.removesuffix("_feature_spec")
        for row in parse_feature_rows(source_path):
            code = strip_code_ticks(row["Feature Code"])
            canonical_domain_code = canonical_domain_for_code(code)
            if canonical_domain_code is None or canonical_domain_code not in DOMAIN_MAP:
                continue
            normalized_row = {key: value for key, value in row.items()}
            normalized_row["Feature Code"] = code
            normalized_row["_canonical_domain_code"] = canonical_domain_code
            normalized_row["_source_service"] = service
            normalized_row["_source_file"] = source_path.name
            sources_by_code[code].add(service)
            variants_by_code[code].append(normalized_row)
            current = canonical_rows.get(code)
            if current is None or SOURCE_ORDER[service] < SOURCE_ORDER[current["_source_service"]]:
                canonical_rows[code] = normalized_row
    return canonical_rows, sources_by_code, variants_by_code


def build_bounded_context_rows(rows: list[dict[str, str]], meta: DomainMeta) -> list[tuple[str, str]]:
    grouped: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        context_name = normalize_inline_code(row["Bounded Context"])
        aggregates = [normalize_inline_code(part.strip()) for part in row["Aggregate / Model"].split(",")]
        for aggregate in aggregates:
            if aggregate:
                grouped[context_name].add(aggregate)
    result: list[tuple[str, str]] = []
    for context_name in sorted(grouped):
        aggregates = ", ".join(sorted(grouped[context_name]))
        result.append((context_name, aggregates))
    return result


def render_domain_doc(meta: DomainMeta, rows: list[dict[str, str]], sources_by_code: dict[str, set[str]]) -> str:
    bounded_context_rows = build_bounded_context_rows(rows, meta)
    connected_services = sorted({service for row in rows for service in sources_by_code[row["Feature Code"]]})
    feature_codes = ", ".join(row["Feature Code"] for row in rows)
    lines: list[str] = [
        f"# {meta.title}",
        "",
        "- 작성 버전: `1.0.0`",
        f"- 대상 도메인: `{meta.slug}`",
        f"- 기능 코드: `{meta.code}`",
        "- 기준 산출물:",
        f"  - [README.md](/home/sh/Documents/Github/passv/sdd/01_planning/01_feature/README.md)",
        f"  - [{meta.primary_backend_path}](/home/sh/Documents/Github/passv/{meta.primary_backend_path})",
    ]
    for service in connected_services:
        source = SOURCE_FILES_BY_SERVICE[service]
        lines.append(f"  - [{source.name}](/home/sh/Documents/Github/passv/{source.relative_to(REPO_ROOT)})")
    lines.extend(
        [
            "",
            "## 1. Purpose",
            "",
            f"- `{meta.slug}` backend owner 기준으로 canonical domain feature spec을 제공한다.",
            f"- 기존 서비스별 feature row를 current implementation 기준 canonical backend owner로 collapse하고, service-local feature code는 원문 그대로 보존한다.",
            f"- 현재 backend 구현 owner는 `{meta.primary_backend_path}`이며 1차 owner service는 `{meta.owner}`다.",
            "",
            "## 2. Scope",
            "",
            "- 포함 범위:",
            f"  - {meta.slug} 도메인이 소유하는 query/command 유스케이스 전반",
            f"  - 현재 service feature spec에서 `{meta.slug}` backend owner로 매핑되는 기능 전체",
            "- 제외 범위:",
            "  - route, navigation, modal, tab, local interaction 같은 screen 동작",
            "  - transport 세부 응답 스키마와 request/response envelope 정의",
            "",
            "## 3. Canonical Domain Summary",
            "",
            f"- Primary Backend Module: `{meta.primary_backend_path}`",
            f"- Primary Owner Service: `{meta.owner}`",
            f"- Connected Services: `{', '.join(connected_services)}`",
            f"- Covered Feature Codes: `{feature_codes}`",
            "",
            "## 4. Bounded Context Map",
            "",
            "| Bounded Context | Primary Backend Owner | Module | Aggregate / Model |",
            "| --- | --- | --- | --- |",
        ]
    )
    for context_name, aggregates in bounded_context_rows:
        lines.append(f"| `{context_name}` | `{meta.owner}` | `{meta.module}` | {aggregates} |")
    lines.extend(
        [
            "",
            "## 5. Use Case Matrix",
            "",
            "| Feature Code | Use Case | Actor | Bounded Context | Aggregate / Model | Type | Preconditions | Domain Outcome | Invariant / Business Rule |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for row in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{row['Feature Code']}`",
                    row["Use Case"],
                    row["Actor"],
                    row["Bounded Context"],
                    row["Aggregate / Model"],
                    row["Type"],
                    row["Preconditions"],
                    row["Domain Outcome"],
                    row["Invariant / Business Rule"],
                ]
            )
            + " |"
        )
    lines.extend(
        [
            "",
            "## 6. Service Coverage",
            "",
            "| Feature Code | Services |",
            "| --- | --- |",
        ]
    )
    for row in rows:
        code = row["Feature Code"]
        lines.append(f"| `{code}` | `{', '.join(sorted(sources_by_code[code]))}` |")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    canonical_rows, sources_by_code, _variants_by_code = collect_rows()
    rows_by_domain: dict[str, list[dict[str, str]]] = defaultdict(list)
    for _code, row in canonical_rows.items():
        domain_code = row["_canonical_domain_code"]
        rows_by_domain[domain_code].append(row)

    for domain_code, rows in rows_by_domain.items():
        rows.sort(key=feature_sort_key)
        meta = DOMAIN_MAP[domain_code]
        output_path = FEATURE_ROOT / f"{meta.slug}_feature_spec.md"
        output_path.write_text(render_domain_doc(meta, rows, sources_by_code), encoding="utf-8")
        print(output_path.relative_to(REPO_ROOT))


if __name__ == "__main__":
    main()
