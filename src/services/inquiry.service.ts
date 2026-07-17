import { propertyRepository } from "../repositories/property.repository";
import { inquiryRepository } from "../repositories/inquiry.repository";
import { AppError } from "../utils/AppError";
import { CreateInquiryInput } from "../validators/inquiry.validator";

// Burst-cooldown: no more than 5 inquiries in a 10 minute window, regardless
// of which properties they target. Stacked on top of:
//   1. DB-level unique(propertyId, senderId) — one open inquiry per listing
//   2. express-rate-limit on the route — IP-level throttling
// Three independent layers because each catches a different abuse pattern
// (same user spamming one owner / one user spamming many owners / a bot
// hammering the endpoint from one IP).
const COOLDOWN_WINDOW_MINUTES = 10;
const COOLDOWN_MAX_INQUIRIES = 5;

export const inquiryService = {
  async create(senderId: string, input: CreateInquiryInput) {
    const property = await propertyRepository.findById(input.propertyId);
    if (!property) throw AppError.notFound("Property not found");

    if (property.ownerId === senderId) {
      throw AppError.badRequest("You cannot send an inquiry for your own property");
    }

    const existing = await inquiryRepository.findExisting(input.propertyId, senderId);
    if (existing) {
      throw AppError.conflict("You already sent an inquiry for this property");
    }

    const recentCount = await inquiryRepository.countRecentByUser(senderId, COOLDOWN_WINDOW_MINUTES);
    if (recentCount >= COOLDOWN_MAX_INQUIRIES) {
      throw AppError.tooMany(
        `You're sending inquiries too quickly. Please wait a few minutes and try again.`
      );
    }

    return inquiryRepository.create(input.propertyId, senderId, input.message);
  },

  getMine(senderId: string) {
    return inquiryRepository.findByUser(senderId);
  },
};
