import crypto from "node:crypto";
import { AppError } from "./AppError";
import { env } from "../config/env";

const CLOUDINARY_UPLOAD_PATH = "image/upload";

function ensureCloudinaryConfig() {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } =
    env;

  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
    throw AppError.badRequest("Cloudinary is not configured on the server");
  }

  return { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME };
}

function buildCloudinarySignature(
  params: Record<string, string | number>,
  secret: string,
) {
  const keys = Object.keys(params).sort();
  const payload = keys.map((key) => `${key}=${params[key]}`).join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export function generateCloudinaryUploadSignature(options?: {
  folder?: string;
}) {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } =
    ensureCloudinaryConfig();
  const folder = options?.folder?.trim() || "properties";
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = buildCloudinarySignature(
    { folder, timestamp },
    CLOUDINARY_API_SECRET,
  );

  return {
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    signature,
    timestamp,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${CLOUDINARY_UPLOAD_PATH}`,
    maxImageSizeMB: env.MAX_IMAGE_SIZE_MB,
    maxImagesPerProperty: env.MAX_IMAGES_PER_PROPERTY,
  };
}

export function isCloudinaryUrl(url: string) {
  if (!env.CLOUDINARY_CLOUD_NAME) return true;

  try {
    const parsed = new URL(url);
    const normalizedHost = parsed.hostname.toLowerCase();
    const expectedPathPrefix = `/${env.CLOUDINARY_CLOUD_NAME}/`;

    return (
      normalizedHost === "res.cloudinary.com" &&
      parsed.pathname.startsWith(expectedPathPrefix)
    );
  } catch {
    return false;
  }
}
