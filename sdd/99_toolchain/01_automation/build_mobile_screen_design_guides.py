from __future__ import annotations

import sys
from pathlib import Path

from screen_design_guide_builder import main


if __name__ == "__main__":
    main(
        [
            "--manifest",
            str(Path(__file__).with_name("mobile_screen_design_guide_manifest.py")),
            *sys.argv[1:],
        ]
    )
