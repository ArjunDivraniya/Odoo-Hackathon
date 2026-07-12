import path from "path";

export const STORAGE_TYPE = {
  LOCAL: "LOCAL",
  CLOUDINARY: "CLOUDINARY",
} as const;

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const CLOUDINARY_FOLDER = "assetflow/file-storage";

export const SIGNED_URL_SECRET =
  process.env.SIGNED_URL_SECRET || "assetflow_default_signed_url_secret_change_me";

export const SIGNED_URL_DEFAULT_TTL_SECONDS = 900;

export const CLOUDINARY_TTL_SECONDS = 3600;

export const FILE_UPLOAD_ACTIVITY = "FILE_UPLOADED";
export const FILE_DELETE_ACTIVITY = "FILE_DELETED";
export const FILE_DOWNLOAD_ACTIVITY = "FILE_DOWNLOADED";
