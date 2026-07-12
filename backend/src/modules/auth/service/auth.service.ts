import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { UserStatus, PriorityLevel } from "@prisma/client";
import { prisma } from "../../../config/prisma";
import { AuthRepository } from "../repository/auth.repository";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { Mailer } from "../../../utils/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "assetflow_super_secret_jwt_sign_key_2026_change_me_in_prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "assetflow_super_secret_jwt_refresh_key_2026_change_me_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  private repository = new AuthRepository();

  public async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.repository.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.repository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      status: UserStatus.PENDING_VERIFICATION,
    });

    // 1. Generate Email Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.repository.createEmailVerification({
      userId: user.id,
      tokenHash,
      email: user.email,
      expiresAt,
    });

    // 2. Log Activity & Trigger Notifications
    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId: user.id,
      action: "USER_SIGNUP",
      entityType: "User",
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`,
    });

    await NotificationTrigger.onUserCreated(user.id, user.email);

    // Normally send registration verification email here...
    console.log(`[Email Mock]: Email verification token for ${user.email}: ${verificationToken}`);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    };
  }

  public async login(
    data: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user) {
      await this.repository.createLoginHistory({
        emailAttempted: data.email,
        success: false,
        failureReason: "User not found",
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    // Check Account status
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new ForbiddenError(`Your account is ${user.status.toLowerCase()}. Contact administration.`);
    }

    if (user.status === UserStatus.LOCKED) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new ForbiddenError(`Account is temporarily locked. Try again in ${remainingMinutes} minutes.`);
      } else {
        // Unlock account if lockout expired
        await this.repository.resetFailedLogin(user.id);
        user.status = UserStatus.ACTIVE;
      }
    }

    // Verify Password
    const passwordMatch = user.passwordHash ? await bcrypt.compare(data.password, user.passwordHash) : false;
    if (!passwordMatch) {
      const updatedUser = await this.repository.incrementFailedLogin(user.id, user.failedLoginCount, MAX_FAILED_ATTEMPTS);
      
      await this.repository.createLoginHistory({
        userId: user.id,
        emailAttempted: data.email,
        success: false,
        failureReason: updatedUser.status === UserStatus.LOCKED ? "Account Locked" : "Incorrect password",
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedError("Invalid email or password");
    }

    // Reset failed login counts on success
    await this.repository.resetFailedLogin(user.id);

    // Update login timestamps
    await this.repository.updateUser(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    // Handle Device Fingerprinting and notifications
    const fingerprint = data.deviceFingerprint || crypto.createHash("md5").update(userAgent || "unknown").digest("hex");
    const existingDevice = await this.repository.findDeviceHistory(user.id, fingerprint);

    if (!existingDevice) {
      await this.repository.createDeviceHistory({
        userId: user.id,
        deviceFingerprint: fingerprint,
        deviceName: data.deviceName || "Unknown Device",
        deviceType: data.deviceType || "Desktop",
        os: data.os || "Unknown OS",
        browser: data.browser || "Unknown Browser",
        isTrusted: false,
      });

      // Send security alert
      await NotificationTrigger.create({
        userId: user.id,
        title: "New Device Login Detected",
        message: `A login was detected from a new device (${data.deviceName || "Unknown Device"} on ${data.os || "Unknown OS"}).`,
        type: "SECURITY_ALERT",
        priority: PriorityLevel.HIGH,
        entityType: "DeviceHistory",
      });
    } else {
      await this.repository.updateDeviceHistoryLastUsed(existingDevice.id);
    }

    // Generate Session & Tokens
    const sessionId = crypto.randomUUID();
    const accessToken = jwt.sign({ userId: user.id, sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
    const refreshToken = jwt.sign({ userId: user.id, sessionId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);

    const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Persist Session & Refresh Token
    await this.repository.createSession({
      userId: user.id,
      tokenHash,
      deviceInfo: {
        deviceName: data.deviceName,
        os: data.os,
        browser: data.browser,
        fingerprint,
      },
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Session length: 24h
    });

    await this.repository.createRefreshToken({
      userId: user.id,
      sessionId,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent,
    });

    // Login History
    await this.repository.createLoginHistory({
      userId: user.id,
      emailAttempted: data.email,
      success: true,
      ipAddress,
      userAgent,
    });

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
    };
  }

  public async logout(userId: string, sessionId: string) {
    await this.repository.revokeSession(sessionId);
    
    // Revoke associated refresh tokens
    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId, sessionId, revokedAt: null },
    });
    for (const rt of refreshTokens) {
      await this.repository.revokeRefreshToken(rt.id);
    }

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId,
      action: "USER_LOGOUT",
      entityType: "Session",
      entityId: sessionId,
    });

    return { success: true };
  }

  public async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await this.repository.findRefreshTokenByHash(refreshHash);

    if (!storedToken) {
      throw new UnauthorizedError("Refresh token not found");
    }

    // Check reuse/revocation
    if (storedToken.revokedAt) {
      // Re-use detection: Revoke all tokens for the user as a safety measure
      await this.repository.revokeAllUserRefreshTokens(decoded.userId);
      await this.repository.revokeAllUserSessions(decoded.userId);
      throw new ForbiddenError("Breach detected. Refresh token already used. Session revoked.");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    // Issue new pair (Rotation strategy)
    const newSessionId = storedToken.sessionId || crypto.randomUUID();
    const newAccessToken = jwt.sign({ userId: decoded.userId, sessionId: newSessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
    const newRefreshToken = jwt.sign({ userId: decoded.userId, sessionId: newSessionId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);

    const newAccessTokenHash = crypto.createHash("sha256").update(newAccessToken).digest("hex");
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    // Revoke old token
    const generatedTokenRecord = await this.repository.createRefreshToken({
      userId: decoded.userId,
      sessionId: newSessionId,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    });
    
    await this.repository.revokeRefreshToken(storedToken.id, generatedTokenRecord.id);

    // Create session if it doesn't exist
    if (storedToken.sessionId) {
      await prisma.session.update({
        where: { id: storedToken.sessionId },
        data: {
          tokenHash: newAccessTokenHash,
          lastActivityAt: new Date(),
          ipAddress,
          userAgent,
        },
      });
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async forgotPassword(email: string, ipAddress?: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      // Return success to prevent email enumeration attacks
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.repository.createPasswordReset({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
    });

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "User",
      entityId: user.id,
    });

    try {
      await Mailer.sendPasswordResetEmail(email, resetToken);
    } catch (err) {
      console.error("[Mailer Error]: Failed to dispatch reset password email:", err);
    }
    return { success: true };
  }

  public async resetPassword(data: any) {
    const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");
    const resetRequest = await this.repository.findPasswordResetByHash(tokenHash);

    if (!resetRequest || resetRequest.expiresAt < new Date()) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
    await this.repository.updateUser(resetRequest.userId, {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
    });

    await this.repository.markPasswordResetUsed(resetRequest.id);

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId: resetRequest.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "User",
      entityId: resetRequest.userId,
    });

    return { success: true };
  }

  public async verifyEmail(token: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const verification = await this.repository.findEmailVerificationByHash(tokenHash);

    if (!verification || verification.expiresAt < new Date()) {
      throw new BadRequestError("Invalid or expired email verification token");
    }

    await this.repository.updateUser(verification.userId, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });

    await this.repository.markEmailVerificationVerified(verification.id);

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId: verification.userId,
      action: "EMAIL_VERIFIED",
      entityType: "User",
      entityId: verification.userId,
    });

    return { success: true };
  }

  public async sendOtp(email: string, type: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const codeHash = crypto.createHash("sha256").update(otpCode).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.repository.createOtpCode({
      userId: user.id,
      codeHash,
      type,
      expiresAt,
    });

    console.log(`[OTP Mock]: OTP code for ${email} (${type}): ${otpCode}`);
    return { success: true };
  }

  public async verifyOtp(email: string, code: string, type: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const activeOtp = await this.repository.findLatestActiveOtp(user.id, type);
    if (!activeOtp) {
      throw new BadRequestError("OTP code expired or not found. Request a new code.");
    }

    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      throw new BadRequestError("Maximum attempts reached for this OTP code. Request a new code.");
    }

    const inputHash = crypto.createHash("sha256").update(code).digest("hex");
    if (activeOtp.codeHash !== inputHash) {
      await this.repository.incrementOtpAttempts(activeOtp.id, activeOtp.attempts);
      throw new BadRequestError("Incorrect OTP code");
    }

    await this.repository.markOtpVerified(activeOtp.id);

    if (type === "EMAIL_VERIFICATION") {
      await this.repository.updateUser(user.id, {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    }

    return { success: true };
  }

  public async changePassword(userId: string, data: any) {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new NotFoundError("User not found");
    }

    const matches = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestError("Incorrect current password");
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await this.repository.updateUser(userId, {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
    });

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId,
      action: "PASSWORD_CHANGED",
      entityType: "User",
      entityId: userId,
    });

    return { success: true };
  }

  public async updateProfile(userId: string, data: any) {
    const updated = await this.repository.updateUser(userId, data);

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId,
      action: "PROFILE_UPDATED",
      entityType: "User",
      entityId: userId,
      newValue: data,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      timezone: updated.timezone,
      language: updated.language,
    };
  }

  public async uploadAvatar(userId: string, avatarUrl: string) {
    await this.repository.updateUser(userId, { avatarUrl });

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId,
      action: "AVATAR_UPLOADED",
      entityType: "User",
      entityId: userId,
    });

    return { avatarUrl };
  }

  public async getSessions(userId: string) {
    return this.repository.findActiveSessionsByUserId(userId);
  }

  public async revokeSession(userId: string, sessionId: string) {
    const session = await this.repository.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    await this.repository.revokeSession(sessionId);

    // Revoke refresh token linked to it
    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId, sessionId, revokedAt: null },
    });
    for (const rt of refreshTokens) {
      await this.repository.revokeRefreshToken(rt.id);
    }

    const companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    await ActivityLogger.log({
      companyId,
      userId,
      action: "SESSION_REVOKED",
      entityType: "Session",
      entityId: sessionId,
    });

    return { success: true };
  }

  public async getLoginHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const items = await this.repository.findLoginHistoryByUserId(userId, skip, limit);
    const total = await this.repository.countLoginHistoryByUserId(userId);
    
    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async getDeviceHistory(userId: string) {
    return this.repository.findDeviceHistoryByUserId(userId);
  }
}
