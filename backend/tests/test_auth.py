"""Auth endpoint tests: register, login, token refresh, logout, /me.

Coverage:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET  /api/v1/auth/me
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

async def test_register_success(client: AsyncClient):
    payload = {
        "email": "alice@example.com",
        "name": "Alice",
        "password": "StrongPass1",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text

    data = resp.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice"
    assert "id" in data["user"]

    # Cookies should be set
    assert "access_token" in resp.cookies
    assert "refresh_token" in resp.cookies


async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "name": "Bob",
        "password": "StrongPass1",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already registered" in r2.json()["detail"].lower()


async def test_register_short_password(client: AsyncClient):
    payload = {"email": "short@example.com", "name": "Short", "password": "abc"}
    resp = await client.post("/api/v1/auth/register", json=payload)
    # Pydantic min_length=8 → 422
    assert resp.status_code == 422


async def test_register_invalid_email(client: AsyncClient):
    payload = {"email": "not-an-email", "name": "Bad", "password": "ValidPass1"}
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

async def test_login_success(client: AsyncClient):
    # Register first
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "logintest@example.com", "name": "Login", "password": "SecurePass1"},
    )
    assert reg.status_code == 201

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "logintest@example.com", "password": "SecurePass1"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "logintest@example.com"
    assert "access_token" in resp.cookies
    assert "refresh_token" in resp.cookies


async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "name": "WP", "password": "RealPass123"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "WrongPass999"},
    )
    assert resp.status_code == 401
    assert "invalid credentials" in resp.json()["detail"].lower()


async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Anything123"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# /me
# ---------------------------------------------------------------------------

async def test_me_authenticated(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "name": "Me", "password": "SecurePass1"},
    )
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me@example.com"


async def test_me_unauthenticated(client: AsyncClient):
    # No cookie set → 401
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

async def test_refresh_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "name": "Ref", "password": "SecurePass1"},
    )
    # client carries cookies automatically
    resp = await client.post("/api/v1/auth/refresh")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "refresh@example.com"


async def test_refresh_no_cookie(client: AsyncClient):
    # Clear any cookies
    client.cookies.clear()
    resp = await client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401


async def test_refresh_with_access_token_rejected(client: AsyncClient):
    """Sending an access token as refresh_token must be rejected."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "badref@example.com", "name": "BR", "password": "SecurePass1"},
    )
    access_token = reg.json()["access_token"]

    # Manually inject the access token as the refresh_token cookie
    client.cookies.set("refresh_token", access_token)
    resp = await client.post("/api/v1/auth/refresh")
    assert resp.status_code == 401
    assert "invalid token type" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

async def test_logout(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "name": "Lo", "password": "SecurePass1"},
    )
    resp = await client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out"
