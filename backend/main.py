"""Backend entrypoint.

Docker CMD: uvicorn main:app --host 0.0.0.0 --port 8000
The actual FastAPI application is created in app/main.py.
"""
from app.main import app  # noqa: F401 — re-exported for uvicorn

__all__ = ["app"]
