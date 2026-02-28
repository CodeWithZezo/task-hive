import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

// POST /api/v1/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully. Please check your email to verify your account.',
    data: { user },
  });
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'];

  const { user, accessToken } = await authService.loginUser({ email, password, deviceInfo, res });

  sendSuccess(res, {
    message: 'Logged in successfully.',
    data: { user, accessToken },
  });
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const userId = req.user?._id;

  await authService.logoutUser({ userId, refreshToken, res });

  sendSuccess(res, { message: 'Logged out successfully.' });
});

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const { accessToken, user } = await authService.refreshAccessToken({ refreshToken, res });

  sendSuccess(res, {
    message: 'Access token refreshed.',
    data: { accessToken, user },
  });
});

// GET /api/v1/auth/me
export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'User fetched successfully.',
    data: { user: req.user },
  });
});

// POST /api/v1/auth/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, id } = req.query;
  const user = await authService.verifyEmail({ token, userId: id });

  sendSuccess(res, {
    message: 'Email verified successfully.',
    data: { user },
  });
});

// POST /api/v1/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationEmail({ email });

  // Always return success to prevent email enumeration
  sendSuccess(res, {
    message: 'If this email is registered and unverified, a verification link has been sent.',
  });
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword({ email });

  sendSuccess(res, {
    message: 'If an account with this email exists, a password reset link has been sent.',
  });
});

// POST /api/v1/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, id } = req.query;
  const { password } = req.body;

  await authService.resetPassword({ token, userId: id, password, res });

  sendSuccess(res, {
    message: 'Password reset successfully. Please log in with your new password.',
  });
});