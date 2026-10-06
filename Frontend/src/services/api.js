const TOKEN_STORAGE_KEY = "iot-jwt";

// Lấy JWT hiện tại và loại bỏ token đã hết hạn
export function getAccessToken() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    return null;
  }

  try {
    const encodedPayload = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(atob(encodedPayload));

    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      clearAccessToken();
      return null;
    }

    return token;
  } catch {
    clearAccessToken();
    return null;
  }
}

export function saveAccessToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Gọi REST API kèm JWT
export async function requestApi(path, options = {}) {
  const token = getAccessToken();
  const headers = {};

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  Object.assign(headers, options.headers);

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const responseBody = await response.json().catch(() => null);

  if (response.ok) {
    return responseBody;
  }

  if (response.status === 401 && path !== "/auth/login") {
    clearAccessToken();
    window.location.replace("/login");
  }

  const error = new Error(
    responseBody?.message || `HTTP ${response.status}`,
  );

  error.status = response.status;
  error.code = responseBody?.code;
  error.requestId = responseBody?.requestId;

  throw error;
}

// Tạo query string và bỏ qua giá trị trống
export function buildQueryString(parameters) {
  const searchParameters = new URLSearchParams();

  for (const [name, value] of Object.entries(parameters)) {
    if (value !== "" && value !== null && value !== undefined) {
      searchParameters.set(name, value);
    }
  }

  return searchParameters.toString();
}