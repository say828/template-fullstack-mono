import uuid
from pathlib import Path
import pytest

from contexts.support.infrastructure.storage import LocalSupportStorage


def test_resolve_inquiry_attachment_success_returns_absolute_path_and_is_inside_base():
    storage = LocalSupportStorage()  # default base_dir: data/storage/support under CWD
    # Create a unique file inside the base directory
    fname = f"test-{uuid.uuid4().hex}.bin"
    target = storage.base_dir / fname
    target.write_bytes(b"ok")

    stored_path = str(target.relative_to(Path.cwd()))
    resolved = storage.resolve_inquiry_attachment(stored_path)

    assert resolved.is_absolute()
    assert resolved == target
    assert resolved.is_file()
    # sanity: ensure the resolved path is inside the configured base directory
    assert str(resolved).startswith(str(storage.base_dir))


def test_resolve_inquiry_attachment_rejects_outside_base():
    storage = LocalSupportStorage()
    # Path resolves outside base (e.g., sibling under data/storage/)
    outside_rel = "data/storage/not-support-area/file.bin"

    with pytest.raises(FileNotFoundError):
        storage.resolve_inquiry_attachment(outside_rel)


def test_resolve_inquiry_attachment_missing_file_inside_base_errors():
    storage = LocalSupportStorage()
    missing_rel = str((storage.base_dir / "missing.bin").relative_to(Path.cwd()))

    with pytest.raises(FileNotFoundError):
        storage.resolve_inquiry_attachment(missing_rel)
