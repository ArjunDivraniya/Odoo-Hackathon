import { prisma } from "../../../config/prisma";
import { UserStatus } from "@prisma/client";

export class AuthRepository {
  // === USER OPERATIONS ===
  
  public async findUserByEmail(email: string) {
    if (!email) {
      return null;
    }

    return prisma.user.findUnique({
      where: { email },
    });
  }

  public async findUserById(id: string) {
    if (!id) {
      return null;
    }

    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  public async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status: UserStatus;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        status: data.status,
      },
    });
  }

  public async updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  public async incrementFailedLogin(id: string, currentCount: number, maxAttempts: number) {
    const newCount = currentCount + 1;
    const isLocking = newCount >= maxAttempts;
    
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: newCount,
        status: isLocking ? UserStatus.LOCKED : undefined,
        lockedUntil: isLocking ? new Date(Date.now() + 30 * 60 * 1000) : undefined, // 30 minutes lockout
      },
    });
  }

  public async resetFailedLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        status: UserStatus.ACTIVE,
      },
    });
  }

  // === SESSION OPERATIONS ===

  public async createSession(data: {
    id?: string;
    userId: string;
    tokenHash: string;
    deviceInfo?: any;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return prisma.session.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceInfo: data.deviceInfo || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        expiresAt: data.expiresAt,
        isActive: true,
      },
    });
  }

  public async findSessionById(id: string) {
    return prisma.session.findUnique({
      where: { id },
    });
  }

  public async findActiveSessionsByUserId(userId: string) {
    return prisma.session.findMany({
      where: { userId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }

  public async revokeSession(id: string) {
    return prisma.session.update({
      where: { id },
      data: { isActive: false },
    });
  }

  public async revokeAllUserSessions(userId: string) {
    return prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  // === REFRESH TOKEN OPERATIONS ===

  public async createRefreshToken(data: {
    userId: string;
    sessionId?: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId || null,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  public async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  public async revokeRefreshToken(id: string, replacedBy?: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedBy: replacedBy || null,
      },
    });
  }

  public async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // === LOGIN HISTORY OPERATIONS ===

  public async createLoginHistory(data: {
    userId?: string;
    emailAttempted: string;
    success: boolean;
    failureReason?: string;
    ipAddress?: string;
    userAgent?: string;
    locationData?: any;
  }) {
    return prisma.loginHistory.create({
      data: {
        userId: data.userId || null,
        emailAttempted: data.emailAttempted,
        success: data.success,
        failureReason: data.failureReason || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        locationData: data.locationData || null,
      },
    });
  }

  public async findLoginHistoryByUserId(userId: string, skip: number, take: number) {
    return prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  public async countLoginHistoryByUserId(userId: string) {
    return prisma.loginHistory.count({
      where: { userId },
    });
  }

  // === DEVICE HISTORY OPERATIONS ===

  public async findDeviceHistory(userId: string, deviceFingerprint: string) {
    return prisma.deviceHistory.findUnique({
      where: {
        userId_deviceFingerprint: { userId, deviceFingerprint },
      },
    });
  }

  public async createDeviceHistory(data: {
    userId: string;
    deviceFingerprint: string;
    deviceName?: string;
    deviceType?: string;
    os?: string;
    browser?: string;
    isTrusted?: boolean;
  }) {
    return prisma.deviceHistory.create({
      data: {
        userId: data.userId,
        deviceFingerprint: data.deviceFingerprint,
        deviceName: data.deviceName || null,
        deviceType: data.deviceType || null,
        os: data.os || null,
        browser: data.browser || null,
        isTrusted: data.isTrusted || false,
      },
    });
  }

  public async updateDeviceHistoryLastUsed(id: string) {
    return prisma.deviceHistory.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  public async findDeviceHistoryByUserId(userId: string) {
    return prisma.deviceHistory.findMany({
      where: { userId },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  // === PASSWORD RESET OPERATIONS ===

  public async createPasswordReset(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
  }) {
    return prisma.passwordReset.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress || null,
      },
    });
  }

  public async findPasswordResetByHash(tokenHash: string) {
    return prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null },
    });
  }

  public async markPasswordResetUsed(id: string) {
    return prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  // === EMAIL VERIFICATION OPERATIONS ===

  public async createEmailVerification(data: {
    userId: string;
    tokenHash: string;
    email: string;
    expiresAt: Date;
  }) {
    return prisma.emailVerification.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        email: data.email,
        expiresAt: data.expiresAt,
      },
    });
  }

  public async findEmailVerificationByHash(tokenHash: string) {
    return prisma.emailVerification.findFirst({
      where: { tokenHash, verifiedAt: null },
    });
  }

  public async markEmailVerificationVerified(id: string) {
    return prisma.emailVerification.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  // === OTP OPERATIONS ===

  public async createOtpCode(data: {
    userId: string;
    codeHash: string;
    type: string;
    expiresAt: Date;
  }) {
    return prisma.otpCode.create({
      data: {
        userId: data.userId,
        codeHash: data.codeHash,
        type: data.type,
        expiresAt: data.expiresAt,
      },
    });
  }

  public async findLatestActiveOtp(userId: string, type: string) {
    return prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public async incrementOtpAttempts(id: string, currentAttempts: number) {
    return prisma.otpCode.update({
      where: { id },
      data: { attempts: currentAttempts + 1 },
    });
  }

  public async markOtpVerified(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }
}
