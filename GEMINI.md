# 🧠 Smart Expense Tracker — Engineering Standards

This file defines the foundational mandates, architecture, and workflows for the Smart Expense Tracker project.

---

## 📐 Project Overview

**Stack:**
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python) + SQLAlchemy (async) + PostgreSQL + Redis
- **Infrastructure:** Docker Compose

**Monorepo Structure:**
```
smart-expense-tracker/
├── frontend/               # Next.js App Router
│   ├── src/                # Source code
│   │   ├── app/            # Pages & Routing
│   │   ├── components/     # UI Components
│   │   ├── lib/            # Utilities & API client
│   │   └── types/          # TypeScript Interfaces
│   └── package.json
├── backend/                # FastAPI
│   ├── app/
│   │   ├── api/            # API Endpoints (Routers)
│   │   ├── core/           # Configs (Redis, DB, Security)
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Models (V2)
│   │   └── services/       # Business Logic (OCR, Cache)
│   ├── requirements.txt
│   └── main.py
└── docker-compose.yml
```

---

## 🛠️ Engineering Standards

### 🎨 Frontend Standards (Senior Frontend Dev)
- **Typing:** All components and API responses MUST be strongly typed. No `any`. Interfaces live in `frontend/src/types/`.
- **Performance:** Use `next/dynamic` for heavy components like Charts or complex UI modules.
- **Optimized Uploads:** Implement client-side image compression (to WebP) BEFORE uploading receipts to the backend.
- **UI/UX:**
  - Always use loading states for async operations.
  - Follow Shadcn UI patterns.
  - API calls MUST be centralized in `frontend/src/lib/api.ts` or scoped modules within `lib/api/`.
- **Environment:** Use environment variables for API URLs; never hardcode.

### ⚙️ Backend Standards (Senior Backend Dev)
- **Asynchronous First:** ALWAYS use `async/await` for all database operations and external API calls.
- **Caching Strategy:** OCR results must be cached in Redis:
  1. Hash the image.
  2. Check Redis cache.
  3. If miss: Call OCR service.
  4. Store result in Redis with TTL=3600.
- **Database:**
  - The `Transaction` table MUST have a compound index on `(user_id, transaction_date)`.
  - Use SQLAlchemy ORM; avoid raw SQL.
- **Type Safety:** All endpoints must return typed Pydantic response schemas.
- **Layering:** Keep routes in `/api/`, business logic in `/services/`, and DB models in `/models/`.

### 🧪 Quality Assurance (QA Agent)
- **API Contracts:** Every new endpoint must be documented with an API contract table:
  | Method | Endpoint | Auth? | Request Body | Response Schema |
  |--------|----------|-------|-------------|-----------------|
- **Validation:**
  - Verify CORS is correctly configured.
  - Ensure authentication headers are handled on both sides.
  - Error handling for OCR failures, DB timeouts, and Redis misses is mandatory.

---

## 🗺️ Execution Strategy

1. **Reproduction & Testing:** Always attempt to reproduce bugs with a test case before fixing.
2. **Progress Tracking:** Update `PROGRESS.md` after every major task or milestone completion, detailing:
   - Built features/files.
   - API contract changes.
   - Bugs found and fixed.
3. **Milestone Focus:** Work through established milestones (Backend Skeleton -> OCR Pipeline -> Frontend Components -> Integration -> Dashboard) sequentially.

---

## 🚦 Integration Checklist
- [ ] API contract matches implementation (method, path, response shape).
- [ ] Image compressed to WebP before upload.
- [ ] Compound indexes verified in DB.
- [ ] Async/Await consistency across the backend.
- [ ] Loading states and dynamic imports in the frontend.
