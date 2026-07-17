import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";

const swaggerDefinition: swaggerJSDoc.Options["definition"] = {
  openapi: "3.0.3",
  info: {
    title: "NoBroker-Clone API",
    version: "1.0.0",
    description:
      "REST API for a scalable real-estate listing platform: authentication, " +
      "property listings, search & filtering, and lead/inquiry management.",
  },
  servers: [{ url: `${env.API_BASE_URL}/api`, description: "Current environment" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  // Every route/controller file with JSDoc @openapi blocks gets picked up here.
  apis: ["./src/routes/*.ts", "./src/docs/*.ts"],
});
