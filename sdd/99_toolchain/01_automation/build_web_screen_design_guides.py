from __future__ import annotations

import argparse
import sys
from pathlib import Path

from screen_design_guide_builder import main as build_guide


SERVICE_MANIFESTS = {
    "seller": "seller_screen_design_guide_manifest.py",
    "dealer": "dealer_screen_design_guide_manifest.py",
    "admin": "admin_screen_design_guide_manifest.py",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Palcar seller/dealer/admin screen design guides.")
    parser.add_argument("--service", action="append", choices=sorted(SERVICE_MANIFESTS.keys()), help="Service to build. Repeatable.")
    parser.add_argument("--page", action="append", type=int, dest="pages", help="Limit to specific pages. Repeatable.")
    parser.add_argument("--list-services", action="store_true", help="List supported services and exit.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_services:
        for service in SERVICE_MANIFESTS:
            print(service)
        return

    services = args.service or list(SERVICE_MANIFESTS.keys())
    for service in services:
        manifest = Path(__file__).with_name(SERVICE_MANIFESTS[service])
        cli_args = ["--manifest", str(manifest)]
        for page in args.pages or []:
            cli_args.extend(["--page", str(page)])
        build_guide(cli_args)


if __name__ == "__main__":
    main()
