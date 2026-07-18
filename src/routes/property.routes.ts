import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  requireAuth,
  attachUserIfPresent,
} from "../middlewares/auth.middleware";
import {
  createPropertySchema,
  propertyIdParamSchema,
  searchPropertiesSchema,
  updatePropertySchema,
} from "../validators/property.validator";

const router = Router();

router.get(
  "/search",
  validate(searchPropertiesSchema),
  propertyController.search,
);
router.get("/", validate(searchPropertiesSchema), propertyController.getAll);
router.post(
  "/",
  requireAuth,
  validate(createPropertySchema),
  propertyController.create,
);
router.get("/my", requireAuth, propertyController.getMine);
router.get(
  "/:id",
  attachUserIfPresent,
  validate(propertyIdParamSchema),
  propertyController.getById,
);
router.put(
  "/:id",
  requireAuth,
  validate(updatePropertySchema),
  propertyController.update,
);
router.delete(
  "/:id",
  requireAuth,
  validate(propertyIdParamSchema),
  propertyController.remove,
);
router.get(
  "/:id/similar",
  validate(propertyIdParamSchema),
  propertyController.getSimilar,
);

export default router;
