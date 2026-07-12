import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(8, "Password must be at least 8 characters long").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(1, "Password is required"),
  deviceFingerprint: z.string().max(255).optional(),
  deviceName: z.string().max(100).optional(),
  deviceType: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  browser: z.string().max(50).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long").max(100),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  type: z.enum(["MFA", "EMAIL_VERIFICATION", "PASSWORD_RESET"]),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().min(1, "OTP code is required"),
  type: z.enum(["MFA", "EMAIL_VERIFICATION", "PASSWORD_RESET"]),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long").max(100),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().min(1, "Last name is required").max(100).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
});
