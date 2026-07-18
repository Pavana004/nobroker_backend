import bcrypt from "bcrypt";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import {
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

interface DeviceContext {
  userAgent?: string;
  ipAddress?: string;
}

async function issueTokenPair(
  user: { id: string; role: string },
  ctx: DeviceContext,
) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
    userAgent: ctx.userAgent,
    ipAddress: ctx.ipAddress,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, ctx: DeviceContext) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      env.BCRYPT_SALT_ROUNDS,
    );

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });

    const tokens = await issueTokenPair(user, ctx);
    return { user: userRepository.toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput, ctx: DeviceContext) {
    const user = await userRepository.findByEmail(input.email);

    // Same error message whether the email doesn't exist or the password is
    // wrong — prevents leaking which emails are registered (user enumeration).
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw AppError.forbidden("This account has been deactivated");
    }

    const tokens = await issueTokenPair(user, ctx);
    return { user: userRepository.toPublicUser(user), ...tokens };
  },

  // Refresh Token Rotation: every time a refresh token is used, it is
  // immediately revoked and a brand-new refresh token is issued in its
  // place. If someone ever presents an already-revoked token, that's proof
  // a token was stolen and used twice — we respond by revoking the *entire*
  // session family for that user, forcing re-login everywhere.
  async refresh(rawToken: string, ctx: DeviceContext) {
    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    const tokenHash = hashToken(rawToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    if (!stored) {
      throw AppError.unauthorized("Refresh token not recognized");
    }

    if (stored.isRevoked) {
      // Reuse of a rotated-out token — likely theft. Nuke every active
      // session for this user as a precaution.
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw AppError.unauthorized("Session invalidated. Please log in again.");
    }

    if (stored.expiresAt < new Date()) {
      throw AppError.unauthorized(
        "Refresh token expired. Please log in again.",
      );
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Account no longer active");
    }

    const newAccessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id, role: user.role });

    const newRecord = await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: refreshExpiryDate(),
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });

    await refreshTokenRepository.revoke(stored.id, newRecord.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const stored = await refreshTokenRepository.findByHash(hashToken(rawToken));
    if (stored && !stored.isRevoked) {
      await refreshTokenRepository.revoke(stored.id);
    }
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("User not found");
    return userRepository.toPublicUser(user);
  },
};
