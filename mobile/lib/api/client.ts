/**
 * HTTP client for NALTF mobile API.
 * Handles base URL, auth header, and token refresh on 401.
 * Extend with new endpoints in lib/api/endpoints/ as needed.
 */

import { getApiUrl } from "@/constants/env";
import { getToken, setToken, clearToken } from "@/store/auth";

type RequestConfig = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

async function request<T>(
  path: string,
  options: RequestConfig = {}
): Promise<T> {
  const { params, skipAuth = false, ...init } = options;
  let url = getApiUrl(path);
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") search.set(k, String(v));
    });
    const q = search.toString();
    if (q) url += (url.includes("?") ? "&" : "?") + q;
  }

  const token = skipAuth ? null : await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshTokenAndRetry(path, options);
    if (refreshed !== null) return refreshed as T;
    clearToken();
    throw new ApiError(401, data?.message ?? "Unauthorized", data);
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Request failed", data);
  }

  return data as T;
}

async function refreshTokenAndRetry(
  path: string,
  options: RequestConfig
): Promise<unknown> {
  const refreshToken = await getToken();
  if (!refreshToken) return null;
  try {
    const url = getApiUrl("/token/refresh");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.token) {
      await setToken(data.data.token);
      return request(path, { ...options, skipAuth: false });
    }
  } catch {
    // ignore
  }
  return null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  get: <T>(path: string, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "GET" }),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { ...config, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};
