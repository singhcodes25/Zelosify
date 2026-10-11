
import { Router } from "express";
import { createRecommendation } from "../../controllers/recommendation/recommendation.js";

const router = Router();

// Attach your existing Keycloak authentication and
// HIRING_MANAGER/authorized-role middleware here.
router.post(
  "/openings/:openingId/profiles/:profileId/recommendation",
  createRecommendation
);

export default router;
