"""Transaction CRUD endpoint tests.

Coverage:
- POST   /api/v1/transactions          (create)
- GET    /api/v1/transactions          (list, filters, pagination)
- GET    /api/v1/transactions/{id}     (get one)
- PUT    /api/v1/transactions/{id}     (update)
- DELETE /api/v1/transactions/{id}     (delete)

Auth isolation: each test registers its own user to avoid cross-test pollution.
"""
from __future__ import annotations

import uuid
from datetime import date

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _register_and_login(client: AsyncClient, tag: str | None = None) -> dict:
    """Register a new user and return the TokenResponse JSON."""
    suffix = tag or uuid.uuid4().hex[:8]
    payload = {
        "email": f"txn_user_{suffix}@example.com",
        "name": f"User {suffix}",
        "password": "SecurePass123",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _txn_payload(**overrides) -> dict:
    base = {
        "merchant": "Test Store",
        "amount": "49.99",
        "currency": "USD",
        "expense_date": "2024-03-15",
        "notes": "Test purchase",
        "category_id": None,
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def test_create_transaction_success(client: AsyncClient):
    await _register_and_login(client)
    resp = await client.post("/api/v1/transactions", json=_txn_payload())
    assert resp.status_code == 201, resp.text

    data = resp.json()
    assert data["merchant"] == "Test Store"
    assert data["amount"] == "49.99"
    assert data["currency"] == "USD"
    assert data["expense_date"] == "2024-03-15"
    assert data["notes"] == "Test purchase"
    assert "id" in data
    assert "user_id" in data
    assert "created_at" in data


async def test_create_transaction_unauthenticated(client: AsyncClient):
    # Fresh client — no auth cookie
    client.cookies.clear()
    resp = await client.post("/api/v1/transactions", json=_txn_payload())
    assert resp.status_code == 401


async def test_create_transaction_missing_required_fields(client: AsyncClient):
    await _register_and_login(client)
    # Missing merchant and amount
    resp = await client.post("/api/v1/transactions", json={"currency": "USD"})
    assert resp.status_code == 422


async def test_create_transaction_negative_amount(client: AsyncClient):
    await _register_and_login(client)
    resp = await client.post("/api/v1/transactions", json=_txn_payload(amount="-10.00"))
    assert resp.status_code == 422


async def test_create_transaction_zero_amount(client: AsyncClient):
    await _register_and_login(client)
    resp = await client.post("/api/v1/transactions", json=_txn_payload(amount="0.00"))
    assert resp.status_code == 422


async def test_create_transaction_empty_merchant(client: AsyncClient):
    await _register_and_login(client)
    resp = await client.post("/api/v1/transactions", json=_txn_payload(merchant=""))
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

async def test_list_transactions_empty(client: AsyncClient):
    await _register_and_login(client)
    resp = await client.get("/api/v1/transactions")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_transactions_returns_only_own(client: AsyncClient):
    """Two users; each should see only their own transactions."""
    # User A
    await _register_and_login(client, tag="owner_a")
    await client.post("/api/v1/transactions", json=_txn_payload(merchant="Store A"))

    # User B — register in same client (overwrites cookie)
    await _register_and_login(client, tag="owner_b")
    await client.post("/api/v1/transactions", json=_txn_payload(merchant="Store B"))

    resp = await client.get("/api/v1/transactions")
    assert resp.status_code == 200
    merchants = [item["merchant"] for item in resp.json()["items"]]
    assert "Store B" in merchants
    assert "Store A" not in merchants


async def test_list_transactions_pagination(client: AsyncClient):
    await _register_and_login(client)
    for i in range(5):
        await client.post("/api/v1/transactions", json=_txn_payload(merchant=f"Store {i}"))

    # Page 1
    resp1 = await client.get("/api/v1/transactions", params={"limit": 3})
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert len(d1["items"]) == 3
    assert d1["total"] == 5
    assert d1["has_more"] is True
    assert d1["next_cursor"] is not None

    # Page 2
    resp2 = await client.get("/api/v1/transactions", params={"limit": 3, "cursor": d1["next_cursor"]})
    d2 = resp2.json()
    assert len(d2["items"]) == 2
    assert d2["has_more"] is False

    # IDs must not overlap
    ids1 = {item["id"] for item in d1["items"]}
    ids2 = {item["id"] for item in d2["items"]}
    assert ids1.isdisjoint(ids2)


async def test_list_transactions_filter_by_date_range(client: AsyncClient):
    await _register_and_login(client)
    await client.post("/api/v1/transactions", json=_txn_payload(expense_date="2024-01-10"))
    await client.post("/api/v1/transactions", json=_txn_payload(expense_date="2024-06-15"))
    await client.post("/api/v1/transactions", json=_txn_payload(expense_date="2024-12-31"))

    resp = await client.get(
        "/api/v1/transactions",
        params={"date_from": "2024-06-01", "date_to": "2024-06-30"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["expense_date"] == "2024-06-15"


async def test_list_transactions_filter_by_category_id(client: AsyncClient):
    await _register_and_login(client)
    await client.post("/api/v1/transactions", json=_txn_payload(category_id=1))
    await client.post("/api/v1/transactions", json=_txn_payload(category_id=2))
    await client.post("/api/v1/transactions", json=_txn_payload(category_id=None))

    resp = await client.get("/api/v1/transactions", params={"category_id": 1})
    assert resp.status_code == 200
    data = resp.json()
    # Only the one with category_id=1 should appear
    assert all(item["category_id"] == 1 for item in data["items"])


async def test_list_transactions_unauthenticated(client: AsyncClient):
    client.cookies.clear()
    resp = await client.get("/api/v1/transactions")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Get one
# ---------------------------------------------------------------------------

async def test_get_transaction_success(client: AsyncClient):
    await _register_and_login(client)
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="Get Me"))
    txn_id = created.json()["id"]

    resp = await client.get(f"/api/v1/transactions/{txn_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == txn_id
    assert resp.json()["merchant"] == "Get Me"


async def test_get_transaction_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/transactions/{fake_id}")
    assert resp.status_code == 404


async def test_get_transaction_other_users_transaction(client: AsyncClient):
    """User B should not be able to fetch User A's transaction."""
    await _register_and_login(client, tag="getter_a")
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="Private"))
    txn_id = created.json()["id"]

    # Log in as User B
    await _register_and_login(client, tag="getter_b")
    resp = await client.get(f"/api/v1/transactions/{txn_id}")
    assert resp.status_code == 404


async def test_get_transaction_unauthenticated(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    client.cookies.clear()
    resp = await client.get(f"/api/v1/transactions/{fake_id}")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def test_update_transaction_success(client: AsyncClient):
    await _register_and_login(client)
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="Old Name"))
    txn_id = created.json()["id"]

    resp = await client.put(
        f"/api/v1/transactions/{txn_id}",
        json={"merchant": "New Name", "amount": "99.00"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["merchant"] == "New Name"
    assert data["amount"] == "99.00"
    # Unchanged fields should remain
    assert data["currency"] == "USD"


async def test_update_transaction_partial(client: AsyncClient):
    """Partial update — only provided fields change."""
    await _register_and_login(client)
    created = await client.post(
        "/api/v1/transactions",
        json=_txn_payload(merchant="Partial", notes="Original desc"),
    )
    txn_id = created.json()["id"]

    resp = await client.put(
        f"/api/v1/transactions/{txn_id}",
        json={"notes": "Updated desc"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["merchant"] == "Partial"
    assert data["notes"] == "Updated desc"


async def test_update_expense_date(client: AsyncClient):
    await _register_and_login(client)
    created = await client.post(
        "/api/v1/transactions", json=_txn_payload(expense_date="2024-01-01")
    )
    txn_id = created.json()["id"]

    resp = await client.put(
        f"/api/v1/transactions/{txn_id}",
        json={"expense_date": "2024-06-30"},
    )
    assert resp.status_code == 200
    assert resp.json()["expense_date"] == "2024-06-30"


async def test_update_transaction_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    resp = await client.put(f"/api/v1/transactions/{fake_id}", json={"merchant": "Ghost"})
    assert resp.status_code == 404


async def test_update_transaction_other_users(client: AsyncClient):
    """User B must not be able to update User A's transaction."""
    await _register_and_login(client, tag="upd_a")
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="A Only"))
    txn_id = created.json()["id"]

    await _register_and_login(client, tag="upd_b")
    resp = await client.put(f"/api/v1/transactions/{txn_id}", json={"merchant": "Hijacked"})
    assert resp.status_code == 404


async def test_update_transaction_unauthenticated(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    client.cookies.clear()
    resp = await client.put(f"/api/v1/transactions/{fake_id}", json={"merchant": "X"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def test_delete_transaction_success(client: AsyncClient):
    await _register_and_login(client)
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="Doomed"))
    txn_id = created.json()["id"]

    resp = await client.delete(f"/api/v1/transactions/{txn_id}")
    assert resp.status_code == 200
    assert str(txn_id) in resp.json()["message"]

    # Confirm gone
    get_resp = await client.get(f"/api/v1/transactions/{txn_id}")
    assert get_resp.status_code == 404


async def test_delete_transaction_not_found(client: AsyncClient):
    await _register_and_login(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"/api/v1/transactions/{fake_id}")
    assert resp.status_code == 404


async def test_delete_transaction_other_users(client: AsyncClient):
    """User B must not be able to delete User A's transaction."""
    await _register_and_login(client, tag="del_a")
    created = await client.post("/api/v1/transactions", json=_txn_payload(merchant="A Protected"))
    txn_id = created.json()["id"]

    await _register_and_login(client, tag="del_b")
    resp = await client.delete(f"/api/v1/transactions/{txn_id}")
    assert resp.status_code == 404


async def test_delete_transaction_unauthenticated(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    client.cookies.clear()
    resp = await client.delete(f"/api/v1/transactions/{fake_id}")
    assert resp.status_code == 401
