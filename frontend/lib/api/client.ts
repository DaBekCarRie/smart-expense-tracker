import axios from "axios";

const TOKEN_KEY = "expense_tracker_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach stored token as Authorization header.
// Required for Safari / Incognito where cross-origin (third-party) cookies are blocked by ITP.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

function drainQueue(ok: boolean) {
  refreshQueue.forEach((resolve) => resolve(ok));
  refreshQueue = [];
}

// On 401: attempt silent token refresh once, then retry. Redirect to login only on double-401.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      typeof window === "undefined" ||
      !axios.isAxiosError(error) ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    if (!originalRequest || originalRequest.url?.includes("/auth/refresh") || originalRequest._retried) {
      clearStoredToken();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((ok) => {
          if (ok) resolve(apiClient(originalRequest));
          else reject(error);
        });
      });
    }

    isRefreshing = true;
    originalRequest._retried = true;

    try {
      const res = await apiClient.post("/api/v1/auth/refresh");
      const newToken = res.data?.access_token;
      if (newToken) setStoredToken(newToken);
      drainQueue(true);
      return apiClient(originalRequest!);
    } catch {
      drainQueue(false);
      clearStoredToken();
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
