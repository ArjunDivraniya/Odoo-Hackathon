import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/app-error";

export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = source === "body" ? req.body : source === "query" ? req.query : req.params;
      const parsed = await schema.parseAsync(target);
      
      // Reassign parsed value to guarantee type safety (stripping unknown properties)
      if (source === "body") req.body = parsed;
      else if (source === "query") req.query = parsed as any;
      else req.params = parsed as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ValidationError("Validation failed", errors));
        return;
      }
      next(error);
    }
  };
};
