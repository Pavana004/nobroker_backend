import { Request, Response } from "express";
import { inquiryService } from "../services/inquiry.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const inquiryController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await inquiryService.create(req.user!.id, req.body);
    res.status(201).json(success("Inquiry sent successfully", inquiry));
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const inquiries = await inquiryService.getMine(req.user!.id);
    res.status(200).json(success("Your inquiries fetched", inquiries));
  }),
};
