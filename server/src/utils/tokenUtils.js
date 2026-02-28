import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ─── JWT Tokens ───────────────────────────────────────────────────────────────

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'taskhive',
    audience: 'taskhive-client',
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'taskhive',
    audience: 'taskhive-client',
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'taskhive',
    audience: 'taskhive-client',
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'taskhive',
    audience: 'taskhive-client',
  });
};

// ─── Crypto Tokens (email verify, password reset) ────────────────────────────

export const generateCryptoToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Store hashed version in DB, send raw to user
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

export const clearRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 0,
  path: '/', 
}); 