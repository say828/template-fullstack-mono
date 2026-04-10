from pathlib import Path

from spec_asset_builder import main


DEFAULT_MANIFEST = Path(__file__).resolve().parents[1] / "03_templates/asset_recipe_manifest.example.py"


if __name__ == "__main__":
    main(default_manifest=DEFAULT_MANIFEST)
