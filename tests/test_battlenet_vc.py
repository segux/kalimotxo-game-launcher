"""Battle.net syswow64 VC runtime helpers."""

from pathlib import Path

from kalimotxo.battlenet import (
    BATTLENET_BOTTLE,
    _bottle_has_ucrt_api_ms,
    _bottle_has_vc_runtime,
    _bottle_launch_deps_ok,
    deploy_syswow64_ucrt_api_ms,
    sync_syswow64_vc_dlls,
)


def test_sync_syswow64_copies_vcruntime140_1(tmp_path, monkeypatch):
    bottle = tmp_path / "bottles" / BATTLENET_BOTTLE
    system32 = bottle / "drive_c" / "windows" / "system32"
    syswow64 = bottle / "drive_c" / "windows" / "syswow64"
    system32.mkdir(parents=True)
    syswow64.mkdir(parents=True)
    for name in ("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll", "msvcp140_1.dll"):
        (system32 / name).write_bytes(b"fake")

    monkeypatch.setattr("kalimotxo.battlenet.get_bottle_path", lambda _n: bottle)
    copied = sync_syswow64_vc_dlls()
    assert "vcruntime140_1.dll" in copied
    assert (syswow64 / "vcruntime140_1.dll").is_file()
    assert _bottle_has_vc_runtime()


def test_deploy_ucrt_api_ms_from_ucrtbase(tmp_path, monkeypatch):
    bottle = tmp_path / "bottles" / BATTLENET_BOTTLE
    syswow64 = bottle / "drive_c" / "windows" / "syswow64"
    syswow64.mkdir(parents=True)
    (syswow64 / "ucrtbase.dll").write_bytes(b"ucrt")

    monkeypatch.setattr("kalimotxo.battlenet.get_bottle_path", lambda _n: bottle)
    deployed = deploy_syswow64_ucrt_api_ms()
    assert "api-ms-win-crt-runtime-l1-1-0.dll" in deployed
    assert (syswow64 / "api-ms-win-crt-runtime-l1-1-0.dll").is_file()
    assert _bottle_has_ucrt_api_ms()
    assert _bottle_launch_deps_ok() is False  # VC DLLs still missing
