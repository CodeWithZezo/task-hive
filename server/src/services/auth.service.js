import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateCryptoToken,
  hashToken,
  getRefreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
} from '../utils/tokenUtils.js';
import { sendEmail } from '../utils/emailUtils.js';
import logger from '../utils/logger.js';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Generate email verification token
  const { rawToken, hashedToken } = generateCryptoToken();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: expiry,
  });

  // Send verification email
  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${rawToken}&id=${user._id}`;
  await sendEmail({
    to: user.email,
    templateName: 'verifyEmail',
    templateData: { name: user.name, verifyUrl },
  });

  logger.info(`User registered: ${user.email}`);
  return user;
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password, deviceInfo, res }) => {
  // Find user and include password field
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Generate tokens
  const tokenPayload = { userId: user._id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token (hashed) in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const { hashedToken } = hashRefreshToken(refreshToken);
  user.addRefreshToken(hashedToken, deviceInfo || 'Unknown device', expiresAt);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  return { user, accessToken };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshAccessToken = async ({ refreshToken, res }) => {
  if (!refreshToken) {
    throw new AppError('No refresh token provided.', 401);
  }

  // Verify the refresh token JWT
  const decoded = verifyRefreshToken(refreshToken);

  // Find user and check stored tokens
  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user || !user.isActive) {
    throw new AppError('Invalid refresh token.', 401);
  }

  // Check token exists in DB (hashed comparison)
  const { hashedToken } = hashRefreshToken(refreshToken);
  const storedToken = user.refreshTokens.find((t) => t.token === hashedToken);

  if (!storedToken || storedToken.expiresAt < new Date()) {
    // Potential token reuse — revoke ALL tokens (security measure)
    user.removeAllRefreshTokens();
    await user.save({ validateBeforeSave: false });
    res.clearCookie('refreshToken', clearRefreshTokenCookieOptions());
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  // Rotate refresh token (replace old with new)
  user.removeRefreshToken(hashedToken);
  const newRefreshToken = generateRefreshToken({ userId: user._id, role: user.role });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { hashedToken: newHashedToken } = hashRefreshToken(newRefreshToken);
  user.addRefreshToken(newHashedToken, storedToken.deviceInfo, expiresAt);
  await user.save({ validateBeforeSave: false });

  // New access token
  const accessToken = generateAccessToken({ userId: user._id, role: user.role });

  // Rotate cookie
  res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

  return { accessToken, user };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async ({ userId, refreshToken, res }) => {
  if (userId && refreshToken) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (user) {
      const { hashedToken } = hashRefreshToken(refreshToken);
      user.removeRefreshToken(hashedToken);
      await user.save({ validateBeforeSave: false });
    }
  }
  res.clearCookie('refreshToken', clearRefreshTokenCookieOptions());
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = async ({ token, userId }) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    _id: userId,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationTokenExpiry');

  if (!user) {
    throw new AppError('Invalid or expired verification link. Please request a new one.', 400);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  await sendEmail({
    to: user.email,
    templateName: 'welcomeEmail',
    templateData: { name: user.name },
  }).catch((err) => logger.error('Failed to send welcome email:', err));

  logger.info(`Email verified: ${user.email}`);
  return user;
};

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerificationEmail = async ({ email }) => {
  const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationTokenExpiry');

  if (!user) {
    // Don't reveal user existence
    return;
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  // Rate limit: don't send if token was created in last 5 minutes
  if (
    user.emailVerificationTokenExpiry &&
    user.emailVerificationTokenExpiry > new Date(Date.now() + 23.9 * 60 * 60 * 1000)
  ) {
    throw new AppError('A verification email was recently sent. Please wait a few minutes.', 429);
  }

  const { rawToken, hashedToken } = generateCryptoToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${rawToken}&id=${user._id}`;
  await sendEmail({
    to: user.email,
    templateName: 'verifyEmail',
    templateData: { name: user.name, verifyUrl },
  });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal user existence
    logger.warn(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  const { rawToken, hashedToken } = generateCryptoToken();
  user.passwordResetToken = hashedToken;
  user.passwordResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${rawToken}&id=${user._id}`;

  await sendEmail({
    to: user.email,
    templateName: 'passwordReset',
    templateData: { name: user.name, resetUrl },
  });

  logger.info(`Password reset email sent to: ${email}`);
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async ({ token, userId, password, res }) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    _id: userId,
    passwordResetToken: hashedToken,
    passwordResetTokenExpiry: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetTokenExpiry +refreshTokens');

  if (!user) {
    throw new AppError('Invalid or expired password reset link. Please request a new one.', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiry = undefined;

  // Revoke all refresh tokens on password reset (security)
  user.removeAllRefreshTokens();
  await user.save();

  // Clear refresh token cookie
  res.clearCookie('refreshToken', clearRefreshTokenCookieOptions());

  // Notify user
  await sendEmail({
    to: user.email,
    templateName: 'passwordChanged',
    templateData: { name: user.name },
  }).catch((err) => logger.error('Failed to send password changed email:', err));

  logger.info(`Password reset for: ${user.email}`);
  return user;
};

// ─── Internal helper ──────────────────────────────────────────────────────────

const hashRefreshToken = (token) => {
  return { hashedToken: hashToken(token) };
};