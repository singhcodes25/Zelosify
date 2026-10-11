import { Router, type RequestHandler } from "express";

import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  fetchRequestData,
  fetchRequestDataById,
  generatePresignedUrls,
  updateVendorRequest,
  uploadAttachment,
  deleteAttachment,
} from "../../controllers/controllers.js";

/**
 * Router for vendor request management endpoints
 * All routes require authentication and VENDOR_MANAGER role
 */
const router = Router();

/**
 * =============================================================================
 * VENDOR RESOURCE REQUEST RETRIEVAL ROUTES
 * =============================================================================
 */

/**
 * GET /api/v1/vendor/requests
 * @requires VENDOR_MANAGER role
 */
router.get(
  "/",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  fetchRequestData as any
);
router.get(
  "/:id",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  fetchRequestDataById as any
);

router.post(
  "/:id/profiles/presign",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  generatePresignedUrls as any
);

router.post(
  "/:id/profiles/upload",
  authenticateUser as RequestHandler,
  authorizeRole("IT_VENDOR") as RequestHandler,
  uploadAttachment as any
);

router.delete(
  "/delete-attachment",
  authenticateUser as RequestHandler,
  authorizeRole("VENDOR_MANAGER") as RequestHandler,
  deleteAttachment as any
);

router.put(
  "/:requestId",
  authenticateUser as RequestHandler,
  authorizeRole("VENDOR_MANAGER") as RequestHandler,
  updateVendorRequest as any
);


export default router;
