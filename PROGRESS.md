# Smart Expense Tracker — Progress Summary

_Last updated: 2026-06-06_

---

## สถานะ Milestones

| Milestone | สถานะ | หมายเหตุ |
|-----------|-------|---------|
| M1: DB & Backend Skeleton | ✅ เสร็จ + QA ผ่าน | บั้กทั้งหมดแก้แล้ว |
| M2: OCR Pipeline + Redis | ✅ เสร็จ | |
| M3: Frontend Setup + Components | ✅ เสร็จ | |
| M4: Frontend-Backend Integration | ✅ เสร็จ | |
| M5: Dashboard | ✅ เสร็จ | |
| M6: Inventory & Shopping List | ✅ เสร็จ | จัดการคลังวัตถุดิบและรายการของสดที่ต้องซื้อ |
| M8: Mobile Responsiveness | ✅ เสร็จ + QA ผ่าน | ปรับปรุงการแสดงผลและปรับสต็อกบนมือถือ/เดสก์ท็อป |
| Final QA & Polish | ✅ เสร็จ | แก้ไขระบบอัพเดทโปรไฟล์เรียบร้อย |

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
| B8 | MEDIUM | Inconsistent DELETE responses in Categories router | Aligned with Transactions (200 OK + msg) |
| B9 | MEDIUM | Missing Category Edit UI in Frontend | Implemented Edit mode and PUT API call |
| B10 | LOW | Large bundle size due to Lucide icon imports | Optimized imports to specific components |
| B11 | HIGH | SQLAlchemy MissingGreenlet error when saving receipt expenses | Populated items in constructor and explicitly refreshed relationship before serialization |
| B12 | HIGH | TypeError: unhashable type: 'dict' on backend start | Fixed double curly braces syntax in gemini_vision.py |

---

## M2 — OCR Pipeline + Redis ✅

### ไฟล์ที่สร้าง
| ไฟล์ | คำอธิบาย |
|------|---------|
| `backend/app/ocr/base.py` | Abstract `OCRProvider` base class |
| `backend/app/ocr/tesseract_server.py` | `TesseractProvider` — pytesseract ใน thread pool executor (non-blocking) |
| `backend/app/ocr/openai_vision.py` | `OpenAIVisionProvider` — GPT-4o-mini vision, async, graceful fallback |
| `backend/app/services/ocr_service.py` | `OCRService` — Redis cache-before-OCR pipeline, TTL=3600, module-level singleton |
| `backend/app/routers/ocr.py` | `POST /ocr/upload` — validate, compress if >2MB, บันทึกรูป (R2/Disk Local), OCR, return result |
| `backend/app/services/storage_service.py` | บริการบันทึกรูปภาพใบเสร็จเข้า Cloudflare R2 พร้อมระบบ Fallback บันทึกในดิสก์เครื่องหากไม่ได้กำหนด credentials |
| `backend/app/schemas/ocr.py` | `OCRResult`, `OCRUploadResponse` (Pydantic v2) |
| `backend/app/utils/image.py` | `compress_image()`, `md5_hash()`, `validate_image()` |

---

## M3 — Frontend Setup + Components ✅

### Key Frontend Principles ที่ปฏิบัติตาม
- ✅ WebP compression client-side ก่อน upload ทุกครั้ง
- ✅ Dynamic imports สำหรับ Charts (Recharts)
- ✅ Loading states ทุก async operation
- ✅ ไม่มี hardcoded URLs — ใช้ `NEXT_PUBLIC_API_URL`
- ✅ TypeScript typed ทุกที่
- ✅ Optimized Lucide icons (tree-shaking friendly)
- ✅ Mobile-responsive Categories layout
- ✅ Category Editing support

---

## M4 — Frontend-Backend Integration ✅

### การปรับปรุงที่สำคัญ
- **Alignment:** ปรับจูนฟิลด์วันที่และหมายเหตุให้ตรงกันทั้งระบบโดยใช้ `expense_date` และ `notes`
- **OCR Endpoint:** แก้ไข `frontend/lib/api/ocr.ts` จาก `/ocr/extract` → `/api/v1/ocr/upload`
- **Pagination:** เปลี่ยน `/api/v1/transactions` ให้ใช้ Cursor-based pagination เหมือนกับ `/api/v1/expenses`
- **CORS:** ตรวจสอบแล้วว่า `backend/app/config.py` อนุญาต `http://localhost:3000` โดย default
- **Consistency:** เพิ่ม explicit `db.commit()` ในทุก routers เพื่อความแน่นอนในการบันทึกข้อมูล

---

## M5 — Dashboard ✅

