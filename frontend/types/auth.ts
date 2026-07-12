export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  roles?: UserRole[];
  employeeProfile?: EmployeeProfile;
}

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "LOCKED"
  | "PENDING_VERIFICATION";

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  type: string;
  isDefault: boolean;
}

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  jobTitle?: string;
  departmentId?: string;
  department?: Department;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginData {
  user: User;
  accessToken: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}
