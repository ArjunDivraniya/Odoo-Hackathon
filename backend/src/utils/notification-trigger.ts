import { prisma } from "../config/prisma";
import { NotificationStatus, PriorityLevel } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: PriorityLevel;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: any;
  expiresInDays?: number;
}

export class NotificationTrigger {
  public static async create(params: CreateNotificationParams): Promise<void> {
    try {
      const expiresAt = params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          status: NotificationStatus.UNREAD,
          priority: params.priority || PriorityLevel.MEDIUM,
          entityType: params.entityType || null,
          entityId: params.entityId || null,
          actionUrl: params.actionUrl || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
          expiresAt,
        },
      });
    } catch (error) {
      console.error("[NotificationTrigger Error]: Failed to create notification:", error);
    }
  }

  // Triggered on new user registration (Sends welcome alert to user, and notification to admins)
  public static async onUserCreated(userId: string, email: string): Promise<void> {
    // 1. Welcome notification to the new user
    await this.create({
      userId,
      title: "Welcome to AssetFlow",
      message: `Your account (${email}) has been successfully created. Please verify your email.`,
      type: "USER_WELCOME",
      priority: PriorityLevel.HIGH,
      entityType: "User",
      entityId: userId,
    });

    // 2. Notify all Administrators
    try {
      const adminRoles = await prisma.role.findMany({
        where: { name: { in: ["ADMIN", "SYSTEM_ADMIN", "Super Admin"] }, isActive: true },
        select: { id: true },
      });
      const adminRoleIds = adminRoles.map((r) => r.id);

      if (adminRoleIds.length > 0) {
        const admins = await prisma.userRole.findMany({
          where: { roleId: { in: adminRoleIds }, isActive: true },
          select: { userId: true },
        });

        for (const admin of admins) {
          await this.create({
            userId: admin.userId,
            title: "New User Registered",
            message: `A new user account has been registered with email ${email}.`,
            type: "USER_CREATED_ALERT",
            priority: PriorityLevel.MEDIUM,
            entityType: "User",
            entityId: userId,
          });
        }
      }
    } catch (error) {
      console.error("[NotificationTrigger.onUserCreated Admins Alert Error]:", error);
    }
  }

  // Triggered when a role is assigned to a user
  public static async onRoleAssigned(userId: string, roleName: string, assignedBy?: string): Promise<void> {
    await this.create({
      userId,
      title: "New Role Assigned",
      message: `You have been assigned the role: ${roleName}.`,
      type: "ROLE_ASSIGNED",
      priority: PriorityLevel.HIGH,
      entityType: "Role",
      metadata: { assignedBy },
    });
  }

  // Triggered when a new department is created
  public static async onDepartmentCreated(departmentId: string, deptName: string, companyId: string): Promise<void> {
    // Notify all company admins/asset managers
    try {
      const roles = await prisma.role.findMany({
        where: { name: { in: ["ADMIN", "ASSET_MANAGER"] } },
        select: { id: true },
      });
      const roleIds = roles.map((r) => r.id);

      if (roleIds.length > 0) {
        const managers = await prisma.userRole.findMany({
          where: { roleId: { in: roleIds }, companyId, isActive: true },
          select: { userId: true },
        });

        for (const mgr of managers) {
          await this.create({
            userId: mgr.userId,
            title: "New Department Created",
            message: `A new department "${deptName}" has been created in your company.`,
            type: "DEPARTMENT_CREATED",
            priority: PriorityLevel.LOW,
            entityType: "Department",
            entityId: departmentId,
          });
        }
      }
    } catch (error) {
      console.error("[NotificationTrigger.onDepartmentCreated Error]:", error);
    }
  }

  // Triggered when a new employee profile is created
  public static async onEmployeeCreated(employeeId: string, name: string, companyId: string, userId: string): Promise<void> {
    // 1. Welcome to employee
    await this.create({
      userId,
      title: "Employee Profile Created",
      message: `Hi ${name}, your employee profile has been set up successfully.`,
      type: "EMPLOYEE_WELCOME",
      priority: PriorityLevel.HIGH,
      entityType: "EmployeeProfile",
      entityId: employeeId,
    });

    // 2. Notify company Admins/HR
    try {
      const roles = await prisma.role.findMany({
        where: { name: { in: ["ADMIN", "ASSET_MANAGER"] } },
        select: { id: true },
      });
      const roleIds = roles.map((r) => r.id);

      if (roleIds.length > 0) {
        const staff = await prisma.userRole.findMany({
          where: { roleId: { in: roleIds }, companyId, isActive: true },
          select: { userId: true },
        });

        for (const s of staff) {
          await this.create({
            userId: s.userId,
            title: "New Employee Created",
            message: `Employee profile for ${name} has been created.`,
            type: "EMPLOYEE_CREATED",
            priority: PriorityLevel.MEDIUM,
            entityType: "EmployeeProfile",
            entityId: employeeId,
          });
        }
      }
    } catch (error) {
      console.error("[NotificationTrigger.onEmployeeCreated Error]:", error);
    }
  }
}
