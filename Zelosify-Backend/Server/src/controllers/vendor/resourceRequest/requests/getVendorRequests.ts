
import type { Request, Response } from "express";
import prisma from "../../../../config/prisma/prisma.js";

export async function fetchRequestDataImpl(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const tenantId = user?.tenant?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        message: "Tenant information not found",
      });
      return;
    }

    // Read pagination parameters from the URL
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page ?? "1"), 10) || 1
    );

    const pageSize = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(String(req.query.pageSize ?? "10"), 10) || 10
      )
    );

    const skip = (page - 1) * pageSize;

    // Fetch openings and total count together
    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where: { tenantId },
        skip,
        take: pageSize,
        orderBy: { postedDate: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          contractType: true,
          postedDate: true,
          experienceMin: true,
          experienceMax: true,
          hiringManagerId: true,
        },
      }),
      prisma.opening.count({
        where: { tenantId },
      }),
    ]);

    // Fetch hiring manager names
    const managerIds = [
      ...new Set(openings.map((opening) => opening.hiringManagerId)),
    ];

    const managers = managerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: managerIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        })
      : [];

    const managerMap = new Map(
      managers.map((manager) => [
        manager.id,
        [manager.firstName, manager.lastName]
          .filter(Boolean)
          .join(" "),
      ])
    );

    res.status(200).json({
      message: "success",
      data: openings.map((opening) => ({
        ...opening,
        hiringManagerName:
          managerMap.get(opening.hiringManagerId) || "Unknown",
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    console.error("OPENINGS CONTROLLER ERROR:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to fetch openings",
      });
    }
  }
}
