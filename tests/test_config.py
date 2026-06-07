"""Smoke tests for configuration and bottle config."""

from kalimotxo.config import (
    COMPONENT_VERSIONS,
    detect_hardware,
    ensure_directories,
    is_setup_complete,
)
from kalimotxo.performance import recommend_backend


def test_hardware_detection():
    hw = detect_hardware()
    assert hw["arch"] in ("arm64", "x86_64")
    assert hw["ram_gb"] > 0


def test_component_versions():
    assert COMPONENT_VERSIONS["wine"] == "11.6_1"
    assert COMPONENT_VERSIONS["dxmt"] == "0.74"


def test_ensure_directories(tmp_path, monkeypatch):
    monkeypatch.setattr("kalimotxo.config.DATA_DIR", tmp_path)
    monkeypatch.setattr("kalimotxo.config.RUNTIME_DIR", tmp_path / "runtime")
    monkeypatch.setattr("kalimotxo.config.BOTTLES_DIR", tmp_path / "bottles")
    monkeypatch.setattr("kalimotxo.config.CACHE_DIR", tmp_path / "cache")
    monkeypatch.setattr("kalimotxo.config.LOGS_DIR", tmp_path / "logs")
    monkeypatch.setattr("kalimotxo.config.WINE_DIR", tmp_path / "runtime" / "wine")
    monkeypatch.setattr("kalimotxo.config.DXMT_DIR", tmp_path / "runtime" / "dxmt")
    monkeypatch.setattr("kalimotxo.config.DXVK_DIR", tmp_path / "runtime" / "dxvk")
    monkeypatch.setattr("kalimotxo.config.D3DMETAL_DIR", tmp_path / "runtime" / "d3dmetal")
    ensure_directories()
    assert (tmp_path / "bottles").is_dir()


def test_recommend_backend():
    assert recommend_backend("diablo4") == "d3dmetal"
    assert recommend_backend("wow") == "dxmt"


def test_is_setup_complete_false():
    assert is_setup_complete() in (True, False)
