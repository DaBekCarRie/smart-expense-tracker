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
  icon: string | null;
}

export interface Expense {
  id: string;
  user_id: string;
  merchant: string;
  amount: number; // Decimal serialized as string from backend — parse on receipt
  currency: string;
  expense_date: string; // ISO date string
  notes: string | null;
  receipt_url: string | null;
  ocr_raw: Record<string, unknown> | null;
  ocr_confidence: number | null;
  created_at: string;
  items?: ExpenseItemOut[];
}

export interface OCRItem {
  name: string;
  quantity: number;
  unit: string | null;
  price: number | null;
  unit_price: number | null;
  category?: string | null;
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
  receipt_url?: string | null;
  items?: OCRItem[];
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

export interface ExpenseItemCreate {
  name: string;
  quantity: number;
  unit: string | null;
  price: number;
  unit_price: number;
  expiry_date: string | null;
  category_id?: number | null;
}

export interface ExpenseItemOut {
  id: string;
  expense_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  price: number;
  unit_price: number;
  expiry_date: string | null;
  category_id?: number | null;
  category?: Category;
  has_inventory: boolean;
}

export interface ExpenseCreate {
  merchant: string;
  amount: number;
  currency: string;
  expense_date: string;
  notes?: string | null;
  receipt_url?: string | null;
  items?: ExpenseItemCreate[];
}

export interface ExpenseUpdate {
  merchant?: string;
  amount?: number;
  currency?: string;
  expense_date?: string;
  notes?: string | null;
}

export interface ExpenseItemUpdate {
  name?: string;
  quantity?: number;
  unit?: string | null;
  price?: number;
  unit_price?: number;
  expiry_date?: string | null;
  category_id?: number | null;
}

export interface ExpenseFilters {
  search?: string;
  category_id?: number;
  date_from?: string;
  date_to?: string;
  cursor?: string;
  limit?: number;
}

export interface StockBatch {
  id: string;
  quantity: number;
  expiry_date: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  average_price: number;
  last_price: number;
  current_stock: number;
  min_stock: number | null;
  created_at: string;
  updated_at: string;
  batches: StockBatch[];
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  created_at: string;
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
