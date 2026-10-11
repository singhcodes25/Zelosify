
import type { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";

export async function fetchRequestDataByIdImpl(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user = (req as any).user;
        const tenantId = user?.tenant?.tenantId;
        const { id } = req.params;

        if (!tenantId) {
            res.status(401).json({
                message: "Tenant information not found",
            });
            return;
        }

        const opening = await prisma.opening.findFirst({
            where: {
                id,
                tenantId,
            },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                contractType: true,
                postedDate: true,
                experienceMin: true,
                experienceMax: true,
                status: true,
                hiringManagerId: true,
            },
        });

        if (!opening) {
            res.status(404).json({
                message: "Opening not found",
            });
            return;
        }

        const [manager, profiles] = await Promise.all([
            prisma.user.findUnique({
                where: { id: opening.hiringManagerId },
                select: {
                    firstName: true,
                    lastName: true,
                },
            }),

            prisma.hiringProfile.findMany({
                where: {
                    openingId: opening.id,
                    deletedAt: null,
                },
                orderBy: {
                    submittedAt: "desc",
                },
                select: {
                    id: true,
                    s3Key: true,
                    submittedAt: true,
                    status: true,
                },
            }),
        ]);

        res.status(200).json({
            message: "success",
            data: {
                opening: {
                    ...opening,
                    hiringManagerName: manager
                        ? [manager.firstName, manager.lastName]
                            .filter(Boolean)
                            .join(" ")
                        : "Unknown",
                },

                files: profiles.map((profile) => ({
                    id: profile.id,
                    s3Key: profile.s3Key,
                    fileName: profile.s3Key.split("/").pop()?.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, "") || "Uploaded file", submittedAt: profile.submittedAt,
                    status: profile.status,
                })),
            },
        });
    } catch (error: unknown) {
        console.error("FETCH OPENING BY ID ERROR:", error);

        if (!res.headersSent) {
            res.status(500).json({
                message: "Failed to fetch opening",
            });
        }
    }
}
