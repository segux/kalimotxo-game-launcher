"""Wine Manager catalog and path tests."""

from pathlib import Path

from kalimotxo.wine_manager.installed import find_wine64_in_tree, install_dir_for_version
from kalimotxo.wine_manager.repositories import MACOS_REPOSITORIES, REPO_BY_ID
from kalimotxo.wine_manager.releases import merge_release_lists, _version_name


def test_macos_repositories_use_github_release_apis():
    ids = {r.id for r in MACOS_REPOSITORIES}
    assert "wine-staging-macos" in ids
    assert "wine-crossover" in ids
    assert REPO_BY_ID["wine-staging-macos"].api_url.endswith("/releases")


def test_version_name_staging():
    assert _version_name("Wine-Staging-macOS", "11.6_1") == "Wine-11.6_1"


def test_install_dir_sanitized():
    p = install_dir_for_version("Wine-11.6_1", "Wine-Staging-macOS")
    assert "Wine-11.6_1" in str(p)


def test_merge_preserves_installed(tmp_path):
    install_dir = tmp_path / "wine" / "Wine-1.0"
    install_dir.mkdir(parents=True)
    (install_dir / "bin").mkdir()
    (install_dir / "bin" / "wine64").write_text("", encoding="utf-8")
    existing = [{
        "version": "Wine-1.0",
        "type": "Wine-Staging-macOS",
        "is_installed": True,
        "install_dir": str(install_dir),
        "disksize": 100,
        "date": "2024-01-01",
    }]
    fetched = [{
        "version": "Wine-1.0",
        "type": "Wine-Staging-macOS",
        "date": "2024-06-01",
        "download": "http://example.com/wine.tar.xz",
        "checksum": "new",
    }]
    merged = merge_release_lists(existing, fetched)
    row = next(r for r in merged if r["version"] == "Wine-1.0")
    assert row["is_installed"] is True
    assert row["install_dir"] == str(install_dir)


def test_find_wine64_in_tree_flat_bin(tmp_path):
    wine64 = tmp_path / "bin" / "wine64"
    wine64.parent.mkdir(parents=True)
    wine64.write_text("", encoding="utf-8")
    assert find_wine64_in_tree(tmp_path) == wine64
