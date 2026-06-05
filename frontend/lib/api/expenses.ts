import apiClient from "./client";
import type {
  CursorPage,
  Expense,
  ExpenseCreate,
  ExpenseFilters,
  ExpenseUpdate,
  Category,
} from "@/types";

export async function getExpenses(
  filters?: ExpenseFilters
): Promise<CursorPage<Expense>> {
  const response = await apiClient.get<CursorPage<Expense>>(
    "/api/v1/expenses",
    { params: filters }
  );
  // Backend serialises Decimal as string — normalise amount to number
  return {
    ...response.data,
    items: response.data.items.map((e) => ({
      ...e,
      amount: typeof e.amount === "string" ? parseFloat(e.amount) : e.amount,
    })),
  };
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  const response = await apiClient.post<Expense>("/api/v1/expenses", data);
  const e = response.data;
  return {
    ...e,
    amount: typeof e.amount === "string" ? parseFloat(e.amount) : e.amount,
  };
}

export async function updateExpense(
  id: string,
  data: ExpenseUpdate
): Promise<Expense> {
  const response = await apiClient.put<Expense>(`/api/v1/expenses/${id}`, data);
  const e = response.data;
  return {
    ...e,
    amount: typeof e.amount === "string" ? parseFloat(e.amount) : e.amount,
  };
}

export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/expenses/${id}`);
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>("/api/v1/categories");
  return response.data;
}

export async function createCategory(
  name: string,
  color: string,
  icon?: string | null
): Promise<Category> {
  const response = await apiClient.post<Category>("/api/v1/categories", {
    name,
    color,
    icon,
  });
  return response.data;
}
