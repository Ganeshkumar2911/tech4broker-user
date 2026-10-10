import axios from "axios";
import authToken from "../common/authToken";
import router from "../router";
import { useTourStore } from "@/stores/shared/tour";

// ─── Constants

const getBaseURL = (overrideRole = null) => {
  const customBaseUrl = localStorage.getItem("custom_base_url");
  const role = overrideRole || localStorage.getItem("role") || "client";

  if (import.meta.env.DEV) {
    return `/api/${role}/`;
  }

  if (customBaseUrl && customBaseUrl.trim()) {
    let cleanUrl = customBaseUrl.trim().replace(/\/+$/, "");
    cleanUrl = cleanUrl.replace(/\/(client|fm|ib|admin)$/, "");
    return `${cleanUrl}/${role}/`;
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    let cleanUrl = envUrl.trim().replace(/\/+$/, "");
    cleanUrl = cleanUrl.replace(/\/(client|fm|ib|admin)$/, "");
    return `${cleanUrl}/${role}/`;
  }

  return `https://portal.panthercapitals.com/${role}/`;
};

const DEFAULT_TIMEOUT = 2 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRYABLE_STATUS_CODES = [502, 503, 504];
const NO_BODY_METHODS = ["get", "delete", "head", "options"];
const ALLOWED_METHODS = ["get", "post", "patch", "put", "delete"];

// ─── Request Deduplication (takeLatest)

const pendingRequests = new Map();

const generateRequestKey = (method, url) => {
  return `${method.toUpperCase()}:${url}`;
};

const cancelPreviousRequest = (requestKey) => {
  const existing = pendingRequests.get(requestKey);
  if (existing) {
    existing.abortController.abort();
  }
};

const cleanupRequest = (requestKey, controller) => {
  const current = pendingRequests.get(requestKey);

  if (current?.abortController === controller) {
    pendingRequests.delete(requestKey);
  }
};

// ─── Axios Instance

const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT,
});

// ─── Request Interceptor

const FM_ID_EXCLUDED_PATHS = [
  "/strategies",
  "/strategies/requests",
  "/request",
  "/login",
  "/register",
  "/profile",
  "/set-tour",
  "/update-profile",
  "/landing-images",
  "/kyc/init",
  "/change_password",
  "/auth/signup",
  "/email/verify",
  "/signup/resend-otp",
  "/forgot-password",
  "/reset-password",
];

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.isTokenRequired !== false) {
      const { accessToken } = authToken.getToken();
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    // ── Multi-Strategy FM ID Auto-Injection ─────────────────────────
    const currentRole = localStorage.getItem("role") || "client";
    const isFmRequest =
      config.role === "fm" ||
      currentRole === "fm" ||
      (typeof config.url === "string" && config.url.startsWith("/fm/")) ||
      (typeof config.baseURL === "string" && config.baseURL.includes("/fm/"));

    if (isFmRequest) {
      const urlPath =
        typeof config.url === "string"
          ? config.url.split("?")[0].replace(/\/+$/, "")
          : "";
      const isExcluded = FM_ID_EXCLUDED_PATHS.some(
        (path) => urlPath === path || urlPath.endsWith(path),
      );

      if (!isExcluded) {
        const activeFmId = Number(
          localStorage.getItem("fm_active_strategy_id"),
        );
        if (activeFmId && !isNaN(activeFmId)) {
          // 1. GET / DELETE / HEAD -> Inject into params
          if (NO_BODY_METHODS.includes(config.method?.toLowerCase())) {
            config.params = config.params || {};
            if (config.params.fm_id === undefined) {
              config.params.fm_id = activeFmId;
            }
          } else {
            // 2. POST / PUT / PATCH -> Inject into body / formData
            if (config.data instanceof FormData) {
              if (!config.data.has("fm_id")) {
                config.data.append("fm_id", activeFmId);
              }
            } else if (
              config.data &&
              typeof config.data === "object" &&
              !Array.isArray(config.data)
            ) {
              if (config.data.fm_id === undefined) {
                config.data.fm_id = activeFmId;
              }
            }
          }
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ── 401: logout (bypass for 2FA setup/confirm/verify/login endpoints)
    if (error.response?.status === 401) {
      const url = String(originalRequest?.url || "");
      const is2faAuthUrl =
        url.includes("/2fa/") ||
        url.includes("/login/verify-2fa") ||
        url.includes("/login");
      const skipAuthRedirect = originalRequest?.skipAuthRedirect || is2faAuthUrl;

      if (!skipAuthRedirect) {
        try {
          useTourStore().stopTour();
        } catch (e) {}
        authToken.removeToken();
        localStorage.removeItem("role");
        sessionStorage.clear();
        router.push({ name: "login" });
      }
      return Promise.reject(error);
    }

    // ── Retry on transient server errors
    const shouldRetry =
      RETRYABLE_STATUS_CODES.includes(error.response?.status) &&
      (originalRequest._retryCount ?? 0) < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      const delay = 300 * originalRequest._retryCount;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(originalRequest);
    }

    handleError(error);
    return Promise.reject(error);
  },
);

// ─── Global Error Handler
const handleError = (error) => {
  // Cancelled request — not an error
  if (error.code === "ERR_CANCELED") {
    console.warn("Request cancelled:", error.message);
    return;
  }

  // Network / no-response errors
  if (!error.response) {
    console.error("Network error:", error.message || "Unknown network error");
    return;
  }

  const { status, statusText, data } = error.response;

  switch (status) {
    case 404:
      console.error(`Not found (404): ${error.config?.url}`);
      break;

    case 500:
    case 502:
    case 503:
      console.error(`Server error (${status}): ${statusText}`);
      break;

    default: {
      const message = data?.message;

      if (!message) {
        console.error("Unexpected error occurred");
        return;
      }

      // Validation errors come as { field: string[] }
      if (typeof message === "object") {
        Object.entries(message).forEach(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [messages];
          msgs.forEach((msg) => console.error(`Validation [${field}]:`, msg));
        });
      } else {
        console.error("API error:", message);
      }
    }
  }
};

