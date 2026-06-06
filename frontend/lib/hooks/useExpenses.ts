"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getCategories,
  createCategory,
  updateExpenseItem,
} from "@/lib/api/expenses";
import type {
  ExpenseFilters,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseItemUpdate,
} from "@/types";

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ["expenses", filters] as const,
    queryFn: () => getExpenses(filters),
    staleTime: 60_000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => createExpense(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdate }) =>
      updateExpense(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpenseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      itemId,
      data,
    }: {
      expenseId: string;
      itemId: string;
      data: ExpenseItemUpdate;
    }) => updateExpenseItem(expenseId, itemId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"] as const,
    queryFn: getCategories,
    staleTime: 5 * 60_000, // categories change infrequently
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, icon }: { name: string; color: string; icon?: string | null }) =>
      createCategory(name, color, icon),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
