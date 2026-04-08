const defaultBase = "http://localhost:8000/api/v1";

export const getApiBase = () => localStorage.getItem("omnisocial_base_url") || defaultBase;

export const setApiBase = (baseUrl) => {
  localStorage.setItem("omnisocial_base_url", baseUrl);
};

export const setToken = (token) => {
  localStorage.setItem("omnisocial_access_token", token || "");
};

export const getToken = () => localStorage.getItem("omnisocial_access_token") || "";

export const clearToken = () => localStorage.removeItem("omnisocial_access_token");

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_err) {
    return { raw: text };
  }
};

export const apiRequest = async ({ baseUrl, path, method = "GET", token, bodyType = "json", body, headers = {} }) => {
  const requestHeaders = { ...headers };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let requestBody;
  if (bodyType === "json" && body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }
  if (bodyType === "multipart" && body !== undefined) {
    requestBody = body;
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    method,
    headers: requestHeaders,
    credentials: "include",
    body: requestBody,
  });

  const payload = await parseBody(response);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
};
