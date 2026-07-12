"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "../services/auth.service";
import type {
  SignupPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "@/types/auth";

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignupPayload) => authService.signup(payload),
    onSuccess: (response) => {
      if (response.success) {
        if (response.data?.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }
        toast.success(response.message || "Account created successfully");
        router.push("/auth/verify-email");
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem("accessToken", response.data.accessToken);
        queryClient.setQueryData(["me"], response.data.user);
        toast.success(response.message || "Login successful");
        router.push("/dashboard");
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      localStorage.removeItem("accessToken");
      queryClient.clear();
      router.push("/auth/login");
    },
  });
}

export function useMe(enabled = true) {
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("accessToken");

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await authService.getMe();
      if (response.success && response.data) {
        return response.data.user;
      }
      throw new Error(response.message || "Failed to fetch user");
    },
    enabled: enabled && hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
    onSuccess: (response) => {
      toast.success(
        response.message || "Password reset link sent to your email"
      );
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      toast.error(message);
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Password reset successful");
      router.push("/auth/login");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message ||
        "Password reset failed. Please try again.";
      toast.error(message);
    },
  });
}

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      authService.verifyEmail(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Email verified successfully");
      router.push("/auth/login");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message =
        error.response?.data?.message ||
        "Email verification failed. Please try again.";
      toast.error(message);
    },
  });
}
