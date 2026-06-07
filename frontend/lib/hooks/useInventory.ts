"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustStock,
  autoGenerateShoppingList,
  createShoppingItem,
  deleteProduct,
  deleteShoppingItem,
  getInventory,
  getShoppingList,
  toggleShoppingItem,
  updateMinStock,
} from "@/lib/api/inventory";
import type { Product, ShoppingListItem } from "@/types";

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"] as const,
    queryFn: getInventory,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, change }: { productId: string; change: number }) =>
      adjustStock(productId, change),
    onSuccess: (updated) => {
      queryClient.setQueryData<Product[]>(["inventory"], (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : old
      );
    },
  });
}

export function useUpdateMinStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, minStock }: { productId: string; minStock: number | null }) =>
      updateMinStock(productId, minStock),
    onSuccess: (updated) => {
      queryClient.setQueryData<Product[]>(["inventory"], (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : old
      );
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: (_, productId) => {
      queryClient.setQueryData<Product[]>(["inventory"], (old) =>
        old ? old.filter((p) => p.id !== productId) : old
      );
    },
  });
}

export function useShoppingList() {
  return useQuery({
    queryKey: ["shopping-list"] as const,
    queryFn: getShoppingList,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, quantity, unit }: { name: string; quantity: number; unit: string }) =>
      createShoppingItem(name, quantity, unit),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => toggleShoppingItem(itemId),
    onSuccess: (updated) => {
      queryClient.setQueryData<ShoppingListItem[]>(["shopping-list"], (old) =>
        old ? old.map((i) => (i.id === updated.id ? updated : i)) : old
      );
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteShoppingItem(itemId),
    onSuccess: (_, itemId) => {
      queryClient.setQueryData<ShoppingListItem[]>(["shopping-list"], (old) =>
        old ? old.filter((i) => i.id !== itemId) : old
      );
    },
  });
}

export function useAutoGenerateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: autoGenerateShoppingList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}
