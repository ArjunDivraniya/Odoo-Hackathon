import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If it's a known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Handle Prisma Specific Error Codes (e.g. Unique constraints)
  const errorName = err.constructor?.name || "";
  const errorMessage = err.message || "";

  if (errorName.includes("PrismaClientKnownRequestError")) {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      // Unique constraint
      const fields = prismaErr.meta?.target || [];
      res.status(409).json({
        success: false,
        message: `Duplicate record conflict on field(s): ${fields.join(", ")}`,
        errors: [{ message: "Duplicate record conflict", fields }],
      });
      return;
    }
    if (prismaErr.code === "P2003") {
      // FK constraint fail
      res.status(400).json({
        success: false,
        message: "Foreign key constraint failed. Related record not found or still referenced.",
        errors: [],
      });
      return;
    }
    if (prismaErr.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        message: prismaErr.meta?.cause || "Record not found",
        errors: [],
      });
      return;
    }
  }

  // Log unknown server errors
  console.error("[Unhandled Error]:", err.name, err.message, (err as any).stack?.substring(0, 500));

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message?.substring(0, 500) || errorMessage,
    errors: [{ type: err.constructor?.name }],
  });
};
