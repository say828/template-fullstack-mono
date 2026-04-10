#!/usr/bin/env python3
from __future__ import annotations

import argparse
import colorsys
import json
import re
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from spec_source_runtime import load_image, load_pdf_page


ROOT = Path(__file__).resolve().parents[3]
PLANNING_ROOT = ROOT / "sdd/01_planning/02_screen"
OUTPUT_ROOT = PLANNING_ROOT / "ir/mobile"
SOURCE_SPEC = PLANNING_ROOT / "mobile_screen_spec.pdf"
IN_TODOS = ROOT / "sdd/02_plan/02_screen/in_todos.md"
APP_TSX = ROOT / "client/mobile/src/app/App.tsx"
SCREEN_CONTRACTS = ROOT / "client/mobile/src/mobile-app/screenContracts.ts"
GUIDE_JSON = PLANNING_ROOT / "guidelines/mobile/mobile_screen_design_guide.json"
GUIDE_ASSET_DIR = PLANNING_ROOT / "guidelines/mobile/assets"
EXTRACTOR_VERSION = "0.2.1"

PUBLIC_ROUTES = {
    "/",
    "/language",
    "/onboarding",
    "/login",
    "/auth/phone",
    "/auth/verify",
    "/auth/terms",
    "/auth/signup",
    "/auth/complete",
    "/policy/terms",
}
PRIMARY_CHROME_ROUTES = {"/home", "/profile"}
NO_HEADER_ROUTES = {
    "/emergency",
    "/education/learning/:courseId/completed",
    "/jobs/filter/region",
    "/health/location-manual",
    "/counseling",
    "/counseling/answer",
    "/counseling/voice",
    "/counseling/options",
    "/profile/counseling-history/rename",
    "/settings/notifications/time",
    "/settings/contacts/new",
    "/support/inquiry/type",
}
NO_BOTTOM_NAV_ROUTES = NO_HEADER_ROUTES
ROUTE_HEADER_KIND_OVERRIDES = {
    "/policy/terms": "mobile-secondary-header",
}
ROUTE_BOTTOM_NAV_KIND_OVERRIDES = {
    "/counseling": "hidden",
    "/counseling/answer": "hidden",
    "/counseling/voice": "hidden",
    "/education/learning/:courseId/completed": "hidden",
    "/jobs/result": "hidden_with_local_bottom_dock",
    "/policy/terms": "hidden",
    "/profile/diagnosis-history": "mobile-primary-bottom-nav",
}
SURFACE_OVERRIDES: dict[str, list[str]] = {
    "APP_000": ["page-002-surface-01"],
    "APP_001": ["page-002-surface-03"],
    "APP_002": ["page-003-surface-01", "page-003-surface-02", "page-003-surface-03"],
    "APP_013": ["page-014-surface-01", "page-014-surface-02", "page-014-surface-03"],
}

SHARED_GUIDELINE_REFS = [
    "sdd/01_planning/02_screen/guidelines/README.md",
    "sdd/01_planning/02_screen/guidelines/README.md",
    "sdd/01_planning/02_screen/guidelines/mobile/mobile_screen_design_guide.json",
    "sdd/02_plan/02_screen/in/mobile_chrome_guideline.md",
]
SHARED_ASSET_REFS: list[str] = []
PRIMARY_CHROME_ASSET_REFS = [
    "client/mobile/src/assets/passview-wordmark.svg",
    "client/mobile/src/assets/home-notification.png",
    "client/mobile/src/assets/home-emergency.png",
    "client/mobile/src/assets/home-hero-orb.png",
    "client/mobile/src/assets/primary-nav-home-active.png",
    "client/mobile/src/assets/primary-nav-home-inactive.png",
    "client/mobile/src/assets/primary-nav-counsel.png",
    "client/mobile/src/assets/primary-nav-profile-active.png",
    "client/mobile/src/assets/primary-nav-profile-inactive.png",
]

