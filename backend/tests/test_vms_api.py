"""VMS Admin Portal Backend API tests."""
import os
import io
import csv
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to frontend .env for testing context only
    from pathlib import Path
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Dashboard --------
class TestDashboard:
    def test_dashboard_kpis(self, client):
        r = client.get(f"{API}/dashboard", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "kpis" in data and "recent_visitors" in data and "recent_activity" in data
        for key in ("total_residents", "active_passes", "visitors_today", "entries_week"):
            assert key in data["kpis"]
            assert isinstance(data["kpis"][key], int)


# -------- Residents --------
class TestResidents:
    def test_list_residents_pagination(self, client):
        r = client.get(f"{API}/residents?page=1&page_size=8", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert len(data["items"]) <= 8
        assert data["page"] == 1

    def test_list_residents_search(self, client):
        # search by apartment substring
        r = client.get(f"{API}/residents?search=A-", timeout=15)
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert "A-" in it["apartment"] or "a-" in it["apartment"].lower()

    def test_filter_status(self, client):
        r = client.get(f"{API}/residents?status=active", timeout=15)
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert it["status"] == "active"

    def test_create_and_get_resident(self, client):
        apt = f"Z-{int(time.time()) % 1000:03d}"
        payload = {"apartment": apt, "name": "TEST_Resident", "phone": "+91 9999999999"}
        r = client.post(f"{API}/residents", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["apartment"] == apt
        assert created["name"] == "TEST_Resident"
        assert "id" in created

        # GET detail
        rid = created["id"]
        r2 = client.get(f"{API}/residents/{rid}", timeout=15)
        assert r2.status_code == 200
        body = r2.json()
        assert body["resident"]["id"] == rid
        assert "stats" in body
        for k in ("total_passes", "used", "active", "expired"):
            assert k in body["stats"]

    def test_create_duplicate_apartment_fails(self, client):
        # Create one
        apt = f"Z-{int(time.time()) % 1000:03d}-dup{int(time.time())%100}"
        r = client.post(f"{API}/residents", json={"apartment": apt, "name": "TEST_A", "phone": "+91 1"}, timeout=15)
        assert r.status_code == 200
        # Duplicate should fail
        r2 = client.post(f"{API}/residents", json={"apartment": apt, "name": "TEST_B", "phone": "+91 2"}, timeout=15)
        assert r2.status_code == 400

    def test_toggle_resident(self, client):
        apt = f"Z-TOG{int(time.time()) % 10000}"
        r = client.post(f"{API}/residents", json={"apartment": apt, "name": "TEST_Toggle", "phone": "+91 1"}, timeout=15)
        rid = r.json()["id"]
        r2 = client.post(f"{API}/residents/{rid}/toggle", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["status"] == "disabled"

    def test_residents_min(self, client):
        r = client.get(f"{API}/residents-min", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            assert "id" in items[0] and "apartment" in items[0]


# -------- Passes --------
class TestPasses:
    def test_list_passes_summary(self, client):
        r = client.get(f"{API}/passes", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "summary" in data
        for k in ("active", "used", "expired", "revoked", "today"):
            assert k in data["summary"]

    def test_passes_status_filter(self, client):
        r = client.get(f"{API}/passes?status=active", timeout=15)
        assert r.status_code == 200
        for p in r.json()["items"]:
            assert p["status"] == "active"

    def test_passes_range_filter(self, client):
        r = client.get(f"{API}/passes?range=7", timeout=15)
        assert r.status_code == 200

    def test_expiring_passes(self, client):
        r = client.get(f"{API}/passes/expiring", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("one_hour", "six_hours", "today", "counts"):
            assert k in data

    def test_create_pass(self, client):
        residents = client.get(f"{API}/residents-min", timeout=15).json()
        assert residents, "Need at least one active resident"
        rid = residents[0]["id"]
        r = client.post(f"{API}/passes", json={"resident_id": rid, "visitor_name": "TEST_Visitor", "purpose": "TEST"}, timeout=15)
        assert r.status_code == 200
        p = r.json()
        assert p["status"] == "active"
        assert len(p["pin"]) == 4
        assert p["visitor_name"] == "TEST_Visitor"

    def test_pass_detail_and_revoke(self, client):
        residents = client.get(f"{API}/residents-min", timeout=15).json()
        rid = residents[0]["id"]
        cr = client.post(f"{API}/passes", json={"resident_id": rid}, timeout=15).json()
        pid = cr["id"]

        # detail
        r = client.get(f"{API}/passes/{pid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == pid
        assert "timeline" in r.json()

        # revoke
        r2 = client.post(f"{API}/passes/{pid}/revoke", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["status"] == "revoked"

        # second revoke should fail
        r3 = client.post(f"{API}/passes/{pid}/revoke", timeout=15)
        assert r3.status_code == 400


# -------- Guard verification --------
class TestVerification:
    def test_verify_invalid_pin(self, client):
        r = client.post(f"{API}/verify", json={"pin": "abcd"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["valid"] is False

    def test_verify_active_pin_and_approve(self, client):
        # create a fresh pass to ensure active
        residents = client.get(f"{API}/residents-min", timeout=15).json()
        rid = residents[0]["id"]
        p = client.post(f"{API}/passes", json={"resident_id": rid, "visitor_name": "TEST_VerVisitor"}, timeout=15).json()
        pid, pin = p["id"], p["pin"]

        r = client.post(f"{API}/verify", json={"pin": pin}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["valid"] is True
        assert data["pass_id"] == pid
        assert data["apartment"] == p["apartment"]

        # approve
        r2 = client.post(f"{API}/passes/{pid}/approve", json={"pass_id": pid, "guard": "TEST_Guard"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["ok"] is True

        # verify again should be invalid (used)
        r3 = client.post(f"{API}/verify", json={"pin": pin}, timeout=15).json()
        assert r3["valid"] is False
        assert r3["reason"] in ("Used", "Expired", "Revoked", "Invalid")


# -------- Logs --------
class TestLogs:
    def test_list_logs(self, client):
        r = client.get(f"{API}/logs", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)

    def test_logs_search_and_filter(self, client):
        r = client.get(f"{API}/logs?range=7&status=active", timeout=15)
        assert r.status_code == 200

    def test_logs_export_csv(self, client):
        r = client.get(f"{API}/logs/export", timeout=20)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        rows = list(csv.reader(io.StringIO(r.text)))
        assert len(rows) > 1
        assert rows[0][0] == "Timestamp"


# -------- Reports --------
class TestReports:
    def test_reports(self, client):
        r = client.get(f"{API}/reports", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("visitors_per_day", "most_active", "usage", "metrics"):
            assert k in data
        assert len(data["visitors_per_day"]) == 14
        for k in ("total_visitors", "avg_daily_visitors", "approval_rate", "expired_pass_rate"):
            assert k in data["metrics"]


# -------- Settings --------
class TestSettings:
    def test_get_settings(self, client):
        r = client.get(f"{API}/settings", timeout=15)
        assert r.status_code == 200
        s = r.json()
        for k in ("society_name", "address", "pin_expiry_minutes", "whatsapp_enabled", "notify_on_entry", "notify_on_expiry"):
            assert k in s

    def test_update_settings_persists(self, client):
        cur = client.get(f"{API}/settings", timeout=15).json()
        new_minutes = 90 if cur["pin_expiry_minutes"] != 90 else 60
        payload = {**cur, "pin_expiry_minutes": new_minutes}
        # remove id key if present
        payload.pop("id", None)
        r = client.put(f"{API}/settings", json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["pin_expiry_minutes"] == new_minutes
        # verify GET
        r2 = client.get(f"{API}/settings", timeout=15).json()
        assert r2["pin_expiry_minutes"] == new_minutes
