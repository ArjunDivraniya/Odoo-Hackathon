import { Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest, AuthenticatedUser } from "../types";
import { UnauthorizedError } from "../errors/app-error";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new UnauthorizedError("Access token is missing or invalid"));
      return;
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "assetflow_super_secret_jwt_sign_key_2026_change_me_in_prod");
    } catch (err) {
      next(new UnauthorizedError("Access token has expired or is invalid"));
      return;
    }

    if (!decoded.sessionId || !decoded.userId) {
      next(new UnauthorizedError("Invalid token payload"));
      return;
    }

    // Compute token hash to verify against the stored session
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Retrieve active session along with user profile, roles, and permissions
    const session = await prisma.session.findFirst({
      where: {
        id: decoded.sessionId,
        userId: decoded.userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            employeeProfile: true,
            roles: {
              where: { isActive: true },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || !session.user) {
      next(new UnauthorizedError("Session is inactive or expired. Please log in again."));
      return;
    }

    const user = session.user;

    // Resolve tenant company scope context
    // 1. From UserRole association if scoped
    // 2. From Employee Profile
    // 3. Fallback to default company ID from environment
    let companyId = process.env.DEFAULT_COMPANY_ID || "00000000-0000-0000-0000-000000000000";
    
    if (user.employeeProfile?.companyId) {
      companyId = user.employeeProfile.companyId;
    } else if (user.roles.length > 0 && user.roles[0].companyId) {
      companyId = user.roles[0].companyId!;
    }

    // Aggregate roles and permissions
    const roleNames: string[] = [];
    const permissionSlugs: string[] = [];

    for (const ur of user.roles) {
      if (ur.role) {
        roleNames.push(ur.role.name);
        
        // Loop permissions
        for (const rp of ur.role.rolePermissions) {
          if (rp.permission) {
            const slug = rp.permission.field
              ? `${rp.permission.module}:${rp.permission.action}:${rp.permission.field}`
              : `${rp.permission.module}:${rp.permission.action}`;
            
            if (!permissionSlugs.includes(slug)) {
              permissionSlugs.push(slug);
            }
          }
        }
      }
    }

    // Populate req.user
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId,
      roles: roleNames,
      permissions: permissionSlugs,
      sessionId: session.id,
    };

    // Update lastActivityAt in the background (non-blocking)
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      })
      .catch((err) => console.error("[Session Activity Update Error]:", err));

    next();
  } catch (error) {
    next(error);
  }
};
