import { Response, NextFunction } from "express";
import * as path from "path";
import { FileStorageService } from "../service/file-storage.service";
import { AuthenticatedRequest } from "../../../types";
import { STORAGE_TYPE } from "../constants/file-storage.constants";
import { BadRequestError, ForbiddenError, InternalServerError } from "../../../errors/app-error";

export class FileStorageController {
  private service = new FileStorageService();

  public upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return next(new BadRequestError("No file uploaded"));
      }
      const result = await this.service.uploadFile(file, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadMultiple = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return next(new BadRequestError("No files uploaded"));
      }
      const results = await this.service.uploadMultiple(files, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Files uploaded successfully",
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.listFiles(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Files fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getFileById(id);
      res.status(200).json({
        success: true,
        message: "File fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public download = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const record = await this.service.getFileById(id);
      await this.service.incrementAccess(id);

      const token = req.query.token as string | undefined;
      const expiresAtRaw = req.query.expiresAt as string | undefined;

      if (record.storageType === STORAGE_TYPE.CLOUDINARY) {
        return res.redirect(record.filePath);
      }

      if (!record.isPublic) {
        if (token && expiresAtRaw) {
          const valid = this.service.verifySignedToken(
            id,
            token,
            parseInt(expiresAtRaw, 10)
          );
          if (!valid) {
            return next(new ForbiddenError("Invalid or expired signed token"));
          }
        } else {
          return next(new ForbiddenError("Signed token required to access this file"));
        }
      }

      const fullPath = path.join(process.cwd(), record.filePath);
      return res.download(fullPath, record.originalName, (err) => {
        if (err && !res.headersSent) {
          next(new InternalServerError("Failed to stream file"));
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public signedUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const expiresIn = req.query.expiresIn
        ? Number(req.query.expiresIn)
        : undefined;
      const result = await this.service.generateSignedUrl(id, expiresIn);
      res.status(200).json({
        success: true,
        message: "Signed URL generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const result = await this.service.deleteFile(id, currentUserId);
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
