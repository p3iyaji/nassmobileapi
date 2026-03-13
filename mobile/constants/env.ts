/**
 * API and app configuration.
 * Set EXPO_PUBLIC_API_BASE in .env or app.config.js for different environments.
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8000/api";
export const config = {
  apiBaseUrl: API_BASE.replace(/\/$/, ""),
  apiVersion: "v1",
} as const;

export const getApiUrl = (path: string) =>
  `${config.apiBaseUrl}/${config.apiVersion}${path.startsWith("/") ? path : `/${path}`}`;
