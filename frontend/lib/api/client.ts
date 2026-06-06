import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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

    // No config (e.g. network error) or refresh endpoint itself — go straight to login
    if (!originalRequest || originalRequest.url?.includes("/auth/refresh") || originalRequest._retried) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it
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
      await apiClient.post("/api/v1/auth/refresh");
      drainQueue(true);
      return apiClient(originalRequest!);
    } catch {
      drainQueue(false);
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
