import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestPath = originalRequest?.url || "";
    const isPublicAuthRoute =
      requestPath.includes("/auth/signup") ||
      requestPath.includes("/auth/login") ||
      requestPath.includes("/auth/forgot-password") ||
      requestPath.includes("/auth/reset-password") ||
      requestPath.includes("/auth/verify-email") ||
      requestPath.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthRoute) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data?.data?.accessToken) {
          localStorage.setItem("accessToken", response.data.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          if (!window.location.pathname.startsWith("/auth")) {
            window.location.href = "/auth/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
