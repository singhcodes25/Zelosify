
import type { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";

export async function updateVendorRequestImpl(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenant?.tenantId;
    const openingId = req.params.id;

    if (!tenantId) {
      res.status(401).json({
        message: "Tenant information not found",
      });
      return;
    }

    if (!openingId) {
      res.status(400).json({
        message: "Opening ID is required",
      });
      return;
    }

    // Fetch the opening belonging to the current tenant.
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
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
        hiringManagerId: true,
        status: true,
      },
    });

    if (!opening) {
      res.status(404).json({
        message: "Opening not found",
      });
      return;
    }

    // Fetch the hiring manager's name.
    const manager = await prisma.user.findUnique({
      where: {
        id: opening.hiringManagerId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    const hiringManagerName = manager
      ? [manager.firstName, manager.lastName]
          .filter(Boolean)
          .join(" ")
      : "Unknown";

    // Return the opening details in the format expected by the frontend.
    res.status(200).json({
      message: "success",
      data: {
        opening: {
          ...opening,
          hiringManagerName,
        },
        files: [],
      },
    });
  } catch (error: unknown) {
    console.error("GET OPENING DETAILS ERROR:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to fetch opening details",
      });
    }
  }
}
