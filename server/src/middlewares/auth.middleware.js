import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.model.js';

// ─── Protect: Require valid access token ─────────────────────────────────────

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract from Authorization header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Check user still exists
  const user = await User.findById(decoded.userId).select('+passwordChangedAt');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // Check if password was changed after token was issued
  if (user.wasPasswordChangedAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

// ─── Optional Auth: Attach user if token present, but don't block ────────────

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Ignore invalid token in optional auth
  }

  next();
});

// ─── Restrict: Role-based access control ─────────────────────────────────────

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

// ─── Require verified email ───────────────────────────────────────────────────

export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address to access this resource.', 403));
  }
  next();
};