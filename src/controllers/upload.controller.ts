import { Request, Response } from "express";
import { uploadService } from "../services/upload.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const uploadController = {
  getSignature: asyncHandler(async (req: Request, res: Response) => {
    const signature = uploadService.createSignature(req.user!.id);
    res.status(200).json(success("Upload signature generated", signature));
  }),
};