### การปรับปรุงที่สำคัญ
- **Summary Cards:** เพิ่มบัตรสรุปข้อมูล (Total spending, Top Category, Month-over-Month trend, Average spending)
- **Real Data Integration:** เชื่อมต่อ API ดึงข้อมูลย้อนหลัง 6 เดือนมาคำนวณและแสดงผลใน Dashboard
- **Responsive Charts:** ใช้ Recharts แสดงผล Monthly Spending (Bar Chart) และ Category Breakdown (Pie Chart)

---

## Final QA & Polish ✅

### การปรับปรุงที่สำคัญ
- **Icon Optimization:** เปลี่ยนการ Import Lucide Icons จาก `*` เป็นแบบเจาะจงเฉพาะตัวที่ใช้ เพื่อลดขนาด Bundle และเพิ่มความเร็วบน Mobile
- **Category Edit:** เพิ่ม UI สำหรับแก้ไขชื่อ สี และไอคอนของหมวดหมู่ (เดิมมีแค่ลบและเพิ่ม)
- **UI Refinement:** ปรับปรุง Layout หน้า Categories ให้เป็น 2 Column บน Desktop และ Stack บน Mobile เพื่อการใช้งานที่สะดวกขึ้น
- **Endpoint Alignment:** ปรับปรุง `delete_category` ให้ส่งค่ากลับเป็น 200 OK พร้อมข้อความแจ้งเตือน เพื่อให้ตรงกับมาตรฐานส่วนอื่นๆ ของระบบ

---

## M6 — Inventory & Shopping List (Back-of-House Stock) ✅

### ไฟล์ที่สร้าง/ปรับปรุง
| ไฟล์ | คำอธิบาย |
|------|---------|
| `backend/app/models/expense_item.py` | เพิ่มฟิลด์ `expiry_date` สำหรับรายการในใบเสร็จ |
| `backend/app/models/product.py` | จัดการราคาเฉลี่ย ราคาล่าสุด และจำนวนสต็อกปัจจุบัน |
| `backend/app/models/stock_batch.py` | บันทึกของสดแบ่งตามล็อตและวันหมดอายุ (FIFO) |
| `backend/app/models/shopping_list.py` | ตารางเก็บรายการของสดที่ต้องซื้อ |
| `frontend/types/index.ts` | เพิ่ม type interfaces สำหรับ Product, StockBatch, ShoppingListItem |
| `frontend/app/(dashboard)/layout.tsx` | เพิ่มปุ่มลิ้งก์เมนู Inventory และ Shopping List พร้อมซ่อน Email ใน Sidebar |
| `frontend/app/(dashboard)/profile/page.tsx` | ซ่อนฟิลด์กรอก Email ออกจากหน้าตั้งค่า |
| `frontend/app/(dashboard)/inventory/page.tsx` | หน้าจัดการสต็อก ปรับสต็อกแบบ FIFO และแสดงสัญญาณเตือนของใกล้หมดอายุ |
| `frontend/app/(dashboard)/shopping/page.tsx` | หน้าลิสต์รายการของสดที่ต้องซื้อ และระบบเพิ่มอัตโนมัติจากสต็อกที่ขาดแคลน |
| `frontend/components/upload/OCRResultPreview.tsx` | ดึงข้อมูลรายการย่อยจาก AI OCR (Gemini) แสดงผลลัพธ์พรีวิวก่อนบันทึก |
| `frontend/app/(dashboard)/expenses/new/page.tsx` | ฟอร์มบันทึกบิลที่สามารถดู แก้ไขรายการย่อย กรอกวันหมดอายุ และปรับหน่วย (Unit) เป็นแบบพิมพ์เองได้ (Custom Dropdown) |
| `frontend/components/expenses/ExpenseList.tsx` | ระบบเปิดดูรายละเอียดประวัติการรับของย้อนหลังแยกรายการย่อยและรูปภาพใบเสร็จ |

---

## M7 — Supabase DB Migration & Agent Skills Integration ✅

