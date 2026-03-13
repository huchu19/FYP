const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const ACCESS_TOKEN_KEY = "edunexus_access_token";

function inBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!inBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (!inBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (!inBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function withAuthHeaders(extraHeaders = {}) {
  const token = getAccessToken();
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function toError(res, method, path) {
  let detail = `${method} ${path} failed with ${res.status}`;
  try {
    const body = await res.json();
    if (body?.detail) detail = `${detail}: ${body.detail}`;
  } catch (_) {
    // ignore JSON parse failure and use generic message
  }
  const error = new Error(detail);
  error.status = res.status;
  return error;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: withAuthHeaders(),
  });
  if (!res.ok) throw await toError(res, "GET", path);
  return res.json();
}

export async function apiPost(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw await toError(res, "POST", path);
  return res.json();
}

export async function apiPut(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw await toError(res, "PUT", path);
  return res.json();
}

export async function apiPatch(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) throw await toError(res, "PATCH", path);
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: withAuthHeaders(),
  });
  if (!res.ok) throw await toError(res, "DELETE", path);
  if (res.status === 204) return null;
  return res.json();
}
