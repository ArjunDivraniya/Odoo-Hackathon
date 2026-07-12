import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error";

export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("User is not authenticated"));
      return;
    }

    const { roles, permissions } = req.user;

    // Admin role has absolute bypass
    if (roles.includes("ADMIN") || roles.includes("SYSTEM_ADMIN")) {
      next();
      return;
    }

    // Check if the permission matches directly
    // E.g. requiredPermission = "user:create"
    const hasPermission = permissions.includes(requiredPermission);

    // Also support wildcard checks if needed (e.g. "user:*")
    const moduleName = requiredPermission.split(":")[0];
    const hasWildcard = permissions.includes(`${moduleName}:*`) || permissions.includes("*:*");

    if (hasPermission || hasWildcard) {
      next();
    } else {
      next(new ForbiddenError(`Access denied. Required permission: ${requiredPermission}`));
    }
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("User is not authenticated"));
      return;
    }

    const { roles } = req.user;

    // Check if user has at least one of the allowed roles
    const hasRole = roles.some((role) => allowedRoles.includes(role));

    if (hasRole || roles.includes("ADMIN") || roles.includes("SYSTEM_ADMIN")) {
      next();
    } else {
      next(new ForbiddenError(`Access denied. Required roles: [${allowedRoles.join(", ")}]`));
    }
  };
};
