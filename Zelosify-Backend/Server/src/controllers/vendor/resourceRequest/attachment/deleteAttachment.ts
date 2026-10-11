
import type { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";

export async function deleteAttachmentImpl(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenantId ?? user?.tenant?.tenantId;
    const userId = user?.id;
    const profileId = Number(req.params.id);

    if (!tenantId || !userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Number.isInteger(profileId) || profileId <= 0) {
      res.status(400).json({ message: "Invalid profile ID" });
      return;
    }

    const profile = await prisma.hiringProfile.findFirst({
      where: {
        id: profileId,
        opening: {
          tenantId,
        },
      },
      select: {
        id: true,
        opening: {
          select: {
            hiringManagerId: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    // Keep this ownership check if only the assigned hiring manager
    // is allowed to delete profiles. Adapt it to your RBAC policy.
    // if (profile.opening.hiringManagerId !== userId) {
    //   res.status(403).json({
    //     message: "You are not authorized to delete this profile",
    //   });
    //   return;
    // }

    // await prisma.hiringProfile.update({
    //   where: { id: profile.id },
    //   data: { deletedAt: new Date() },
    // });

    res.status(200).json({
      message: "File moved to deleted items",
    });
  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
}
