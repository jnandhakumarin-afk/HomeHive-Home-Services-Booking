const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, { method = "GET", body, authenticated = true } = {}) {
  const token = authenticated ? sessionStorage.getItem("homehive-token") : null;
  const headers = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError("Could not reach HomeHive. Check that the backend is running.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event("homehive:unauthorized"));
    }

    throw new ApiError(
      data?.message || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}