### การปรับปรุงที่สำคัญ
- **Supabase Connection & Pools:** ย้ายฐานข้อมูลจาก Render PostgreSQL ไปยัง Supabase Shared Pooler (`aws-1-ap-southeast-2.pooler.supabase.com:6543`)
- **pgBouncer prepared statement fixes:** แก้ไขปัญหาการเชื่อมต่อผ่าน Transaction Pooler (pgBouncer) โดยปิดระบบ prepared statements caching ใน SQLAlchemy และ asyncpg:
  - เพิ่ม `prepared_statement_cache_size=0` ใน connection string query parameters (สำหรับ SQLAlchemy dialect)
  - เพิ่ม `statement_cache_size: 0` ใน `connect_args` (สำหรับ `asyncpg` driver)
  - ปรับปรุงการทำงานทั้งใน [database.py](file:///Users/joja/Development/smart-expense-tracker/backend/app/database.py) และ [env.py](file:///Users/joja/Development/smart-expense-tracker/backend/alembic/env.py) (Alembic Migrations)
- **Alembic Migrations:** รันสคริปต์ย้ายสคีมาข้อมูลขึ้น Supabase ได้ครบถ้วนสมบูรณ์
- **Agent Skills:** ติดตั้ง `@supabase/agent-skills` ได้แก่ `supabase` และ `supabase-postgres-best-practices` เพื่ออำนวยความสะดวกในการพัฒนาและอ้างอิงคู่มือ
- **CRUD Verification:** รันสคริปต์ทดสอบ Create, Read, Update, Delete บนสคีมาจริงใน Supabase ได้ผลลัพธ์ผ่าน 100%
- **Theme-Compliant Skeleton Loaders:** เปลี่ยนระบบสลับหน้าเพจ (Page transition / lazy loading) จากการแสดงผลข้อความและสปินเนอร์หมุนธรรมดา มาเป็น **Skeleton Loaders** ที่เลียนแบบโครงสร้างและ Layout ของแต่ละหน้าเพจจริง:
  - อัปเดตคอมโพเนนต์ [skeleton.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/components/ui/skeleton.tsx) ให้ทำงานร่วมกับดีไซน์กระดาษยับและขยับได้ในธีม Doodle ผ่านคลาส `.skel-sketch` (มีเอฟเฟกต์สีครีมเหลือบชิมเมอร์และขอบหยักลายเส้นเขียนมือ)
  - เพิ่มคอมโพเนนต์โหลดล่วงหน้าเฉพาะเพจ `loading.tsx` ในทุกๆ เส้นทางหลัก: [dashboard/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/dashboard/loading.tsx), [expenses/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/expenses/loading.tsx), [categories/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/categories/loading.tsx), [inventory/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/inventory/loading.tsx), [shopping/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/shopping/loading.tsx), [profile/loading.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/profile/loading.tsx)
  - ปรับปรุงการตรวจสอบสถานะโหลดดั้งเดิม (ที่เคยเป็นข้อความ `✏️ กำลังโหลด...` กะพริบ) ในหน้า [inventory/page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/inventory/page.tsx), [shopping/page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/shopping/page.tsx), และ [profile/page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(dashboard)/profile/page.tsx) ให้ใช้ skeleton layouts ทั้งหมด
  - เพิ่มอนิเมชัน `fadeIn` (การค่อยๆ ปรากฏขึ้น) และ `bounce-slow` (การกระเด้งเบาๆ) เข้าไปใน [globals.css](file:///Users/joja/Development/smart-expense-tracker/frontend/app/globals.css) เพื่อรองรับการเคลื่อนไหวที่นุ่มนวลและไม่ขัดสายตา
- **Shopping Auto-Generate & Toast Improvements:**
  - เปลี่ยนจากการใช้หน้าต่างแจ้งเตือนดั้งเดิม (`alert()`) มาใช้ **Custom Doodle Toast Notification** ที่แสดงมุมล่างขวาของจอ มีสีสันพาสเทลตามประเภท (เขียวสำหรับสำเร็จ, แดงสำหรับผิดพลาด, ฟ้าสำหรับข้อความแจ้งบอก)
  - เพิ่มคำอธิบายการทำงานของปุ่มสั่งผลิตอัตโนมัติ (`shoppingAutoGenerateDetail`) ด้านล่างปุ่ม เพื่อชี้แจงอย่างชัดเจนว่าระบบทำงานอย่างไร (ตรวจหาของสต็อกเหลือน้อยกว่าค่าต่ำสุด แล้วแอดเพิ่มเข้ามาตามจำนวนที่ขาด)
  - ปรับคำแปลภาษาไทยและอังกฤษให้มีหัวเรื่องและรายละเอียดที่อบอุ่นเป็นกันเอง (เช่น "Stock is Sufficient!" / "วัตถุดิบมีเพียงพอ!")

---

## M8 — Mobile Responsiveness Improvements ✅

### การปรับปรุงที่สำคัญ
- **แปลงตาราง Desktop เป็นการ์ด Mobile (Table to Card conversion):**
  - **หน้าประวัติค่าใช้จ่าย (Expense List Component):** ซ่อนตารางแบบ Desktop เมื่อเปิดบนหน้าจอมือถือ (`hidden md:block`) และแสดงรายการเป็นรูปแบบการ์ดที่เหมาะกับขนาดหน้าจอมือถือแทน (`block md:hidden`)
  - **หน้าสต็อกสินค้าคงคลัง (Inventory Page):** ปรับปรุงหน้าแสดงรายการของสดและเครื่องดื่ม จากตารางขนาดกว้างที่มีหลายคอลัมน์ มาเป็นการ์ดดีไซน์กระดาษยับพาสเทลบนมือถือ โดยจัดแสดงข้อมูลชื่อวัตถุดิบ สัญญาณเตือนของใกล้หมดอายุ/หมดอายุ ปริมาณคงเหลือและค่าขั้นต่ำอย่างชัดเจน พร้อมปุ่มสำหรับกดปรับเพิ่ม/ลดปริมาณสต็อกที่กดง่ายด้วยนิ้วมือ (Touch targets ขนาด 44px x 44px) และระบบแสดงล็อต (Batches) แบบยุบ/ขยายได้ (Collapsible Accordion)
  - **หน้ารายการย่อยในบิลค่าใช้จ่ายใหม่ (New Expense Line Items):** ปรับแก้ส่วนกรอกรายการย่อยจากตารางเลื่อนแนวนอนกว้าง 860px (ที่เคยตกขอบจอ) เป็นการ์ดป้อนข้อมูลแนวตั้งแบบเรียงซ้อนกันบนมือถือ ที่มีช่องกรอกชื่อ ปริมาณและหน่วย (พร้อมตัวช่วยเลือก Unit), ราคาต่อชิ้น, ราคารวม, วันหมดอายุ และเลือกหมวดหมู่ที่เหมาะสม
- **จัดเลย์เอาต์จัดวางองค์ประกอบให้สมดุลบนจอใหญ่ (Desktop Side-by-Side Grid):**
  - **หน้าจดรายการของสดที่ต้องซื้อ (Shopping List Page):** เปลี่ยนการเรียงตัวของการ์ดจากแนวตั้งทั้งหมดมาใช้โครงสร้าง Grid ระบบ 12 ช่อง (`grid-cols-1 lg:grid-cols-12`) บนจอเดสก์ท็อปขนาดใหญ่ โดยแบ่งเป็นหน้าต่างเพิ่มรายการของสดแบบแมนนวล (`lg:col-span-5`) และหน้าต่างเช็คลิสต์รายการของสดที่ต้องซื้อ (`lg:col-span-7`) อยู่เคียงคู่ขนานกัน แทนที่จะยืดเต็มจอกว้างแล้วเรียงแนวตั้ง เพื่อความประหยัดเนื้อที่และการใช้สอยจอภาพที่มีประสิทธิภาพสูงขึ้น
- **ความปลอดภัยของระบบและการตรวจสอบ (Build Validation):**
  - รันคำสั่งตรวจสอบชนิดตัวแปรและรูปแบบโค้ด TypeScript ด้วย `npx tsc --noEmit` ทั้งโครงการ ได้ผลลัพธ์ผ่านสมบูรณ์ 100% ปราศจากบั๊ก Syntax ใดๆ

---

## Root Route & Auth Pages Redirect Improvements ✅

### การปรับปรุงที่สำคัญ
- **Root Route Authentication Check:** ปรับปรุงหน้าแรก [page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/page.tsx) จากที่เคยทำการ Redirect ไปที่ `/dashboard` โดยตรง ให้เป็นการตรวจสอบสถานะการเข้าสู่ระบบผ่าน endpoint `/api/v1/auth/me` ก่อน:
  - หากตรวจสอบแล้วพบว่าล็อกอินอยู่ (Authenticated) จะทำการเปลี่ยนเส้นทางไปหน้า Dashboard (`/dashboard`)
  - หากยังไม่ได้ล็อกอิน (Not Authenticated) จะทำการเปลี่ยนเส้นทางไปหน้า Login (`/login`)
  - ในระหว่างทำการตรวจสอบ จะแสดงหน้าโหลด SkeletonOverlay เพื่อความราบรื่นและสวยงามตามธีมของระบบ
- **Redirect Logged-in Users from Login & Register Pages:** ปรับปรุงหน้า [login/page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(auth)/login/page.tsx) และ [register/page.tsx](file:///Users/joja/Development/smart-expense-tracker/frontend/app/(auth)/register/page.tsx) ให้มีการตรวจสอบสถานะของเซสชัน:
  - หากตรวจพบว่าผู้ใช้ทำการล็อกอินอยู่แล้ว จะทำการเปลี่ยนเส้นทางไปยังหน้าแดชบอร์ด (`/dashboard`) โดยอัตโนมัติ เพื่อไม่ให้ต้องเห็นฟอร์มล็อกอิน/สมัครซ้ำ
  - ปรับปรุง Axios interceptor ใน [client.ts](file:///Users/joja/Development/smart-expense-tracker/frontend/lib/api/client.ts) เพื่อหลีกเลี่ยงการทำ infinite redirect loops บนหน้าที่เป็นหมวดหมู่ Auth (เช่น `/login`, `/register`, `/forgot-password`, `/reset-password`) และปิดการพยายาม Refresh โทเค็นโดยไม่จำเป็นเมื่อ API หน้าดังกล่าวส่งผลลัพธ์ไม่ผ่านกลับมา (401)
