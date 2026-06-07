"""Battle.net helper tests."""

from kalimotxo.battlenet import (
    find_launcher_exe,
    get_battlenet_status,
    get_install_progress,
    is_battlenet_installed,
)


def test_get_battlenet_status_keys():
    status = get_battlenet_status()
    assert "bottle_exists" in status
    assert "installed" in status
    assert "runtime_ready" in status
    assert "installer_cached" in status
    assert "can_install" in status
    assert "can_uninstall" in status
    assert status["can_install"] is not status["can_uninstall"] or not status["installed"]


def test_install_progress_defaults():
    p = get_install_progress()
    assert "phase" in p
    assert "percent" in p


def test_find_launcher_missing_bottle():
    assert find_launcher_exe("__nonexistent_bottle__") is None
