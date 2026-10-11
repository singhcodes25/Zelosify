import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { createStorageService } from "../../../../services/storage/storageFactory.js";
import prisma from "../../../../config/prisma/prisma.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 20;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function generatePresignedUrlsImpl(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenant?.tenantId;
    const userId = user?.id;
    const openingId = req.params.id;

    if (!tenantId || !userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const files = req.body?.files;

    if (
      !Array.isArray(files) ||
      files.length < 1 ||
      files.length > MAX_FILES
    ) {
      res.status(400).json({
        message: `Provide between 1 and ${MAX_FILES} files`,
      });
      return;
    }

    // The opening must belong to the vendor's tenant.
    const opening = await prisma.opening.findFirst({
      where: {
        id: { equals: openingId },
        tenantId,
      },
      select: { id: true },
    });

    if (!opening) {
      res.status(404).json({ message: "Opening not found" });
      return;
    }

    const storage = createStorageService();
    const uploads = [];

    for (const file of files) {
      const originalName = String(file?.fileName ?? "");
      const fileName = originalName.split(/[\\/]/).pop() ?? "";
      const contentType = String(file?.contentType ?? "");
      const size = Number(file?.size);

      if (
        !fileName ||
        fileName === "." ||
        fileName === ".." ||
        !ALLOWED_TYPES.has(contentType) ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > MAX_FILE_SIZE
      ) {
        res.status(400).json({
          message: `Invalid file: ${fileName || "unknown"}`,
        });
        return;
      }

      const safeFileName = fileName.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      // Never accept an S3 key supplied by the client.
      const s3Key =
        `${tenantId}/${openingId}/${randomUUID()}_${safeFileName}`;

      const uploadUrl = await storage.getUploadURL(
        s3Key,
      );

      uploads.push({
        fileName,
        s3Key,
        uploadUrl,
        contentType,
        maxSize: MAX_FILE_SIZE,
        expiresIn: 300,
      });
    }
    res.status(200).json({
      message: "Upload URLs generated successfully",
      data: uploads,
    });
  } catch (error: unknown) {
    console.error("PRESIGN ERROR:", error);

    res.status(500).json({
      message: "Failed to generate upload URLs",
    });
  }
}