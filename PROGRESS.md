# Smart Expense Tracker — Progress Summary

_Last updated: 2026-06-04_

---

## สถานะ Milestones

| Milestone | สถานะ | หมายเหตุ |
|-----------|-------|---------|
| M1: DB & Backend Skeleton | ✅ เสร็จ + QA ผ่าน | บั้กทั้งหมดแก้แล้ว |
| M2: OCR Pipeline + Redis | ✅ เสร็จ | |
| M3: Frontend Setup + Components | ✅ เสร็จ | |
| M4: Frontend-Backend Integration | ⏳ รอดำเนินการ | |
| M5: Dashboard | ⏳ รอดำเนินการ | |

---

## M1 — DB & Backend Skeleton ✅

### ไฟล์ที่สร้าง
| ไฟล์ | คำอธิบาย |
|------|---------|
| `docker-compose.yml` | PostgreSQL + Redis + Backend services พร้อม healthcheck |
| `backend/Dockerfile` | Python 3.11, tesseract-ocr, uvicorn |
| `backend/requirements.txt` | FastAPI, SQLAlchemy async, asyncpg, alembic, redis, jose, passlib |
| `backend/requirements-dev.txt` | pytest, pytest-asyncio, httpx, aiosqlite, fakeredis |
| `backend/app/models/expense.py` | ORM model `Expense` (table: `expenses`) — compound index `(user_id, expense_date DESC)` |
| `backend/app/models/user.py` | ORM model `User` — email unique, bcrypt password_hash |
| `backend/app/models/category.py` | ORM model `Category` |
| `backend/app/schemas/transaction.py` | `TransactionCreate`, `TransactionUpdate`, `TransactionResponse`, `TransactionListResponse` (Pydantic v2) |
| `backend/app/schemas/user.py` | `UserCreate`, `UserLogin`, `UserOut`, `TokenResponse` |
| `backend/app/api/transactions.py` | CRUD `/api/v1/transactions` — POST, GET (list+filter), GET by id, PUT, DELETE |
| `backend/app/routers/auth.py` | POST /auth/register, /auth/login, /auth/refresh, /auth/logout, GET /auth/me |
| `backend/app/core/database.py` | Async SQLAlchemy engine + `get_db` dependency |
| `backend/app/core/redis.py` | Redis ConnectionPool + `get_redis` dependency |
| `backend/app/services/auth_service.py` | JWT create/decode, bcrypt hash/verify |
| `backend/app/services/cache_service.py` | `get_json`, `set_json`, `delete`, `exists` with TTL |
| `backend/app/dependencies.py` | `get_current_user`, `get_redis` |
| `backend/alembic/env.py` | Async Alembic migration setup |

### API Contract — Auth
| Method | Endpoint | Auth? | Request | Response |
|--------|----------|-------|---------|----------|
| POST | `/api/v1/auth/register` | No | `{email, name, password}` | `TokenResponse` |
| POST | `/api/v1/auth/login` | No | `{email, password}` | `TokenResponse` |
| POST | `/api/v1/auth/refresh` | Cookie | — | `TokenResponse` |
| POST | `/api/v1/auth/logout` | No | — | `{message}` |
| GET | `/api/v1/auth/me` | Cookie | — | `UserOut` |

### API Contract — Transactions
| Method | Endpoint | Auth? | Request | Response |
|--------|----------|-------|---------|----------|
| POST | `/api/v1/transactions` | Cookie | `TransactionCreate` | `TransactionResponse` |
| GET | `/api/v1/transactions` | Cookie | `?category_id&date_from&date_to&limit&offset` | `TransactionListResponse` |
| GET | `/api/v1/transactions/{id}` | Cookie | — | `TransactionResponse` |
| PUT | `/api/v1/transactions/{id}` | Cookie | `TransactionUpdate` | `TransactionResponse` |
| DELETE | `/api/v1/transactions/{id}` | Cookie | — | `{message}` |

