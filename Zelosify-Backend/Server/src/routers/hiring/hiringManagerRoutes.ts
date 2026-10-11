import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { fetchData } from "../../controllers/controllers.js";
import { getOpeningDetails } from "../../controllers/hiring/getOpeningDetails.js";

const router = Router();

/**
 * =============================================================================
 * HIRING MANAGER ROUTES - VACANCY MANAGEMENT
 * =============================================================================
 */

/**
 * GET /api/v1/hiring-manager
 * @requires HIRING_MANAGER role
 */

router.get(
  "/openings",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  fetchData as RequestHandler
);

router.get(
  "/openings/:openingId",
  authenticateUser as RequestHandler,
  authorizeRole("HIRING_MANAGER") as RequestHandler,
  getOpeningDetails as RequestHandler
);


export default router;