SCREEN_OVERRIDES: dict[str, dict[str, Any]] = {
    "APP_009": {
        "primary_user_goal": "홈 허브에서 필요한 도움 경로를 빠르게 선택하고 바로 상담, 알림, 긴급 경로로 진입한다.",
        "ui_blocks": [
            {
                "id": "primary-header",
                "kind": "chrome",
                "summary": "PASSVIEW wordmark, unread notification action, emergency action을 sticky primary header로 제공한다.",
            },
            {
                "id": "hero-search",
                "kind": "hero",
                "summary": "greeting, hero title/description, shared SpeechInputField 기반 검색 box를 radial hero surface 안에 배치한다.",
            },
            {
                "id": "service-grid",
                "kind": "navigation-grid",
                "summary": "행정/일자리/교육/권익 보호/건강·응급/통역 6개 service card를 2열 grid로 노출한다.",
            },
            {
                "id": "recommendation-pager",
                "kind": "carousel",
                "summary": "추천 서비스 card 2개를 horizontal pager로 노출한다.",
            },
            {
                "id": "primary-bottom-navigation",
                "kind": "chrome",
                "summary": "홈/AI 상담/프로필 3-way fixed bottom navigation을 viewport bottom flush baseline으로 유지한다.",
            },
        ],
        "interactions": [
            {
                "id": "search-submit",
                "type": "navigate-with-state",
                "source": "hero-search",
                "target_route": "/counseling",
                "state": {
                    "aiCategory": "counsel",
                    "draft": "<trimmed search input or omitted>",
                    "origin": "/home",
                },
            },
            {
                "id": "notification-entry",
                "type": "navigate",
                "target_route": "/notifications",
                "label": "알림",
            },
            {
                "id": "emergency-entry",
                "type": "route-backed-overlay-entry",
                "target_route": "/emergency",
                "background_route": "/home",
            },
            {
                "id": "service-card-navigation",
                "type": "navigate",
                "targets": [
                    "/administration",
                    "/jobs",
                    "/education",
                    "/rights",
                    "/health",
                    "/health/interpretation",
                ],
            },
            {
                "id": "recommendation-navigation",
                "type": "navigate",
                "targets": [
                    "/jobs/diagnosis",
                    "/education/diagnosis",
                ],
            },
            {
                "id": "bottom-navigation",
                "type": "navigate",
                "targets": [
                    "/home",
                    "/counseling",
                    "/profile",
                ],
            },
        ],
        "data_dependencies": [
            {
                "kind": "auth-session",
                "source": "client/mobile/src/auth/AuthProvider.tsx",
                "consumer": "client/mobile/src/mobile-app/HomeScreen.tsx",
                "fields": ["token", "user.nickname"],
            },
            {
                "kind": "runtime-session",
                "source": "client/mobile/src/mobile-auth/InRuntimeProvider.tsx",
                "consumer": "client/mobile/src/mobile-app/HomeScreen.tsx",
                "fields": ["currentUser.fullName"],
            },
            {
                "kind": "feed",
                "source": "client/mobile/src/mobile-app/useNotificationsFeed.ts",
                "consumer": "client/mobile/src/mobile-app/MobilePrimaryChrome.tsx",
                "fields": ["unreadCount"],
            },
        ],
        "validation_rules": [
            {
                "id": "search-empty-submit",
                "rule": "trimmed draft가 비어 있어도 /counseling 이동은 허용하고 draft state는 생략한다.",
            },
            {
                "id": "speech-input-shared-contract",
                "rule": "검색 box는 shared SpeechInputField를 사용하고 mic affordance는 browser support 상태를 그대로 반영한다.",
            },
            {
                "id": "bottom-nav-safe-area",
                "rule": "bottom navigation은 viewport edge flush이며 safe-area는 nav 내부 padding으로만 처리한다.",
            },
        ],
        "states": [
            {
                "id": "display-name-fallback",
                "description": "user.nickname이 없으면 runtime currentUser.fullName, 둘 다 없으면 홍길동 fallback을 사용한다.",
            },
            {
                "id": "unread-badge",
                "description": "unreadCount > 0일 때만 notification badge를 노출하고 최대 99로 clamp 한다.",
            },
        ],
        "runtime_tree": [
            "client/mobile/src/main.tsx -> <AuthProvider> -> <InRuntimeProvider> -> <App />",
            "client/mobile/src/app/App.tsx -> <ProtectedRoute /> -> path=\"/home\" -> <HomeScreen />",
            "client/mobile/src/mobile-app/MobileAppShell.tsx",
            "client/mobile/src/mobile-app/MobilePrimaryChrome.tsx -> MobilePrimaryHeader / MobilePrimaryBottomNavigation",
            "client/mobile/src/components/common/SpeechInputField.tsx",
            "client/mobile/src/components/common/HorizontalPager.tsx",
        ],
        "shared_components": [
            "client/mobile/src/mobile-app/MobileAppShell.tsx",
            "client/mobile/src/mobile-app/MobilePrimaryChrome.tsx",
            "client/mobile/src/components/common/SpeechInputField.tsx",
            "client/mobile/src/components/common/HorizontalPager.tsx",
            "client/mobile/src/components/surface/SurfaceLayouts.tsx",
        ],
    }
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build mobile screen IR packages from the mobile screen spec inputs.")
    parser.add_argument("--screen", action="append", dest="screens", help="Spec source code such as APP_010. Repeatable.")
    parser.add_argument("--runtime-screen", action="append", dest="runtime_screens", help="Legacy runtime source code such as APP_009. Repeatable.")
    return parser.parse_args()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def runtime_to_spec_code(source_code: str) -> str:
    return source_code


def spec_to_runtime_code(source_code: str) -> str:
    return source_code


def infer_page_number(source_code: str) -> int:
    return int(source_code.split("_")[1]) + 1


def normalize_requested_runtime_screens(
    spec_codes: list[str] | None,
    runtime_codes: list[str] | None,
    todo_entries: dict[str, dict[str, Any]],
) -> list[str]:
    if runtime_codes:
        missing = [code for code in runtime_codes if code not in todo_entries]
        if missing:
            raise SystemExit(f"Unknown runtime source code(s): {', '.join(missing)}")
        return runtime_codes
    if not spec_codes:
        return [code for code in sorted(todo_entries.keys()) if code != "APP_000"]

    normalized: list[str] = []
    for spec_code in spec_codes:
        runtime_code = spec_to_runtime_code(spec_code)
        if runtime_code not in todo_entries:
            raise SystemExit(f"Unknown spec source code(s): {', '.join(spec_codes)}")
        normalized.append(runtime_code)
    return normalized


def parse_todo_sections() -> dict[str, dict[str, Any]]:
    lines = IN_TODOS.read_text(encoding="utf-8").splitlines()
    entries: dict[str, dict[str, Any]] = {}
    current: dict[str, Any] | None = None
    checklist_mode = False

    for line in lines:
        heading_match = re.match(r"^### (MOB-S\d{3}) (.+)$", line)
        if heading_match:
            if current and current.get("source_code"):
                entries[current["source_code"]] = current
            current = {
                "screen_code": heading_match.group(1),
                "screen_name": heading_match.group(2).strip(),
                "checklist": [],
            }
            checklist_mode = False
            continue

        if current is None:
            continue

        if line.startswith("- source key: `"):
            current["source_code"] = line.split("`")[1]
            checklist_mode = False
            continue
        if line.startswith("- route: `"):
            current["route"] = line.split("`")[1]
            checklist_mode = False
            continue
        if line.startswith("- function: "):
            current["function"] = line.removeprefix("- function: ").strip()
            checklist_mode = False
            continue
        if line.startswith("- checklist:"):
            checklist_mode = True
            continue
        if checklist_mode:
            checklist_match = re.match(r"^  - \[([ x-])\] (.+)$", line)
            if checklist_match:
                marker = checklist_match.group(1)
                current["checklist"].append(
                    {
                        "status": {"x": "done", " ": "pending", "-": "in_progress"}[marker],
                        "raw_status": marker,
                        "text": checklist_match.group(2).strip(),
                    }
                )
                continue
            if line.startswith("- ") or line.startswith("### "):
                checklist_mode = False

    if current and current.get("source_code"):
        entries[current["source_code"]] = current
    return entries


def parse_routes() -> dict[str, dict[str, Any]]:
    text = APP_TSX.read_text(encoding="utf-8")
    routes: dict[str, dict[str, Any]] = {}
    for match in re.finditer(r'<Route path="([^"]+)" element={<([^}]+)\s*/>} />', text):
        path, component = match.groups()
        routes[path] = {
            "path": path,
            "component": component.strip(),
            "kind": "explicit-custom",
            "source": repo_path(APP_TSX),
        }
    return routes


def extract_string(block: str, key: str) -> str | None:
    match = re.search(rf'{re.escape(key)}: "([^"]*)"', block)
    return match.group(1) if match else None


def extract_action(block: str, key: str) -> dict[str, str] | None:
    match = re.search(
        rf"{re.escape(key)}: \{{\s*label: \"([^\"]+)\"(?:,\s*to: \"([^\"]+)\")?(?:,\s*href: \"([^\"]+)\")?",
        block,
        flags=re.S,
    )
    if not match:
        return None
    result = {"label": match.group(1)}
    if match.group(2):
        result["to"] = match.group(2)
    if match.group(3):
        result["href"] = match.group(3)
    return result


def parse_screen_contracts() -> dict[str, dict[str, Any]]:
    text = SCREEN_CONTRACTS.read_text(encoding="utf-8")
    contracts: dict[str, dict[str, Any]] = {}
    blocks = re.findall(r"contract\(\{\n(.*?)\n  \}\),", text, flags=re.S)
    for block in blocks:
        screen_code_match = re.search(r'screenCode: "([^"]+)"', block)
        source_code_match = re.search(r'sourceCode: "([^"]+)"', block)
        path_match = re.search(r'path: "([^"]+)"', block)
        if not screen_code_match or not source_code_match or not path_match:
            continue
        tags_match = re.search(r"tags: \[([^\]]*)\]", block)
        tags = re.findall(r'"([^"]+)"', tags_match.group(1)) if tags_match else []
        source_code = source_code_match.group(1)
        contracts[source_code] = {
            "screen_code": screen_code_match.group(1),
            "source_code": source_code,
            "title": extract_string(block, "title"),
            "path": path_match.group(1),
            "domain": extract_string(block, "domain"),
            "presentation": extract_string(block, "presentation"),
            "description": extract_string(block, "description"),
            "heroTitle": extract_string(block, "heroTitle"),
            "heroDescription": extract_string(block, "heroDescription"),
            "tab": extract_string(block, "tab"),
            "tags": tags,
            "primaryAction": extract_action(block, "primaryAction"),
            "secondaryAction": extract_action(block, "secondaryAction"),
        }
    return contracts


def load_surfaces(source_code: str) -> list[dict[str, Any]]:
    guide = read_json(GUIDE_JSON)
    surfaces = guide.get("surfaces", [])
    override_ids = SURFACE_OVERRIDES.get(source_code)
    if override_ids:
        matched = [surface for surface in surfaces if surface["surface_id"] in override_ids]
        if len(matched) != len(override_ids):
            raise SystemExit(f"Surface override mismatch for {source_code}: expected {override_ids}")
        matched.sort(key=lambda surface: override_ids.index(surface["surface_id"]))
        return matched

    page_number = infer_page_number(source_code)
    matching = [surface for surface in surfaces if surface.get("page_number") == page_number]
    if not matching:
        raise SystemExit(f"No guide surface found for {source_code} on page {page_number}")
    return [
        max(
            matching,
            key=lambda item: (item["bbox"]["right"] - item["bbox"]["left"]) * (item["bbox"]["bottom"] - item["bbox"]["top"]),
        )
    ]


def load_guide_dpi() -> int:
    guide = read_json(GUIDE_JSON)
    return int(guide.get("dpi", 110))


def crop_surface(surface: dict[str, Any]) -> Image.Image:
    preview_path = surface.get("preview_path")
    if preview_path:
        preview = Path(str(preview_path))
        if preview.exists():
            return load_image(preview)
    page_image = load_pdf_page(SOURCE_SPEC, int(surface["page_number"]), load_guide_dpi())
    bbox = surface["bbox"]
    return page_image.crop((bbox["left"], bbox["top"], bbox["right"], bbox["bottom"]))


def detect_mask_regions(image: Image.Image) -> list[dict[str, Any]]:
    mask = [[0] * image.width for _ in range(image.height)]
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = image.getpixel((x, y))
            if alpha < 32:
                continue
            hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
            if 0.83 <= hue <= 0.98 and saturation >= 0.45 and value >= 0.45 and red - green >= 40 and blue - green >= 20:
                mask[y][x] = 1

    components = find_components(mask)
    candidates: list[tuple[int, int, int, int, int]] = []
    for area, left, top, right, bottom in components:
        width = right - left + 1
        height = bottom - top + 1
        fill_ratio = area / max(1, width * height)
        if height < 40 or height > 110 or width < 18 or width > 90 or fill_ratio < 0.32:
            continue
        candidates.append((left, top, right, bottom, area))

    merged = merge_boxes([(left, top, right, bottom) for left, top, right, bottom, _ in candidates])
    regions: list[dict[str, Any]] = []
    for left, top, right, bottom in merged:
        regions.append(
            {
                "bbox": {
                    "left": left,
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "width": right - left + 1,
                    "height": bottom - top + 1,
                },
                "mask_reason": "magenta annotation badge",
                "source_detector": "high-saturation-magenta-component",
            }
        )
    return regions


def find_components(mask: list[list[int]]) -> list[tuple[int, int, int, int, int]]:
    if not mask or not mask[0]:
        return []

    height = len(mask)
    width = len(mask[0])
    seen = [[False] * width for _ in range(height)]
    components: list[tuple[int, int, int, int, int]] = []

    for y in range(height):
        for x in range(width):
            if not mask[y][x] or seen[y][x]:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen[y][x] = True
            area = 0
            min_x = max_x = x
            min_y = max_y = y

            while queue:
                current_x, current_y = queue.popleft()
                area += 1
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)
                for next_x in range(max(0, current_x - 1), min(width, current_x + 2)):
                    for next_y in range(max(0, current_y - 1), min(height, current_y + 2)):
                        if seen[next_y][next_x] or not mask[next_y][next_x]:
                            continue
                        seen[next_y][next_x] = True
                        queue.append((next_x, next_y))

            components.append((area, min_x, min_y, max_x, max_y))

    return components


