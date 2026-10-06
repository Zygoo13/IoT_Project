const TOKEN_STORAGE_KEY = "iot-jwt";

// Lấy JWT và kiểm tra thời hạn
export function getAccessToken() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    return null;
  }

  try {
    const payloadMaHoa = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadMaHoa));

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

  const duLieuTraVe = await response.json().catch(() => null);

  if (response.ok) {
    return duLieuTraVe;
  }

  if (response.status === 401 && path !== "/auth/login") {
    clearAccessToken();
    window.location.replace("/login");
  }

  const error = new Error(duLieuTraVe?.message || `HTTP ${response.status}`);

  error.status = response.status;
  error.code = duLieuTraVe?.code;
  error.requestId = duLieuTraVe?.requestId;

  throw error;
}

// Tạo query string và bỏ qua giá trị trống
export function buildQueryString(parameters) {
  const query = new URLSearchParams();

  for (const [name, value] of Object.entries(parameters)) {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(name, value);
    }
  }

  return query.toString();
}