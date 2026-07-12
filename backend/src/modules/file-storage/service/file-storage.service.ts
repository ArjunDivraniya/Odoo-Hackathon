import { FileStorageRepository } from "../repository/file-storage.repository";
import { ActivityLogger } from "../../../utils/activity-logger";
import { cloudinary } from "../../../config/cloudinary";
import {
  STORAGE_TYPE,
  LOCAL_UPLOAD_DIR,
  CLOUDINARY_FOLDER,
  SIGNED_URL_SECRET,
  SIGNED_URL_DEFAULT_TTL_SECONDS,
  FILE_UPLOAD_ACTIVITY,
  FILE_DELETE_ACTIVITY,
} from "../constants/file-storage.constants";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

export class FileStorageService {
  private repository = new FileStorageRepository();

  private isCloudinaryConfigured(): boolean {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }

  private uploadToCloudinary(
    buffer: Buffer,
    mimetype: string,
    originalname: string
  ): Promise<{ filePath: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const publicIdBase = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: "auto",
          public_id: publicIdBase,
          filename_override: originalname,
        },
        (error: any, result: any) => {
          if (error || !result) {
            return reject(error || new Error("Cloudinary upload failed"));
          }
          resolve({ filePath: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(buffer);
    });
  }

  private async storeLocal(
    buffer: Buffer,
    originalname: string
  ): Promise<{ filePath: string; publicId: string | null }> {
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safeName}`;
    const fullPath = path.join(LOCAL_UPLOAD_DIR, storedName);
    await fs.writeFile(fullPath, buffer);
    return { filePath: `uploads/${storedName}`, publicId: null };
  }

  private generateSignedToken(
    id: string,
    expiresSeconds: number
  ): { token: string; expiresAt: number } {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresSeconds;
    const payload = `${id}.${expiresAt}`;
    const token = crypto
      .createHmac("sha256", SIGNED_URL_SECRET)
      .update(payload)
      .digest("hex");
    return { token, expiresAt };
  }

  public verifySignedToken(id: string, token: string, expiresAt: number): boolean {
    if (Math.floor(Date.now() / 1000) > expiresAt) return false;
    const payload = `${id}.${expiresAt}`;
    const expected = crypto
      .createHmac("sha256", SIGNED_URL_SECRET)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(token)
    );
  }

  private computeChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  public async uploadFile(
    file: Express.Multer.File,
    currentUserId: string,
    companyId: string
  ) {
    const buffer = file.buffer;
    let storageType: string = STORAGE_TYPE.LOCAL;
    let filePath = "";
    let publicId: string | null = null;
    let bucket: string | null = null;

    if (this.isCloudinaryConfigured()) {
      try {
        const result = await this.uploadToCloudinary(buffer, file.mimetype, file.originalname);
        storageType = STORAGE_TYPE.CLOUDINARY;
        filePath = result.filePath;
        publicId = result.publicId;
        bucket = CLOUDINARY_FOLDER;
      } catch (error) {
        const local = await this.storeLocal(buffer, file.originalname);
        storageType = STORAGE_TYPE.LOCAL;
        filePath = local.filePath;
        publicId = null;
      }
    } else {
      const local = await this.storeLocal(buffer, file.originalname);
      storageType = STORAGE_TYPE.LOCAL;
      filePath = local.filePath;
      publicId = null;
    }

    const checksum = this.computeChecksum(buffer);
    const storedFileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const record = await this.repository.create({
      companyId,
      uploadedBy: currentUserId,
      originalName: file.originalname,
      fileName: storedFileName,
      mimeType: file.mimetype,
      fileSize: BigInt(buffer.length),
      filePath,
      storageType,
      bucket,
      checksum,
      isPublic: false,
      accessCount: 0,
      metadata: publicId ? { publicId } : null,
    });

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: FILE_UPLOAD_ACTIVITY,
      entityType: "FileStorage",
      entityId: record.id,
      entityName: file.originalname,
      newValue: record,
    });

    return record;
  }

  public async uploadMultiple(
    files: Express.Multer.File[],
    currentUserId: string,
    companyId: string
  ) {
    const results = [];
    for (const file of files) {
      results.push(await this.uploadFile(file, currentUserId, companyId));
    }
    return results;
  }

  public async listFiles(companyId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const filters = {
      mimeType: query.mimeType,
      isPublic:
        query.isPublic !== undefined
          ? query.isPublic === true || query.isPublic === "true"
          : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      sortBy: query.sortBy || "createdAt",
      sortOrder: query.sortOrder || "desc",
    };
    return this.repository.findMany(companyId, filters, page, limit);
  }

  public async getFileById(id: string) {
    const { NotFoundError } = await import("../../../errors/app-error");
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError("File not found");
    }
    return record;
  }

  public async incrementAccess(id: string) {
    return this.repository.incrementAccess(id);
  }

  public async generateSignedUrl(id: string, expiresSeconds?: number) {
    const record = await this.getFileById(id);
    const expiresIn = expiresSeconds || SIGNED_URL_DEFAULT_TTL_SECONDS;

    if (record.storageType === STORAGE_TYPE.CLOUDINARY) {
      const publicId = record.metadata?.publicId;
      if (!publicId) {
        const { BadRequestError } = await import("../../../errors/app-error");
        throw new BadRequestError("File public id is missing for signed url");
      }
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
      const url = cloudinary.utils.url(publicId, {
        sign_url: true,
        expires_at: expiresAt,
        resource_type: "auto",
        secure: true,
      });
      return { url, expiresAt };
    }

    const { token, expiresAt } = this.generateSignedToken(id, expiresIn);
    const url = `/api/v1/files/${id}/download?token=${token}&expiresAt=${expiresAt}`;
    return { url, expiresAt };
  }

  public async deleteFile(id: string, currentUserId: string) {
    const record = await this.getFileById(id);
    const companyId = record.companyId;

    if (record.storageType === STORAGE_TYPE.CLOUDINARY && record.metadata?.publicId) {
      try {
        await cloudinary.uploader.destroy(record.metadata.publicId, {
          resource_type: "auto",
        });
      } catch (error) {
        console.error("[FileStorage] Cloudinary delete failed:", error);
      }
    }

    await this.repository.softDelete(id);

    await ActivityLogger.log({
      companyId,
      userId: currentUserId,
      action: FILE_DELETE_ACTIVITY,
      entityType: "FileStorage",
      entityId: id,
      entityName: record.originalName,
    });

    return { id, deleted: true };
  }
}
