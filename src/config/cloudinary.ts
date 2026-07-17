import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

// Configured once at boot. If credentials aren't set (e.g. local dev before
// signing up for Cloudinary), the SDK simply won't be able to sign requests —
// upload.service.ts checks for this explicitly and returns a clear error
// instead of a cryptic Cloudinary SDK failure.
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

export { cloudinary };
