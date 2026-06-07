"""Store catalog and registry tests."""

from kalimotxo.stores import get_store, list_stores
from kalimotxo.stores.base import StoreAvailability
from kalimotxo.stores.catalog import STORE_CATALOG
from kalimotxo.stores.registry import get_provider, has_capability
from kalimotxo.stores.base import StoreCapability


def test_catalog_includes_planned_integrations():
    assert STORE_CATALOG["epic"].integration_tool == "legendary"
    assert STORE_CATALOG["gog"].integration_tool == "gog"
    assert STORE_CATALOG["amazon"].integration_tool == "nile"
    assert STORE_CATALOG["sideload"].integration_tool == "sideload"


def test_battlenet_provider_registered():
    provider = get_provider("battlenet")
    assert provider is not None
    status = provider.get_status()
    assert status["store_id"] == "battlenet"
    assert "installed" in status


def test_list_stores_mixed_availability():
    stores = list_stores()
    ids = [s["id"] for s in stores]
    assert "battlenet" in ids
    assert "epic" in ids
    assert "steam" in ids
    bnet = next(s for s in stores if s["id"] == "battlenet")
    epic = next(s for s in stores if s["id"] == "epic")
    assert bnet["has_provider"] is True
    assert bnet["implemented"] is True
    assert epic["availability"] == StoreAvailability.COMING_SOON.value
    assert epic["has_provider"] is False
    assert epic["status"]["implemented"] is False


def test_get_store_unknown():
    assert get_store("__nope__") is None


def test_epic_install_capability_not_implemented():
    assert has_capability("epic", StoreCapability.INSTALL)
