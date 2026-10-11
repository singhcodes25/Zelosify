import type { Request, Response } from "express";
import prisma from "../../config/prisma/prisma.js";

export async function getOpeningDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const tenantId = user?.tenantId ?? user?.tenant?.tenantId;
    const openingId = req.params.openingId;

    if (!userId || !tenantId) {
      res.status(401).json({
        message: "User or tenant information not found",
      });
      return;
    }

    if (user.role !== "HIRING_MANAGER") {
      res.status(403).json({
        message: "Only hiring managers can view profiles",
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

    // Never fetch profiles until opening ownership is verified.
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId: String(tenantId),
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        contractType: true,
        experienceMin: true,
        experienceMax: true,
        postedDate: true,
        expectedCompletionDate: true,
        status: true,
      },
    });

    if (!opening) {
      res.status(404).json({
        message: "Opening not found or you do not have access to it",
      });
      return;
    }

    const profileWhere = {
      openingId: opening.id,
      isDeleted: false,
      deletedAt: null,
    };

    const [profiles, total] = await Promise.all([
      prisma.hiringProfile.findMany({
        where: profileWhere,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          openingId: true,
          s3Key: true,
          uploadedBy: true,
          submittedAt: true,
          status: true,
          recommended: true,
          recommendationScore: true,
          recommendationReason: true,
          recommendationConfidence: true,
          recommendationVersion: true,
          recommendedAt: true,
          recommendations: {
            where: {
              openingId: opening.id,
              tenantId: String(tenantId),
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              skillMatchScore: true,
              experienceMatchScore: true,
              locationMatchScore: true,
              finalScore: true,
              decision: true,
              explanation: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.hiringProfile.count({ where: profileWhere }),
    ]);

    const formattedProfiles = profiles.map((profile) => {
      const recommendation = profile.recommendations[0] ?? null;

      // Use the S3 key as a fallback label. It is not a presigned download URL.
      const fileName =
  profile.s3Key
    ?.split("/")
    .pop()
    ?.replace(/^[0-9a-f-]+_/i, "")
    ?.replace(/_/g, "")
    ?.replace(/\.pdf$/i, "") || `Profile #${profile.id}`;

      return {
        id: profile.id,
        openingId: profile.openingId,
        fileName,
        uploadedBy: profile.uploadedBy,
        submittedAt: profile.submittedAt,
        uploadedAt: profile.submittedAt,
        status: profile.status,

        recommended: profile.recommended,
        recommendationScore: profile.recommendationScore,
        recommendationReason: profile.recommendationReason,
        recommendationConfidence: profile.recommendationConfidence,
        recommendedAt: profile.recommendedAt,

        // recommendation: recommendation
        //   ? {
        //       id: recommendation.id,
        //       finalScore: recommendation.finalScore,
        //       decision: recommendation.decision,
        //       explanation: recommendation.explanation,
        //       skillMatchScore: recommendation.skillMatchScore,
        //       experienceMatchScore: recommendation.experienceMatchScore,
        //       locationMatchScore: recommendation.locationMatchScore,
        //     }
        //   : null,
      };
    });

    res.status(200).json({
      message: "Opening details and profiles fetched successfully",
      data: {
        opening,
        profiles: formattedProfiles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching opening details:", error);

    res.status(500).json({
      message: "Failed to fetch opening details",
    });
  }
}