def merge_boxes(boxes: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    pending = boxes[:]
    merged = True
    while merged:
        merged = False
        next_pending: list[tuple[int, int, int, int]] = []
        while pending:
            current = pending.pop(0)
            current_left, current_top, current_right, current_bottom = current
            index = 0
            while index < len(pending):
                other_left, other_top, other_right, other_bottom = pending[index]
                if current_right + 10 < other_left or other_right + 10 < current_left:
                    index += 1
                    continue
                if current_bottom + 12 < other_top or other_bottom + 12 < current_top:
                    index += 1
                    continue
                current = (
                    min(current_left, other_left),
                    min(current_top, other_top),
                    max(current_right, other_right),
                    max(current_bottom, other_bottom),
                )
                current_left, current_top, current_right, current_bottom = current
                pending.pop(index)
                merged = True
            next_pending.append(current)
        pending = next_pending
    return sorted(pending, key=lambda item: (item[1], item[0]))


def build_masked_image(image: Image.Image, regions: list[dict[str, Any]]) -> Image.Image:
    masked = image.copy()
    draw = ImageDraw.Draw(masked)
    for region in regions:
        bbox = region["bbox"]
        fill = sample_border_color(masked, bbox)
        draw.rectangle([(bbox["left"], bbox["top"]), (bbox["right"], bbox["bottom"])], fill=fill)
    return masked


def sample_border_color(image: Image.Image, bbox: dict[str, int]) -> tuple[int, int, int, int]:
    left = bbox["left"]
    top = bbox["top"]
    right = bbox["right"]
    bottom = bbox["bottom"]
    samples: list[tuple[int, int, int, int]] = []
    radius = 6
    sample_left = max(0, left - radius)
    sample_top = max(0, top - radius)
    sample_right = min(image.width - 1, right + radius)
    sample_bottom = min(image.height - 1, bottom + radius)
    for y in range(sample_top, sample_bottom + 1):
        for x in range(sample_left, sample_right + 1):
            if left <= x <= right and top <= y <= bottom:
                continue
            samples.append(image.getpixel((x, y)))
    if not samples:
        return (255, 255, 255, 255)
    return (
        round(sum(pixel[0] for pixel in samples) / len(samples)),
        round(sum(pixel[1] for pixel in samples) / len(samples)),
        round(sum(pixel[2] for pixel in samples) / len(samples)),
        round(sum(pixel[3] for pixel in samples) / len(samples)),
    )


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_requirements_md(requirements: dict[str, Any]) -> str:
    lines = [
        f"# {requirements['source_code']} {requirements['screen_name']}",
        "",
        "## User Goal",
        "",
        f"- {requirements['primary_user_goal']}",
        "",
        "## UI Blocks",
        "",
    ]
    for block in requirements["ui_blocks"]:
        lines.append(f"- `{block['id']}`: {block['summary']}")
    lines.extend(["", "## Interactions", ""])
    for interaction in requirements["interactions"]:
        if "target_route" in interaction:
            lines.append(f"- `{interaction['id']}` -> `{interaction['target_route']}`")
        elif "target_href" in interaction:
            lines.append(f"- `{interaction['id']}` -> `{interaction['target_href']}`")
        elif "targets" in interaction:
            lines.append(f"- `{interaction['id']}` -> {', '.join(interaction['targets'])}")
        else:
            lines.append(f"- `{interaction['id']}`")
    lines.extend(["", "## States", ""])
    for state in requirements["states"]:
        lines.append(f"- `{state['id']}`: {state['description']}")
    lines.extend(["", "## Validation Rules", ""])
    for rule in requirements["validation_rules"]:
        lines.append(f"- `{rule['id']}`: {rule['rule']}")
    lines.extend(["", "## Checklist Trace", ""])
    for item in requirements["checklist_trace"]:
        lines.append(f"- `{item['status']}` {item['text']}")
    return "\n".join(lines) + "\n"


def ensure_readme() -> None:
    (OUTPUT_ROOT / "README.md").write_text(
        "\n".join(
            [
                "# Mobile Screen IR",
                "",
                "- scope: `sdd/01_planning/02_screen/ir/mobile/`는 mobile screen spec을 per-screen IR package로 분리한 current-state output이다.",
                "- canonical builder: `python3 sdd/99_toolchain/01_automation/build_mobile_screen_ir.py`",
                "- canonical validator: `python3 sdd/99_toolchain/01_automation/validate_mobile_screen_ir.py`",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


def infer_access(route: str) -> str:
    return "public" if route in PUBLIC_ROUTES else "protected"


def infer_shell_kind(route: str, access: str, runtime_component: str) -> str:
    if route in PRIMARY_CHROME_ROUTES:
        return "mobile-app-shell-primary"
    if runtime_component == "GenericScreenPage":
        return "mobile-app-shell-generic"
    if route == "/emergency":
        return "mobile-emergency-overlay-shell"
    if access == "public":
        return "mobile-auth-shell"
    return "mobile-app-shell-secondary"


def infer_header_kind(route: str, access: str, runtime_component: str) -> str:
    if route in ROUTE_HEADER_KIND_OVERRIDES:
        return ROUTE_HEADER_KIND_OVERRIDES[route]
    if route in NO_HEADER_ROUTES:
        return "none"
    if route in PRIMARY_CHROME_ROUTES:
        return "mobile-primary-header"
    if runtime_component == "GenericScreenPage":
        return "mobile-shell-default-topbar"
    if route == "/emergency":
        return "mobile-emergency-header"
    if access == "public":
        return "mobile-auth-header"
    return "mobile-secondary-header"


def infer_bottom_nav_kind(route: str, access: str, runtime_component: str) -> str:
    if route in ROUTE_BOTTOM_NAV_KIND_OVERRIDES:
        return ROUTE_BOTTOM_NAV_KIND_OVERRIDES[route]
    if route in NO_BOTTOM_NAV_ROUTES:
        return "none"
    if route in PRIMARY_CHROME_ROUTES:
        return "mobile-primary-bottom-nav"
    if runtime_component == "GenericScreenPage":
        return "shell-default-bottom-navigation"
    if access == "public":
        return "none"
    return "hidden"


def default_guideline_refs() -> list[str]:
    return SHARED_GUIDELINE_REFS[:]


def default_asset_refs(route: str) -> list[str]:
    refs = SHARED_ASSET_REFS[:]
    if route in PRIMARY_CHROME_ROUTES:
        refs.extend(PRIMARY_CHROME_ASSET_REFS)
    return refs


def resolve_route(todo: dict[str, Any], contract: dict[str, Any] | None, routes: dict[str, dict[str, Any]]) -> dict[str, Any]:
    explicit = routes.get(todo["route"])
    if explicit:
        return explicit
    if contract and contract["path"] == todo["route"]:
        return {
            "path": todo["route"],
            "component": "GenericScreenPage",
            "kind": "generic-contract",
            "source": repo_path(APP_TSX),
        }
    raise SystemExit(f"No route mapping found for {todo['source_code']} {todo['route']}")


def default_primary_user_goal(todo: dict[str, Any], contract: dict[str, Any] | None) -> str:
    if contract and contract.get("description"):
        return contract["description"]
    return todo["function"]


def default_ui_blocks(
    source_code: str,
    todo: dict[str, Any],
    contract: dict[str, Any] | None,
    header_kind: str,
    bottom_nav_kind: str,
) -> list[dict[str, str]]:
    blocks = [
        {
            "id": "screen-header",
            "kind": "chrome",
            "summary": f"{header_kind} 계약으로 상단 헤더와 route title/back affordance를 렌더링한다.",
        }
    ]
    if contract and (contract.get("heroTitle") or contract.get("heroDescription")):
        blocks.append(
            {
                "id": "hero-copy",
                "kind": "hero",
                "summary": f"{contract.get('heroTitle') or todo['screen_name']}와 보조 설명을 surface 상단 정보 블록으로 제공한다.",
            }
        )
    blocks.append(
        {
            "id": "screen-body",
            "kind": "content",
            "summary": todo["function"],
        }
    )
    if contract and (contract.get("primaryAction") or contract.get("secondaryAction")):
        blocks.append(
            {
                "id": "screen-actions",
                "kind": "actions",
                "summary": "화면 하단 또는 본문 CTA를 통해 다음 단계 route 또는 관련 상세 화면으로 이동한다.",
            }
        )
    if bottom_nav_kind == "mobile-primary-bottom-nav":
        blocks.append(
            {
                "id": "primary-bottom-navigation",
                "kind": "chrome",
                "summary": "primary bottom navigation을 통해 홈, AI 상담, 프로필을 고정 진입점으로 제공한다.",
            }
        )
    return blocks


def default_interactions(contract: dict[str, Any] | None) -> list[dict[str, Any]]:
    interactions: list[dict[str, Any]] = []
    if not contract:
        return interactions
    for key in ("primaryAction", "secondaryAction"):
        action = contract.get(key)
        if not action:
            continue
        if action.get("to"):
            interactions.append(
                {
                    "id": key.lower(),
                    "type": "navigate",
                    "target_route": action["to"],
                    "label": action["label"],
                }
            )
        elif action.get("href"):
            interactions.append(
                {
                    "id": key.lower(),
                    "type": "external-link",
                    "target_href": action["href"],
                    "label": action["label"],
                }
            )
    return interactions


def default_validation_rules(header_kind: str, bottom_nav_kind: str, route: str) -> list[dict[str, str]]:
    rules = [
        {
            "id": "route-contract",
            "rule": f"screen route는 `{route}` canonical path와 일치해야 한다.",
        }
    ]
    if header_kind == "mobile-secondary-header":
        rules.append(
            {
                "id": "secondary-header-consistency",
                "rule": "뒤로가기 버튼, 제목 정렬, sticky top header는 MobileSecondaryHeader 계약을 우선 사용한다.",
            }
        )
    if bottom_nav_kind == "mobile-primary-bottom-nav":
        rules.append(
            {
                "id": "primary-bottom-navigation",
                "rule": "safe-area padding은 bottom navigation 내부에서만 처리하고 body가 별도 outer bottom dock를 중복 적용하지 않는다.",
            }
        )
    return rules


def default_states(access: str, route: str) -> list[dict[str, str]]:
    states = [
        {
            "id": "route-entry",
            "description": f"`{route}` current route에서 진입하고 동일한 source/order contract를 유지한다.",
        }
    ]
    if access == "protected":
        states.append(
            {
                "id": "protected-session",
                "description": "ProtectedRoute 기준 인증 세션이 있어야 진입할 수 있다.",
            }
        )
    return states


def default_entry_conditions(access: str) -> list[str]:
    if access == "protected":
        return ["ProtectedRoute를 통과한 세션에서만 진입이 허용된다."]
    return ["public route에서 인증 전 진입이 허용된다."]


def default_runtime_tree(route: dict[str, Any], access: str, header_kind: str) -> list[str]:
    tree = ["client/mobile/src/main.tsx -> <AuthProvider> -> <InRuntimeProvider> -> <App />"]
    if access == "protected":
        tree.append(f'client/mobile/src/app/App.tsx -> <ProtectedRoute /> -> path="{route["path"]}" -> <{route["component"]} />')
    else:
        tree.append(f'client/mobile/src/app/App.tsx -> path="{route["path"]}" -> <{route["component"]} />')
    tree.append("client/mobile/src/mobile-app/MobileAppShell.tsx")
    if header_kind == "mobile-primary-header":
        tree.append("client/mobile/src/mobile-app/MobilePrimaryChrome.tsx -> MobilePrimaryHeader / MobilePrimaryBottomNavigation")
    elif header_kind == "mobile-secondary-header":
        tree.append("client/mobile/src/mobile-app/MobileSecondaryHeader.tsx")
    return tree


def default_shared_components(header_kind: str, route: dict[str, Any]) -> list[str]:
    components = [
        "client/mobile/src/mobile-app/MobileAppShell.tsx",
        "client/mobile/src/components/surface/SurfaceLayouts.tsx",
    ]
    if header_kind == "mobile-primary-header":
        components.append("client/mobile/src/mobile-app/MobilePrimaryChrome.tsx")
    if header_kind == "mobile-secondary-header":
        components.append("client/mobile/src/mobile-app/MobileSecondaryHeader.tsx")
    if route["component"] == "GenericScreenPage":
        components.append("client/mobile/src/mobile-app/GenericScreenPage.tsx")
    return components


def build_screen_package(
    runtime_source_code: str,
    todo_entries: dict[str, dict[str, Any]],
    routes: dict[str, dict[str, Any]],
    contracts: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    spec_source_code = runtime_to_spec_code(runtime_source_code)
    todo = todo_entries[runtime_source_code]
    contract = contracts.get(runtime_source_code)
    access = infer_access(todo["route"])
    route = resolve_route(todo, contract, routes)
    shared_shell_kind = infer_shell_kind(todo["route"], access, route["component"])
    header_kind = infer_header_kind(todo["route"], access, route["component"])
    bottom_nav_kind = infer_bottom_nav_kind(todo["route"], access, route["component"])
    override = SCREEN_OVERRIDES.get(runtime_source_code, {})

    package_root = OUTPUT_ROOT / "screens" / spec_source_code
    surface_root = package_root / "surfaces"
    surface_root.mkdir(parents=True, exist_ok=True)
    surfaces = load_surfaces(spec_source_code)
    page_number = int(surfaces[0]["page_number"])
    expected_surface_ids = {surface["surface_id"] for surface in surfaces}
    for existing in surface_root.iterdir():
        if not existing.is_file():
            continue
        if not any(existing.name.startswith(f"{surface_id}.") for surface_id in expected_surface_ids):
            existing.unlink()
    surface_ids: list[str] = []
    crop_boxes: list[dict[str, Any]] = []
    preview_seed_paths: list[dict[str, Any]] = []
    mask_region_count = 0

    for surface in surfaces:
        surface_id = surface["surface_id"]
        surface_ids.append(surface_id)
        raw_image = crop_surface(surface)
        raw_image.save(surface_root / f"{surface_id}.raw.png")

        mask_regions = detect_mask_regions(raw_image)
        mask_region_count += len(mask_regions)
        build_masked_image(raw_image, mask_regions).save(surface_root / f"{surface_id}.masked.png")
        write_json(
            surface_root / f"{surface_id}.mask.json",
            {
                "surface_id": surface_id,
                "mask_regions": mask_regions,
                "mask_reason": "screen spec annotation cleanup",
                "source_detector": "high-saturation-magenta-component",
                "manual_override": False,
            },
        )

        preview_path = GUIDE_ASSET_DIR / f"{surface_id}.png"
        write_json(
            surface_root / f"{surface_id}.geometry.json",
            {
                "viewport_box": {
                    "left": 0,
                    "top": 0,
                    "right": raw_image.width,
                    "bottom": raw_image.height,
                    "width": raw_image.width,
                    "height": raw_image.height,
                },
                "surface_box": surface["bbox"],
                "content_box": surface["metrics"]["content_bbox"],
                "header_box": {
                    "left": 0,
                    "top": 0,
                    "right": raw_image.width,
                    "bottom": 124,
                    "approximation": f"runtime contract estimate from {header_kind}",
                },
                "footer_box": {
                    "left": 0,
                    "top": max(0, raw_image.height - 122),
                    "right": raw_image.width,
                    "bottom": raw_image.height,
                    "approximation": f"runtime contract estimate from {bottom_nav_kind}",
                },
                "safe_area_estimate": {
                    "top": "env(safe-area-inset-top,0px)",
                    "bottom": "env(safe-area-inset-bottom,0px)",
                },
                "layout_contract": surface["layout_contract"],
                "preview_seed": repo_path(preview_path) if preview_path.exists() else None,
            },
        )
        crop_boxes.append({"surface_id": surface_id, "bbox": surface["bbox"]})
        preview_seed_paths.append(
            {
                "surface_id": surface_id,
                "path": repo_path(preview_path) if preview_path.exists() else None,
                "size_match": bool(preview_path.exists() and Image.open(preview_path).size == raw_image.size),
            }
        )

    metadata = {
        "service": "mobile",
        "source_code": spec_source_code,
        "runtime_source_code": runtime_source_code,
        "screen_code": todo["screen_code"],
        "screen_name": todo["screen_name"],
        "page_number": page_number,
        "surface_ids": surface_ids,
        "primary_route": todo["route"],
        "route_aliases": [],
        "access": access,
        "overlay_capable": todo["route"] in {"/emergency", "/health/location-manual", "/jobs/filter/region", "/profile/counseling-history/rename", "/settings/contacts/new", "/support/inquiry/type", "/settings/notifications/time"},
        "background_route": "/home" if todo["route"] == "/emergency" else None,
        "runtime_entry": {
            "route_path": route["path"],
            "component": route["component"],
            "route_kind": route["kind"],
            "source": route["source"],
        },
        "presentation_kind": contract["presentation"] if contract else ("auth" if access == "public" else "generic"),
        "shared_shell_kind": shared_shell_kind,
        "header_kind": header_kind,
        "bottom_nav_kind": bottom_nav_kind,
        "feature_codes": [],
        "domain": contract["domain"] if contract else ("auth" if access == "public" else "misc"),
        "description": contract["description"] if contract else todo["function"],
        "hero_title": contract["heroTitle"] if contract else todo["screen_name"],
        "hero_description": contract["heroDescription"] if contract else todo["function"],
        "tags": contract["tags"] if contract else [],
        "tab": contract["tab"] if contract else None,
        "guideline_refs": default_guideline_refs(),
        "asset_refs": default_asset_refs(todo["route"]),
    }
    write_json(package_root / "metadata.json", metadata)

    requirements = {
        "service": "mobile",
        "source_code": spec_source_code,
        "runtime_source_code": runtime_source_code,
        "screen_code": todo["screen_code"],
        "screen_name": todo["screen_name"],
        "primary_user_goal": override.get("primary_user_goal", default_primary_user_goal(todo, contract)),
        "ui_blocks": override.get("ui_blocks", default_ui_blocks(runtime_source_code, todo, contract, header_kind, bottom_nav_kind)),
        "interactions": override.get("interactions", default_interactions(contract)),
        "data_dependencies": override.get("data_dependencies", []),
        "validation_rules": override.get("validation_rules", default_validation_rules(header_kind, bottom_nav_kind, todo["route"])),
        "entry_conditions": override.get("entry_conditions", default_entry_conditions(access)),
        "exit_transitions": override.get("exit_transitions", []),
        "states": override.get("states", default_states(access, todo["route"])),
        "exceptions": override.get("exceptions", []),
        "checklist_trace": todo["checklist"],
    }
    write_json(package_root / "requirements.json", requirements)
    (package_root / "requirements.md").write_text(build_requirements_md(requirements), encoding="utf-8")

    provenance = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "extractor_version": EXTRACTOR_VERSION,
        "source_spec_path": repo_path(SOURCE_SPEC),
        "page_number": page_number,
        "source_code": spec_source_code,
        "runtime_source_code": runtime_source_code,
        "crop_boxes": crop_boxes,
        "mask_strategy": {
            "detector": "high-saturation-magenta-component",
            "fill_strategy": "border-average-rgba",
            "mask_region_count": mask_region_count,
        },
        "preview_seed": preview_seed_paths,
        "manual_override": bool(override),
        "source_inputs": [
            repo_path(IN_TODOS),
            repo_path(APP_TSX),
            repo_path(SCREEN_CONTRACTS),
            repo_path(GUIDE_JSON),
        ],
    }
    write_json(package_root / "provenance.json", provenance)

    links = {
        "common_guideline_refs": SHARED_GUIDELINE_REFS[:2],
        "service_guideline_refs": SHARED_GUIDELINE_REFS[2:],
        "common_asset_refs": SHARED_ASSET_REFS[:2],
        "service_asset_refs": default_asset_refs(todo["route"])[2:],
        "screen_contract_ref": (
            {
                "path": repo_path(SCREEN_CONTRACTS),
                "screen_code": contract["screen_code"],
                "source_code": spec_source_code,
                "runtime_source_code": runtime_source_code,
            }
            if contract
            else None
        ),
        "route_component": {
            "path": repo_path(APP_TSX),
            "route": route["path"],
            "component": route["component"],
            "access": access,
            "route_kind": route["kind"],
        },
        "runtime_tree": override.get("runtime_tree", default_runtime_tree(route, access, header_kind)),
        "shared_components": override.get("shared_components", default_shared_components(header_kind, route)),
        "related_sdd_plan": ["sdd/02_plan/02_screen/in_todos.md"],
        "related_sdd_verify": ["sdd/03_verify/02_screen/in_verifies.md"],
        "exactness_harness": [
            {
                "kind": "source-audit",
                "script": "scripts/dev/audit_mobile_visual_fidelity.mjs",
                "result_json": "sdd/99_toolchain/02_exactness/results/mobile-visual-fidelity-audit.json",
            },
            {
                "kind": "source-audit",
                "script": "scripts/dev/audit_mobile_ui_contracts.mjs",
                "result_json": "sdd/99_toolchain/02_exactness/results/mobile-ui-contract-audit.json",
            },
        ],
    }
    write_json(package_root / "links.json", links)

    return {
        "source_code": spec_source_code,
        "runtime_source_code": runtime_source_code,
        "screen_code": todo["screen_code"],
        "screen_name": todo["screen_name"],
        "primary_route": todo["route"],
        "page_number": page_number,
        "surface_ids": surface_ids,
        "package_path": repo_path(package_root),
        "header_kind": header_kind,
        "bottom_nav_kind": bottom_nav_kind,
    }


def build_registry(
    screen_rows: list[dict[str, Any]],
    contracts: dict[str, dict[str, Any]],
    todo_entries: dict[str, dict[str, Any]],
    *,
    preserve_existing: bool,
) -> None:
    ensure_readme()
    if preserve_existing and (OUTPUT_ROOT / "registry.json").exists():
        existing_payload = read_json(OUTPUT_ROOT / "registry.json")
        existing_rows = {
            str(row["source_code"]): row
            for row in existing_payload.get("screens", [])
            if isinstance(row, dict) and row.get("source_code")
        }
        for row in screen_rows:
            existing_rows[row["source_code"]] = row
        ordered_rows = [
            existing_rows[source_code]
            for source_code in sorted(code for code in todo_entries.keys() if code != "APP_000")
            if source_code in existing_rows
        ]
    else:
        ordered_rows = screen_rows

    write_json(
        OUTPUT_ROOT / "registry.json",
        {
            "service": "mobile",
            "source_spec": repo_path(SOURCE_SPEC),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "artifact_version": EXTRACTOR_VERSION,
            "scope": "full",
            "summary": {
                "screen_count": len(ordered_rows),
                "contract_backed_count": sum(1 for row in ordered_rows if row["runtime_source_code"] in contracts),
                "public_auth_count": sum(1 for row in ordered_rows if row["primary_route"] in PUBLIC_ROUTES),
            },
            "screens": ordered_rows,
        },
    )


def prune_obsolete_package_dirs(expected_spec_codes: set[str]) -> None:
    screens_root = OUTPUT_ROOT / "screens"
    if not screens_root.exists():
        return
    for child in screens_root.iterdir():
        if not child.is_dir():
            continue
        if re.fullmatch(r"APP_\d{3}", child.name) and child.name not in expected_spec_codes:
            for path in sorted(child.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink()
                elif path.is_dir():
                    path.rmdir()
            child.rmdir()


def main() -> None:
    args = parse_args()
    todo_entries = parse_todo_sections()
    routes = parse_routes()
    contracts = parse_screen_contracts()
    requested = normalize_requested_runtime_screens(args.screens, args.runtime_screens, todo_entries)
    built_rows = [build_screen_package(runtime_source_code, todo_entries, routes, contracts) for runtime_source_code in requested]
    if not args.screens and not args.runtime_screens:
        prune_obsolete_package_dirs({row["source_code"] for row in built_rows})
    build_registry(
        built_rows,
        contracts,
        todo_entries,
        preserve_existing=bool(args.screens or args.runtime_screens),
    )


if __name__ == "__main__":
    main()
