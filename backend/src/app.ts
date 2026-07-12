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
import assetCategoryRoutes from "./modules/asset-category/routes/asset-category.routes";
import assetRoutes from "./modules/asset/routes/asset.routes";
import assetImageRoutes from "./modules/asset-image/routes/asset-image.routes";
import assetDocumentRoutes from "./modules/asset-document/routes/asset-document.routes";
import assetQrRoutes from "./modules/asset-qr/routes/asset-qr.routes";
import allocationRoutes from "./modules/allocation/routes/allocation.routes";
import returnRoutes from "./modules/return/routes/asset-return.routes";
import transferRoutes from "./modules/transfer/routes/transfer.routes";
import resourceRoutes from "./modules/resource/routes/resource.routes";
import bookingRoutes from "./modules/booking/routes/booking.routes";
import maintenanceRoutes from "./modules/maintenance/routes/maintenance.routes";
import auditRoutes from "./modules/audit/routes/audit.routes";
import notificationRoutes from "./modules/notification/routes/notification.routes";
import activityLogRoutes from "./modules/activity-log/routes/activity-log.routes";
import systemRoutes from "./modules/system/routes/system.routes";
import lookupRoutes from "./modules/lookup/routes/lookup.routes";
import emailRoutes from "./modules/email/routes/email.routes";
import fileRoutes from "./modules/file-storage/routes/file-storage.routes";
import dashboardRoutes from "./modules/dashboard/routes/dashboard.routes";
import reportsRoutes from "./modules/reports/routes/reports.routes";
import analyticsRoutes from "./modules/analytics/routes/analytics.routes";
import searchRoutes from "./modules/search/routes/search.routes";
import { prisma } from "./config/prisma";

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Debug endpoint
app.get("/debug/prisma", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({ where: { email: "test@assetflow.com" } });
    res.json({ success: true, user: user ? { id: user.id, email: user.email } : null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, stack: err.stack?.substring(0, 1000), name: err.constructor?.name });
  }
});

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
app.use("/api/v1/asset-categories", assetCategoryRoutes);
app.use("/api/v1/assets", assetRoutes);
app.use("/api/v1/asset-images", assetImageRoutes);
app.use("/api/v1/asset-documents", assetDocumentRoutes);
app.use("/api/v1/asset-qr-codes", assetQrRoutes);
app.use("/api/v1/allocations", allocationRoutes);
app.use("/api/v1/returns", returnRoutes);
app.use("/api/v1/transfers", transferRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/audits", auditRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/system", systemRoutes);
app.use("/api/v1/lookups", lookupRoutes);
app.use("/api/v1/email-templates", emailRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/search", searchRoutes);

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
