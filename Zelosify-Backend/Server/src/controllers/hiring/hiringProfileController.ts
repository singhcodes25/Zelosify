import type { Request, Response } from "express";
import prisma from "../../config/prisma/prisma.js";

export async function fetchData(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const tenantId = user?.tenantId ?? user?.tenant?.tenantId;

    if (!userId || !tenantId) {
      res.status(401).json({
        message: "User or tenant information not found",
      });
      return;
    }

    if (user.role !== "HIRING_MANAGER") {
      res.status(403).json({
        message: "Only hiring managers can view openings",
      });
      return;
    }

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

    // Important: restrict openings to this user and tenant.
    const where = {
      tenantId: String(tenantId),
      hiringManagerId: String(userId),
    };

    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { postedDate: "desc" },
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
        },
      }),
      prisma.opening.count({ where }),
    ]);

    res.status(200).json({
      message: "Openings fetched successfully",
      data: openings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching hiring manager openings:", error);

    res.status(500).json({
      message: "Failed to fetch openings",
    });
  }
}
