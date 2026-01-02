import { API_BASE_URL } from "../config/env.js";

const withTrailingSlash = (base) => (base.endsWith("/") ? base : `${base}/`);
const BASE = withTrailingSlash(API_BASE_URL);

const buildUrl = (path, query) => {
  const url = new URL(path.replace(/^\//, ""), BASE);
  if (query) {
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .forEach(([key, value]) => url.searchParams.append(key, value));
  }
  return url.toString();
};

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message = (payload && payload.message) || response.statusText;
    const errors = payload && payload.errors ? payload.errors : undefined;
    const data = payload && payload.data ? payload.data : undefined;
    const requestId = payload && payload.requestId ? payload.requestId : undefined;
    const error = new Error(message || "Request failed");
    error.status = response.status;
    error.errors = errors;
    error.data = data;
    error.requestId = requestId;
    throw error;
  }

  return payload;
}

export async function request(path, { method = "GET", body, query, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const finalHeaders = { ...headers };
  const url = buildUrl(path, query);

  const response = await fetch(url, {
    method,
    credentials: "include", // backend sets cookies for auth
    headers: isForm ? finalHeaders : { "Content-Type": "application/json", ...finalHeaders },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  return handleResponse(response);
}

export const http = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, options) => request(path, { ...options, method: "POST" }),
  patch: (path, options) => request(path, { ...options, method: "PATCH" }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
