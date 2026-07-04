import express from 'express';
import { register, login, logout, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
