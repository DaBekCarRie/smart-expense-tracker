export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  user_id: string;
  merchant: string;
  amount: number; // Decimal serialized as string from backend — parse on receipt
  currency: string;
  expense_date: string; // ISO date string
  category_id: number | null;
  category?: Category;
  notes: string | null;
  receipt_url: string | null;
  ocr_raw: Record<string, unknown> | null;
  ocr_confidence: number | null;
  created_at: string;
}

export interface OCRResult {
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  expense_date: string | null;
  raw_text: string;
  confidence: number;
  cached: boolean;
  processing_time_ms: number;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ExpenseCreate {
  merchant: string;
  amount: number;
  currency: string;
  expense_date: string;
  category_id?: number | null;
  notes?: string | null;
}

export interface ExpenseUpdate {
  merchant?: string;
  amount?: number;
  currency?: string;
  expense_date?: string;
  category_id?: number | null;
  notes?: string | null;
}

export interface ExpenseFilters {
  search?: string;
  category_id?: number;
  date_from?: string;
  date_to?: string;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Transaction aliases — the backend API surface uses "transaction" terminology.
// These are thin type aliases so both naming conventions are valid throughout.
// ---------------------------------------------------------------------------

/** Alias for Expense — maps to the backend TransactionResponse schema. */
export type Transaction = Expense;

/** Alias for ExpenseCreate — maps to the backend TransactionCreate schema. */
export type TransactionCreate = ExpenseCreate;

/** Alias for ExpenseUpdate — maps to the backend TransactionUpdate schema. */
export type TransactionUpdate = ExpenseUpdate;

/** Alias for CursorPage<Transaction> — maps to TransactionListResponse. */
export type TransactionListResponse = CursorPage<Transaction>;

/** Alias for TokenResponse — maps to the backend AuthToken schema. */
export type AuthToken = TokenResponse;

/** Upload state for the ReceiptUploader component. */
export type UploadState = "idle" | "compressing" | "uploading" | "done" | "error";
