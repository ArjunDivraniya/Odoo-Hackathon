export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  timezone: string;
  currency: string;
  workingHours?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  parent?: Department;
  headId?: string;
  head?: Employee;
  office?: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE";
  employeesCount?: number;
  assetsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  color?: string;
  icon?: string;
  status: "ACTIVE" | "INACTIVE";
  assetsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  phone?: string;
  departmentId?: string;
  department?: Department;
  role: string;
  designation?: string;
  office?: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  joiningDate?: string;
  managerId?: string;
  manager?: Employee;
  address?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
