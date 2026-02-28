import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', validate(forgotPasswordSchema), authController.resendVerification);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.use(protect);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

export default router;