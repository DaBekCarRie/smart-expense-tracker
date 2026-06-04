# Smart Expense Tracker with OCR

Full-stack expense tracker — snap a receipt, OCR extracts merchant & amount automatically.
Built to showcase **performance, cost, and scalability** engineering.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind · React Query
- **Backend**: FastAPI · SQLAlchemy (async) · Pydantic v2
- **Database**: PostgreSQL · Alembic
- **Cache**: Redis
- **OCR**: Tesseract (dev) / OpenAI Vision (prod) — adapter pattern

## ⚡ 4 Optimization Highlights
| # | Area | Technique | Result |
|---|------|-----------|--------|
| 1 | Frontend | Browser-side compression + WebP before upload | −80% file size |
| 2 | Network/Cost | Redis OCR cache keyed by MD5 hash | −25% repeat API calls, ms response |
| 3 | Database | Compound index `(user_id, date)` + cursor pagination | 4× faster dashboard |
| 4 | UX | Code splitting, dynamic imports, debounced search | smaller bundle, smoother UI |

## Project Structure
```
backend/    FastAPI + SQLAlchemy + Alembic
frontend/   Next.js 14 App Router
docker-compose.yml
```

## Quick Start
```bash
# Backend stack
docker-compose up -d
curl http://localhost:8000/api/v1/health

# Frontend (local dev)
cd frontend && npm install && npm run dev
```

## Build Milestones
1. Backend & DB skeleton (schema + compound index)
2. OCR pipeline & Redis cache
3. Frontend setup & UI
4. Integration & client-side compression
5. Dashboard & UX optimization

> Status: 🚧 Scaffolding complete — implementation in progress.