// ─── apiRequest
const apiRequest = (
  method,
  url,
  {
    headers = {},
    params = {},
    data = {},
    formData = null,
    look_up_key = null,
    onSuccess = null,
    onFailure = null,
    onFinally = null,
    responseType = "json",
    onUploadProgress = null,
    onDownloadProgress = null,
    isTokenRequired = true,
    signal = null,
    timeout = null,
    cancelPrevious = false,
    skipAuthRedirect = false,
    role = null,
    baseURL = null,
  } = {},
) => {
  if (!ALLOWED_METHODS.includes(method)) {
    throw new Error(
      `Method "${method}" is not allowed. Use one of: ${ALLOWED_METHODS.join(", ")}`,
    );
  }
  if (!url) {
    throw new Error("URL is required");
  }
  if (look_up_key !== null && look_up_key !== undefined) {
    url = `${url.replace(/\/$/, "")}/${look_up_key}`;
  }

  let abortController = null;
  let requestKey = null;

  if (cancelPrevious) {
    requestKey = generateRequestKey(method, url);
    abortController = new AbortController();
    cancelPreviousRequest(requestKey);
    pendingRequests.set(requestKey, { abortController });
  }

  let requestData = data;
  const requestHeaders = { ...headers };

  if (formData) {
    if (formData instanceof FormData) {
      requestData = formData;
    } else if (typeof formData === "object") {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          fd.append(key, val);
        }
      });
      requestData = fd;
    } else if (formData === true && data instanceof FormData) {
      requestData = data;
    } else if (formData === true && typeof data === "object") {
      const fd = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          fd.append(key, val);
        }
      });
      requestData = fd;
    }
    // Do NOT manually set Content-Type for FormData — the browser/axios
    // will set it automatically with the correct multipart boundary.
    delete requestHeaders["Content-Type"];
  }

  const config = {
    method,
    url,
    headers: requestHeaders,
    params,
    responseType,
    onUploadProgress,
    onDownloadProgress,
    isTokenRequired,
    skipAuthRedirect,
    baseURL: baseURL || getBaseURL(role),
    signal: abortController?.signal || signal,
    role,
    ...(timeout != null && { timeout }),
  };

  // Do not send a body for methods that don't support it
  if (!NO_BODY_METHODS.includes(method)) {
    config.data = requestData;
  }
  return axiosInstance(config)
    .then((response) => {
      if (onSuccess) onSuccess(response.data);
      return response.data;
    })
    .catch((error) => {
      if (error.code === "ERR_CANCELED") {
        console.warn("Request cancelled:", error.message);
        throw error;
      }

      if (onFailure) {
        onFailure(error.response?.data ?? error);
        return;
      }

      throw error;
    })
    .finally(() => {
      if (requestKey) {
        cleanupRequest(requestKey, abortController);
      }

      if (onFinally) onFinally();
    });
};

export { axiosInstance };
export default apiRequest;
