import type { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;

const ALLOWED_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadAttachmentImpl(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user = (req as any).user;

        const tenantId = user?.tenantId ?? user?.tenant?.tenantId;
        const userId = user?.id;
        const openingId = req.params.id;

        if (!tenantId || !userId) {
            res.status(401).json({
                message: "Unauthorized: user or tenant information is missing",
            });
            return;
        }

        if (!openingId || openingId === "undefined") {
            res.status(400).json({
                message: "A valid opening ID is required",
            });
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

        // Verify that the opening belongs to the authenticated user's tenant.
        const opening = await prisma.opening.findFirst({
            where: {
                id: { equals: openingId },
                tenantId,
            },
            select: {
                id: true,
            },
        });

        if (!opening) {
            res.status(404).json({
                message: "Opening not found",
            });
            return;
        }

        const s3Keys: string[] = [];

        for (const file of files) {
            const s3Key = String(file?.s3Key ?? "");

            if (
                !s3Key ||
                !s3Key.startsWith(`${tenantId}/${openingId}/`) ||
                s3Key.includes("..") ||
                s3Key.includes("\\") ||
                s3Key.includes("\0")
            ) {
                res.status(400).json({
                    message: "Invalid S3 key",
                });
                return;
            }

            s3Keys.push(s3Key);
        }

        if (new Set(s3Keys).size !== s3Keys.length) {
            res.status(400).json({
                message: "Duplicate S3 keys are not allowed",
            });
            return;
        }

        // IMPORTANT:
        // Verify actual S3 object size and content type before registering
        // profiles. See the security note below.

        const profiles = await prisma.$transaction(async (tx) => {
            // Recheck tenant ownership inside the transaction.
            const currentOpening = await tx.opening.findFirst({
                where: {
                    id: openingId,
                    tenantId,
                },
                select: {
                    id: true,
                },
            });

            if (!currentOpening) {
                throw new Error("OPENING_NOT_FOUND");
            }

            const existing = await tx.hiringProfile.findMany({
                where: {
                    s3Key: {
                        in: s3Keys,
                    },
                },
                select: {
                    s3Key: true,
                },
            });

            if (existing.length > 0) {
                throw new Error("PROFILE_ALREADY_REGISTERED");
            }

            const createdProfiles = [];

            for (const s3Key of s3Keys) {
                const profile = await tx.hiringProfile.create({
                    data: {
                        s3Key,
                        uploadedBy: String(userId),

                        // Connect the profile to the existing opening.
                        opening: {
                            connect: {
                                id: openingId,
                            },
                        },
                    },
                });

                createdProfiles.push(profile);
            }

            return createdProfiles;
        });

        res.status(201).json({
            message: "Attachments uploaded and registered successfully",
            data: profiles,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === "OPENING_NOT_FOUND") {
                res.status(404).json({
                    message: "Opening not found",
                });
                return;
            }

            if (error.message === "PROFILE_ALREADY_REGISTERED") {
                res.status(409).json({
                    message: "One or more profiles have already been submitted",
                });
                return;
            }
        }

        console.error("UPLOAD ATTACHMENT ERROR:", error);

        res.status(500).json({
            message: "Failed to register uploaded attachments",
        });
    }
}