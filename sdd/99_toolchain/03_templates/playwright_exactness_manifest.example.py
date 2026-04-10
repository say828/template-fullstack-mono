from __future__ import annotations


PLAYWRIGHT_SUITES = [
    {
        "id": "surface-screen-batch",
        "spec": "surface-screen-batch.spec.js",
        "kind": "screen-exactness",
        "service": "example-surface",
        "targets": ["EXM-S001", "EXM-S002"],
        "description": "example screen exactness batch",
    },
    {
        "id": "shared-shell-regression",
        "spec": "shared-shell-regression.spec.js",
        "kind": "shared-ui-regression",
        "service": "shared-shell",
        "targets": ["shared-shell"],
        "description": "example shared shell regression batch",
    },
]
