import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth, attachUserIfPresent } from "../middlewares/auth.middleware";
import {
  createPropertySchema,
  propertyIdParamSchema,
  searchPropertiesSchema,
  updatePropertySchema,
} from "../validators/property.validator";

const router = Router();

/**
 * @openapi
 * /properties/search:
 *   get:
 *     tags: [Properties]
 *     summary: Search and filter properties with cursor pagination
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: locality
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: propertyType
 *         schema: { type: string }
 *       - in: query
 *         name: bedrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [price, createdAt] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Opaque pagination cursor from the previous response's meta.pagination.nextCursor
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200: { description: Paginated list of properties }
 */
router.get("/search", validate(searchPropertiesSchema), propertyController.search);

/**
 * @openapi
 * /properties:
 *   get:
 *     tags: [Properties]
 *     summary: List all active properties (cursor paginated)
 *     responses:
 *       200: { description: Paginated list of properties }
 *   post:
 *     tags: [Properties]
 *     summary: Create a new property listing (authenticated)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Property created }
 *       401: { description: Unauthorized }
 */
router.get("/", validate(searchPropertiesSchema), propertyController.getAll);
router.post("/", requireAuth, validate(createPropertySchema), propertyController.create);

/**
 * @openapi
 * /properties/my:
 *   get:
 *     tags: [Properties]
 *     summary: Get properties owned by the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Owner's properties }
 */
router.get("/my", requireAuth, propertyController.getMine);

/**
 * @openapi
 * /properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a single property's details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Property details }
 *       404: { description: Not found }
 *   put:
 *     tags: [Properties]
 *     summary: Update a property you own
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Property updated }
 *       403: { description: Not the owner }
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a property you own
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Property deleted }
 *       403: { description: Not the owner }
 */
router.get("/:id", attachUserIfPresent, validate(propertyIdParamSchema), propertyController.getById);
router.put("/:id", requireAuth, validate(updatePropertySchema), propertyController.update);
router.delete("/:id", requireAuth, validate(propertyIdParamSchema), propertyController.remove);

/**
 * @openapi
 * /properties/{id}/similar:
 *   get:
 *     tags: [Properties]
 *     summary: Get up to 5 similar properties (same city/type, close budget & bedrooms)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Similar properties }
 */
router.get("/:id/similar", validate(propertyIdParamSchema), propertyController.getSimilar);

export default router;
