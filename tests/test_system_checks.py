"""System dependency checks."""

from kalimotxo.system_checks import check_all, check_cabextract, system_ready_for_winetricks


def test_check_all_includes_cabextract():
    checks = check_all()
    assert "cabextract" in checks
    assert "installed" in checks["cabextract"]


def test_system_ready_for_winetricks_message():
    _ok, msg = system_ready_for_winetricks()
    assert isinstance(msg, str)
    cab = check_cabextract()
    if cab["installed"]:
        assert _ok is True
    else:
        assert _ok is False
        assert "cabextract" in msg.lower()
