/**
 * lib/api.ts — unified barrel export for all typed API functions.
 *
 * Consumers can import directly from this file:
 *   import { login, getExpenses, uploadReceipt } from "@/lib/api"
 *
 * The actual implementations live in:
 *   lib/api/auth.ts      — authentication endpoints
 *   lib/api/expenses.ts  — expense & category CRUD
 *   lib/api/ocr.ts       — OCR receipt extraction
 */

// Auth
export { login, register, logout, getMe } from "./api/auth";

// Expenses / Transactions
export {
  getExpenses as getTransactions,
  createExpense as createTransaction,
  updateExpense as updateTransaction,
  deleteExpense as deleteTransaction,
  getCategories,
  createCategory,
} from "./api/expenses";

// Re-export originals under their own names too (avoid breakage)
export {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./api/expenses";

// OCR
export { extractOCR as uploadReceipt, extractOCR } from "./api/ocr";
