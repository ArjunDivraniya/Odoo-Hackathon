export interface UploadedFileMeta {
  id: string;
  companyId: string;
  uploadedBy: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  storageType: string;
  bucket?: string | null;
  checksum?: string | null;
  thumbnailPath?: string | null;
  metadata?: any;
  isPublic: boolean;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: number;
}

export interface ListFilesResult {
  data: any[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
