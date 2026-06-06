import apiClient from "./client";
import type { Product, ShoppingListItem } from "@/types";

// Inventory APIs
export async function getInventory(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>("/api/v1/inventory");
  return response.data;
}

export async function adjustStock(
  productId: string,
  quantityChange: number
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/api/v1/inventory/${productId}/adjust`,
    { quantity_change: quantityChange }
  );
  return response.data;
}

export async function updateMinStock(
  productId: string,
  minStock: number | null
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/api/v1/inventory/${productId}/min-stock`,
    { min_stock: minStock }
  );
  return response.data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiClient.delete(`/api/v1/inventory/${productId}`);
}

// Shopping List APIs
export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const response = await apiClient.get<ShoppingListItem[]>("/api/v1/shopping-list");
  return response.data;
}

export async function createShoppingItem(
  name: string,
  quantity: number,
  unit: string
): Promise<ShoppingListItem> {
  const response = await apiClient.post<ShoppingListItem>("/api/v1/shopping-list", {
    name,
    quantity,
    unit,
  });
  return response.data;
}

export async function toggleShoppingItem(itemId: string): Promise<ShoppingListItem> {
  const response = await apiClient.put<ShoppingListItem>(
    `/api/v1/shopping-list/${itemId}/toggle`
  );
  return response.data;
}

export async function deleteShoppingItem(itemId: string): Promise<void> {
  await apiClient.delete(`/api/v1/shopping-list/${itemId}`);
}

export async function autoGenerateShoppingList(): Promise<ShoppingListItem[]> {
  const response = await apiClient.post<ShoppingListItem[]>(
    "/api/v1/shopping-list/auto-generate"
  );
  return response.data;
}