### QA Bugs พบและแก้แล้ว
| ID | Severity | คำอธิบาย | การแก้ |
|----|----------|---------|-------|
| B1 | HIGH | Circular import: `dependencies.get_redis` import จาก `app.main` | เปลี่ยนเป็นใช้ pool จาก `app/core/redis.py` |
| B2 | HIGH | Missing `db.commit()` ใน create/update transaction | เปลี่ยน `flush()` → `commit()` |
| B3 | MEDIUM | `import uuid` อยู่ใน function body | ย้ายขึ้น top-level |
| B4 | MEDIUM | Duplicate JWT logic ใน `core/security.py` | ลบไฟล์ทิ้ง ใช้ `auth_service` เป็น single source |
| B5 | MEDIUM | Duplicate CRUD surface (`/transactions` + `/expenses`) | เก็บทั้งคู่ไว้ (cursor vs offset pagination) |
| B6 | LOW | Missing test deps (`aiosqlite`, `fakeredis`, `pytest-asyncio`) | สร้าง `requirements-dev.txt` |
| B7 | LOW | `Field(alias=None)` is a no-op ใน Pydantic v2 | ลบออก |

### Tests
- `backend/tests/conftest.py` — fixtures: async SQLite in-memory DB, fakeredis, httpx AsyncClient
- `backend/tests/test_auth.py` — 13 tests (register, login, refresh, logout, /me)
- `backend/tests/test_transactions.py` — 26 tests (CRUD, ownership isolation, pagination, filters)

---

## M2 — OCR Pipeline + Redis ✅

### ไฟล์ที่สร้าง
| ไฟล์ | คำอธิบาย |
|------|---------|
| `backend/app/ocr/base.py` | Abstract `OCRProvider` base class |
| `backend/app/ocr/tesseract_server.py` | `TesseractProvider` — pytesseract ใน thread pool executor (non-blocking) |
| `backend/app/ocr/openai_vision.py` | `OpenAIVisionProvider` — GPT-4o-mini vision, async, graceful fallback |
| `backend/app/services/ocr_service.py` | `OCRService` — Redis cache-before-OCR pipeline, TTL=3600, module-level singleton |
| `backend/app/routers/ocr.py` | `POST /ocr/upload` — validate, compress if >2MB, OCR, return result |
| `backend/app/schemas/ocr.py` | `OCRResult`, `OCRUploadResponse` (Pydantic v2) |
| `backend/app/utils/image.py` | `compress_image()`, `md5_hash()`, `validate_image()` |

### OCR Cache Flow (non-negotiable order)
```
1. MD5(image_bytes) → cache_key
2. Redis GET(cache_key) → HIT: return cached result (cached=True)
3. MISS: provider.extract(image_bytes)
4. Redis SETEX(cache_key, 3600, result)
5. return result
```

### Provider Selection
- `OPENAI_API_KEY` ตั้งค่าอยู่ → ใช้ `OpenAIVisionProvider` (GPT-4o-mini)
- ไม่มี `OPENAI_API_KEY` → ใช้ `TesseractProvider` (local)

### API Contract — OCR
| Method | Endpoint | Auth? | Request | Response |
|--------|----------|-------|---------|----------|
| POST | `/api/v1/ocr/upload` | Cookie | `multipart/form-data` (file) | `OCRUploadResponse` |

### OCRResult Schema
```typescript
{
  merchant: string
  amount: Decimal
  currency: string
  date: date          // receipt_date internally
  raw_text: string
  confidence: float
  cached: boolean
}
```

---

## M3 — Frontend Setup + Components ✅

