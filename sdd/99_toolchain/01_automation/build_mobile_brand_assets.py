from pathlib import Path

from spec_asset_builder import main


if __name__ == "__main__":
    main(default_manifest=Path(__file__).with_name("mobile_asset_manifest.py"))
