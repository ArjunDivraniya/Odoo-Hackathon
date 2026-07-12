import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/routes/auth.routes";
import userRoutes from "./modules/users/routes/user.routes";
import roleRoutes from "./modules/roles/routes/role.routes";
import permissionRoutes from "./modules/permissions/routes/permission.routes";
import companyRoutes from "./modules/company/routes/company.routes";
import officeRoutes from "./modules/office/routes/office.routes";
import buildingRoutes from "./modules/building/routes/building.routes";
import floorRoutes from "./modules/floor/routes/floor.routes";
import locationRoutes from "./modules/location/routes/location.routes";
import departmentRoutes from "./modules/department/routes/department.routes";
import employeeRoutes from "./modules/employee/routes/employee.routes";

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// API Route Mounts
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/offices", officeRoutes);
app.use("/api/v1/buildings", buildingRoutes);
app.use("/api/v1/floors", floorRoutes);
app.use("/api/v1/locations", locationRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/employees", employeeRoutes);

// Root path check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AssetFlow ERP Backend API version 1.0.0 is online.",
  });
});

// Global Error Handler Middleware
app.use(errorMiddleware as any);

export default app;
