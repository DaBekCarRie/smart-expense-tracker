import apiClient from "./client";
import type { TokenResponse, User } from "@/types";

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/api/v1/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function register(
  email: string,
  name: string,
  password: string
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/api/v1/auth/register",
    { email, name, password }
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/api/v1/auth/logout");
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>("/api/v1/auth/me");
  return response.data;
}
