import { Request, Response } from "express";
import { env, isProd } from "../config/env";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/apiResponse";

// httpOnly + Secure + SameSite=strict cookie for the refresh token.
// httpOnly -> inaccessible to JS, immune to XSS token theft.
// SameSite=strict -> not sent on cross-site requests, mitigates CSRF.
// The access token, by contrast, is returned in the JSON body and kept in
// memory (e.g. a Zustand store) on the frontend — never localStorage, which
// is readable by any injected script. See docs/AUTH_STRATEGY.md.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function deviceContext(req: Request) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.register(
      req.body,
      deviceContext(req),
    );
    res.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    res
      .status(201)
      .json(success("Account created successfully", { user, accessToken }));
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
      deviceContext(req),
    );
    res.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    res.status(200).json(success("Login successful", { user, accessToken }));
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
    if (!rawToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }
    const { accessToken, refreshToken } = await authService.refresh(
      rawToken,
      deviceContext(req),
    );
    res.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );
    return res.status(200).json(success("Token refreshed", { accessToken }));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
    await authService.logout(rawToken);
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { path: "/api/auth" });
    res.status(200).json(success("Logged out successfully", null));
  }),

  profile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.getProfile(req.user!.id);
    res.status(200).json(success("Profile fetched", profile));
  }),
};
