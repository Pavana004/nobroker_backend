import { Request, Response } from "express";
import { propertyService } from "../services/property.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

export const propertyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.create(req.user!.id, req.body);
    res.status(201).json(success("Property created successfully", property));
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await propertyService.search(req.query as never);
    res.status(200).json(
      success("Properties fetched", result.properties, { pagination: result.pagination })
    );
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const result = await propertyService.search(req.query as never);
    res.status(200).json(
      success("Search results", result.properties, { pagination: result.pagination })
    );
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.getById(req.params.id);
    res.status(200).json(success("Property fetched", property));
  }),

  getSimilar: asyncHandler(async (req: Request, res: Response) => {
    const similar = await propertyService.getSimilar(req.params.id);
    res.status(200).json(success("Similar properties fetched", similar));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.update(req.params.id, req.user!.id, req.body);
    res.status(200).json(success("Property updated successfully", property));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await propertyService.remove(req.params.id, req.user!.id);
    res.status(200).json(success("Property deleted successfully", null));
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const properties = await propertyService.getMyProperties(req.user!.id);
    res.status(200).json(success("Your properties fetched", properties));
  }),
};