### ไฟล์ที่สร้าง/แก้ไข
| ไฟล์ | คำอธิบาย |
|------|---------|
| `frontend/types/index.ts` | TypeScript interfaces: `Transaction`, `TransactionCreate`, `TransactionUpdate`, `TransactionListResponse`, `User`, `OCRResult`, `UploadState`, `Category` |
| `frontend/lib/api.ts` | Unified barrel export ของ API functions ทั้งหมด |
| `frontend/lib/api/client.ts` | Axios instance — `withCredentials: true`, base URL จาก `NEXT_PUBLIC_API_URL`, 401 → redirect login |
| `frontend/lib/api/auth.ts` | `login()`, `register()`, `logout()`, `getMe()` |
| `frontend/lib/api/expenses.ts` | `getExpenses()`, `createExpense()`, `updateExpense()`, `deleteExpense()`, `getCategories()` |
| `frontend/lib/api/ocr.ts` | `extractOCR(file)` — multipart/form-data |
| `frontend/lib/utils/imageCompression.ts` | `compressReceiptImage()` — compress → WebP ก่อน upload (browser-image-compression) |
| `frontend/lib/hooks/useExpenses.ts` | React Query hook สำหรับ expenses CRUD |
| `frontend/lib/hooks/useOCR.ts` | Hook สำหรับ OCR upload state |
| `frontend/components/upload/ReceiptUploader.tsx` | Drag-drop + WebP compress + OCR + preview + confirm |
| `frontend/components/upload/OCRResultPreview.tsx` | Preview แสดงผล OCR ให้ user confirm/edit |
| `frontend/components/expenses/ExpenseList.tsx` | Table: date, merchant, category, amount, actions + pagination + skeleton |
| `frontend/components/expenses/ExpenseFilter.tsx` | Filter bar: date range, category |
| `frontend/components/expenses/CategoryBadge.tsx` | Color pill badge สำหรับ category |
| `frontend/components/dashboard/CategoryBreakdownChart.tsx` | Recharts pie chart (dynamic import) |
| `frontend/components/dashboard/MonthlySummaryChart.tsx` | Recharts bar chart (dynamic import) |
| `frontend/components/ui/button.tsx` | Shadcn-compatible Button |
| `frontend/components/ui/input.tsx` | Input |
| `frontend/components/ui/card.tsx` | Card, CardHeader, CardContent, CardFooter |
| `frontend/components/ui/badge.tsx` | Badge (default/secondary/destructive/outline) |
| `frontend/components/ui/dialog.tsx` | Radix Dialog wrapper |
| `frontend/components/ui/select.tsx` | Radix Select wrapper |
| `frontend/components/ui/toast.tsx` | Radix Toast wrapper |
| `frontend/app/(auth)/login/page.tsx` | Login form (react-hook-form + zod) |
| `frontend/app/(auth)/register/page.tsx` | Register form |
| `frontend/app/(dashboard)/expenses/page.tsx` | Expenses page: ReceiptUploader + ExpenseList |
| `frontend/app/(dashboard)/dashboard/page.tsx` | Dashboard page |
| `frontend/.env.local.example` | `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` |

### Key Frontend Principles ที่ปฏิบัติตาม
- ✅ WebP compression client-side ก่อน upload ทุกครั้ง
- ✅ Dynamic imports สำหรับ Charts (Recharts)
- ✅ Loading states ทุก async operation
- ✅ ไม่มี hardcoded URLs — ใช้ `NEXT_PUBLIC_API_URL`
- ✅ TypeScript typed ทุกที่
| M4: Frontend-Backend Integration | ✅ เสร็จ | |
| M5: Dashboard | ⏳ รอดำเนินการ | |

---

## M4 — Frontend-Backend Integration ✅

### การปรับปรุงที่สำคัญ
- **Alignment:** ปรับจูนฟิลด์วันที่และหมายเหตุให้ตรงกันทั้งระบบโดยใช้ `expense_date` และ `notes` (จากเดิมที่มี `transaction_date` และ `description` ปนอยู่)
- **OCR Endpoint:** แก้ไข `frontend/lib/api/ocr.ts` จาก `/ocr/extract` → `/api/v1/ocr/upload` เพื่อให้ตรงกับ Backend
- **Pagination:** เปลี่ยน `/api/v1/transactions` ให้ใช้ Cursor-based pagination เหมือนกับ `/api/v1/expenses` เพื่อความเป็นมาตรฐาน
- **CORS:** ตรวจสอบแล้วว่า `backend/app/config.py` อนุญาต `http://localhost:3000` โดย default
- **E2E Flow:** ตรวจสอบความสอดคล้องของข้อมูลจาก Receipt Upload → OCR Result → Form Pre-fill → Create Expense

