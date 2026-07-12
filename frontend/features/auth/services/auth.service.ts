import apiClient from "@/lib/api-client";
import type {
  LoginData,
  SignupPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  User,
} from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export const authService = {
  async signup(payload: SignupPayload): Promise<ApiResponse<LoginData>> {
    const { data } = await apiClient.post<ApiResponse<LoginData>>(
      "/auth/signup",
      payload
    );
    return data;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<LoginData>> {
    const { data } = await apiClient.post<ApiResponse<LoginData>>(
      "/auth/login",
      payload
    );
    return data;
  },

  async logout(): Promise<ApiResponse> {
    const { data } = await apiClient.post<ApiResponse>("/auth/logout");
    return data;
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>(
      "/auth/me"
    );
    return data;
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh"
    );
    return data;
  },

  async forgotPassword(
    payload: ForgotPasswordPayload
  ): Promise<ApiResponse> {
    const { data } = await apiClient.post<ApiResponse>(
      "/auth/forgot-password",
      payload
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordPayload
  ): Promise<ApiResponse> {
    const { data } = await apiClient.post<ApiResponse>(
      "/auth/reset-password",
      payload
    );
    return data;
  },

  async verifyEmail(
    payload: VerifyEmailPayload
  ): Promise<ApiResponse> {
    const { data } = await apiClient.post<ApiResponse>(
      "/auth/verify-email",
      payload
    );
    return data;
  },
};
