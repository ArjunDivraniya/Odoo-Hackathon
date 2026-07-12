import { EmployeeRepository, GetEmployeesFilter } from "../repository/employee.repository";
import { ConflictError, NotFoundError } from "../../../errors/app-error";
import { ActivityLogger } from "../../../utils/activity-logger";
import { NotificationTrigger } from "../../../utils/notification-trigger";
import { prisma } from "../../../config/prisma";

export class EmployeeService {
  private repository = new EmployeeRepository();

  public async createEmployee(data: any, currentUserId: string, companyId: string) {
    // 1. Verify User exists
    const user = await prisma.user.findFirst({
      where: { id: data.userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError("User account not found");
    }

    // 2. Verify User does not already have an EmployeeProfile
    const existingProfile = await this.repository.findByUserId(data.userId);
    if (existingProfile) {
      throw new ConflictError("An employee profile already exists for this user account");
    }

    // 3. Verify Company exists
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, deletedAt: null },
    });
    if (!company) {
      throw new NotFoundError("Company not found");
    }

    // 4. Verify Office exists if provided
    if (data.officeId) {
      const office = await prisma.office.findFirst({
        where: { id: data.officeId, deletedAt: null },
      });
      if (!office) {
        throw new NotFoundError("Office not found");
      }
    }

    // 5. Verify Department exists if provided
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!dept) {
        throw new NotFoundError("Department not found");
      }
    }

    // 6. Verify employeeId code is unique globally
    const existingCode = await this.repository.findByEmployeeId(data.employeeId);
    if (existingCode) {
      throw new ConflictError(`Employee ID "${data.employeeId}" is already assigned to another profile`);
    }

    const employee = await this.repository.create(data, currentUserId);

    // Logging & Notifications
    const fullName = `${user.firstName} ${user.lastName}`;
    await ActivityLogger.log({
      companyId: data.companyId,
      userId: currentUserId,
      action: "EMPLOYEE_CREATED",
      entityType: "EmployeeProfile",
      entityId: employee.id,
      entityName: fullName,
      newValue: employee,
    });

    await NotificationTrigger.onEmployeeCreated(employee.id, fullName, data.companyId, user.id);

    return employee;
  }

  public async updateEmployee(id: string, data: any, currentUserId: string, companyId: string) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundError("Employee profile not found");
    }

    // Verify Office exists if provided
    if (data.officeId) {
      const office = await prisma.office.findFirst({
        where: { id: data.officeId, deletedAt: null },
      });
      if (!office) {
        throw new NotFoundError("Office not found");
      }
    }

    // Verify Department exists if provided
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: data.departmentId, deletedAt: null },
      });
      if (!dept) {
        throw new NotFoundError("Department not found");
      }
    }

    // Verify code uniqueness if changed
    if (data.employeeId && data.employeeId !== employee.employeeId) {
      const existingCode = await this.repository.findByEmployeeId(data.employeeId);
      if (existingCode) {
        throw new ConflictError(`Employee ID "${data.employeeId}" is already assigned to another profile`);
      }
    }

    const updated = await this.repository.update(id, data, currentUserId);

    const user = await prisma.user.findUnique({ where: { id: employee.userId } });
    const fullName = user ? `${user.firstName} ${user.lastName}` : "Employee";

    await ActivityLogger.log({
      companyId: employee.companyId,
      userId: currentUserId,
      action: "EMPLOYEE_UPDATED",
      entityType: "EmployeeProfile",
      entityId: id,
      entityName: fullName,
      oldValue: employee,
      newValue: data,
    });

    return updated;
  }

  public async deleteEmployee(id: string, currentUserId: string, companyId: string) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundError("Employee profile not found");
    }

    await this.repository.softDelete(id, currentUserId);

    const user = await prisma.user.findUnique({ where: { id: employee.userId } });
    const fullName = user ? `${user.firstName} ${user.lastName}` : "Employee";

    await ActivityLogger.log({
      companyId: employee.companyId,
      userId: currentUserId,
      action: "EMPLOYEE_DELETED",
      entityType: "EmployeeProfile",
      entityId: id,
      entityName: fullName,
    });

    return { success: true };
  }

  public async getEmployeeById(id: string) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw new NotFoundError("Employee profile not found");
    }
    return employee;
  }

  public async getEmployees(filter: GetEmployeesFilter) {
    return this.repository.findMany(filter);
  }
}
