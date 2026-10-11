import { fetchRequestDataImpl } from "./requests/getVendorRequests.js";
import { updateVendorRequestImpl } from "./requests/updateVendorRequest.js";
import { generatePresignedUrlsImpl } from "./attachment/generatePresignedUrls.js";
import { uploadAttachmentImpl } from "./attachment/uploadAttachment.js";
import { deleteAttachmentImpl } from "./attachment/deleteAttachment.js";
import { fetchRequestDataByIdImpl } from "./requests/getVendorRequestById.js";
import type { Request, Response } from "express";

/**
 * Handles vendor requests with error handling and response formatting.
 * @param req Express request
 * @param res Express response
 */
export const fetchRequestData = async (req: Request, res: Response) : Promise<void> => {
  try {
    await fetchRequestDataImpl(req, res);

  } catch (error:unknown) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const fetchRequestDataById = async (req: Request, res: Response) : Promise<void> => {
  try {
    await fetchRequestDataByIdImpl(req, res);

  } catch (error:unknown) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const updateVendorRequest = async (req: Request, res: Response) => {
  try {
    await updateVendorRequestImpl(req, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const generatePresignedUrls = async (req: Request, res: Response) => {
  try {
    await generatePresignedUrlsImpl(req, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    await uploadAttachmentImpl(req, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    await deleteAttachmentImpl(req, res);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
};
