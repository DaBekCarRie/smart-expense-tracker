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

### 🎨 Frontend Standards & Design System
- **Typing:** All components and API responses MUST be strongly typed. No `any`. Interfaces live in `frontend/src/types/`.
- **Performance:** Use `next/dynamic` for heavy components like Charts or complex UI modules.
- **Optimized Uploads:** Implement client-side image compression (to WebP) BEFORE uploading receipts to the backend.
- **UI/UX:**
  - Always use loading states for async operations.
  - Follow Shadcn UI patterns.
  - API calls MUST be centralized in `frontend/src/lib/api.ts` or scoped modules within `lib/api/`.
- **Environment:** Use environment variables for API URLs; never hardcode.

#### 🖌️ Special Theme: Cute Doodle & Hand-drawn Sketch Aesthetic
To maintain a high-quality, charming doodle aesthetic across the entire app, follow these UI guidelines:
1. **Background & Color Palette:**
   - Background must use a warm paper texture style (e.g. `#faf8f5` or `#fcfbf9`).
   - Use soft pastel accent colors for active items or chart categories.
2. **Outlines & Shadows (Neo-brutalism Doodle style):**
   - Apply solid black outlines to cards, inputs, and buttons: `border-2 border-black`.
   - Apply a rigid black shadow: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`.
   - Mimic hand-drawn shapes using uneven border-radii where appropriate: `rounded-[255px_15px_225px_15px]/[15px_225px_15px_255px]`.
3. **Typography:**
   - Use Google Fonts **Patrick Hand** (for English) and **Mali** (for Thai) as the primary font family to render text as handwritten ink.
4. **Icons & Charts:**
   - Use outline-based icons with thicker strokes (`strokeWidth={2.5}`) to resemble pen sketches.
   - Use custom SVG structures or dynamic imports (`next/dynamic`) to style Recharts charts with thick black borders on data slices.

---

## ⚙️ Backend Standards (Senior Backend Dev)
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

---

## 🧪 Quality Assurance (QA Agent)
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
