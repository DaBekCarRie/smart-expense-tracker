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

export async function updateProfile(data: {
  name?: string;
  current_password?: string;
  new_password?: string;
}): Promise<User> {
  const response = await apiClient.put<User>("/api/v1/auth/profile", data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/api/v1/auth/forgot-password", { email });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  await apiClient.post("/api/v1/auth/reset-password", {
    token,
    new_password: newPassword,
  });
}

