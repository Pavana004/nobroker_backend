import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// We never proxy image bytes through our own server (keeps the API light
// and avoids buffering large multipart uploads in memory). Instead the
// client asks us for a short-lived *signature*, then uploads directly to
// Cloudinary using it. Signing server-side means:
//   - The Cloudinary API secret never reaches the browser.
//   - We control WHERE uploads land (folder scoped per-user) and can add
//     constraints (e.g. an upload preset) without trusting the client.
//   - The signature is tied to this exact timestamp + folder, so it can't
//     be replayed for a different, unintended upload.
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

    // Only parameters included here are part of the signed payload; the
    // client cannot add or change any of them without invalidating the
    // signature, so this is also where per-upload policy is enforced.
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
