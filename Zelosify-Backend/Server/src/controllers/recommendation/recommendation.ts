
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { recommendCandidate } from "../../services/recommendation/recommendation.service.js";

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId?: string;
    sub?: string;
    roles?: string[];
  };
}

export async function createRecommendation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profileId = Number(req.params.profileId);
    const openingId = req.params.openingId;
    const tenantId = req.user?.tenantId;
    const triggeredBy = req.user?.sub;

    if (!Number.isInteger(profileId) || profileId <= 0) {
      res.status(400).json({
        message: "Invalid profile ID",
      });
      return;
    }

    if (!openingId || !tenantId || !triggeredBy) {
      res.status(400).json({
        message: "Missing opening, tenant, or user identity",
      });
      return;
    }

    const recommendation = await recommendCandidate({
      profileId,
      openingId,
      tenantId,
      triggeredBy,
    });

    res.status(200).json({
      message: "Recommendation generated successfully",
      recommendation,
    });
  } catch (error) {
    next(error);
  }
}