### ไฟล์ที่แก้ไข
| ไฟล์ | การเปลี่ยนแปลง |
|------|---------|
| `frontend/lib/api/ocr.ts` | เปลี่ยน endpoint เป็น `/api/v1/ocr/upload` |
| `backend/app/schemas/ocr.py` | เปลี่ยน `transaction_date` → `expense_date` ใน `OCRUploadResponse` |
| `backend/app/schemas/transaction.py` | เปลี่ยน `transaction_date` → `expense_date` และ `description` → `notes` |
| `backend/app/api/transactions.py` | อัปเกรดเป็น Cursor pagination และใช้ `expense_service` |
| `backend/tests/test_transactions.py` | อัปเดต Assertions ให้รองรับ Cursor pagination และฟิลด์ใหม่ |
| M5: Dashboard | ✅ เสร็จ | |

---

## M5 — Dashboard ✅

### การปรับปรุงที่สำคัญ
- **Summary Cards:** เพิ่มบัตรสรุปข้อมูล (Total spending, Top Category, Month-over-Month trend, Average spending)
- **Real Data Integration:** เชื่อมต่อ API ดึงข้อมูลย้อนหลัง 6 เดือนมาคำนวณและแสดงผลใน Dashboard
- **Responsive Charts:** ใช้ Recharts แสดงผล Monthly Spending (Bar Chart) และ Category Breakdown (Pie Chart) พร้อมรองรับ Mobile/Desktop
- **Performance:** ใช้ Dynamic Imports สำหรับ Charts เพื่อลดขนาด Bundle เริ่มต้น

---

## โครงสร้างไฟล์ปัจจุบัน

```
smart-expense-tracker/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pytest.ini
│   ├── alembic.ini
│   ├── alembic/env.py
│   ├── main.py
│   └── app/
│       ├── api/            transactions.py, auth.py
│       ├── core/           config.py, database.py, redis.py
│       ├── models/         expense.py, user.py, category.py
│       ├── ocr/            base.py, tesseract_server.py, openai_vision.py
│       ├── routers/        auth.py, expenses.py, ocr.py, categories.py, health.py
│       ├── schemas/        transaction.py, user.py, ocr.py, expense.py
│       ├── services/       auth_service.py, ocr_service.py, cache_service.py, expense_service.py
│       └── utils/          image.py
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── types/index.ts
│   ├── lib/
│   │   ├── api.ts          (barrel)
│   │   ├── api/            client.ts, auth.ts, expenses.ts, ocr.ts
│   │   ├── hooks/          useExpenses.ts, useOCR.ts, useDebounce.ts
│   │   └── utils/          imageCompression.ts, formatters.ts, cn.ts
│   ├── components/
│   │   ├── ui/             button, input, card, badge, dialog, select, toast
│   │   ├── upload/         ReceiptUploader.tsx, OCRResultPreview.tsx
│   │   ├── expenses/       ExpenseList.tsx, ExpenseFilter.tsx, CategoryBadge.tsx
│   │   ├── dashboard/      CategoryBreakdownChart.tsx, MonthlySummaryChart.tsx
│   │   └── layout/         Providers.tsx
│   └── app/
│       ├── layout.tsx
│       ├── (auth)/         login/, register/
│       └── (dashboard)/    expenses/, dashboard/, categories/
└── tests/
    ├── conftest.py
    ├── test_auth.py         (13 tests)
    └── test_transactions.py (26 tests)
```
