import axios, {
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';

let accessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

export const setOnAuthFailure = (callback: () => void) => {
  onAuthFailureCallback = callback;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// One shared refresh operation.
// If refresh is already running, other requests wait for it.
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post<{ accessToken: string; user: unknown }>(
      `${apiClient.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);

        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);