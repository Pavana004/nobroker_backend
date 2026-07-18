import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const uploadService = {
  createSignature(userId: string) {
    if (!isCloudinaryConfigured) {
      throw AppError.badRequest(
        "Image upload isn't configured on this server yet. Set CLOUDINARY_CLOUD_NAME, " +
          "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.",
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `nobroker-clone/properties/${userId}`;
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET!,
    );

    return {
      timestamp,
      folder,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      maxImageSizeMb: env.MAX_IMAGE_SIZE_MB,
      maxImagesPerProperty: env.MAX_IMAGES_PER_PROPERTY,
    };
  },
};
