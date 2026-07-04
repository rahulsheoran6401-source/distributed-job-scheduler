import { Router } from 'express';
import { register, login, getMe, updateProfile, updatePassword, registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Rate limit: 5 requests per minute for auth endpoints
const authLimiter = rateLimiter({ limit: 5, windowSeconds: 60, keyPrefix: 'auth' });

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

router.use(requireAuth);
router.get('/me', getMe);
router.put('/update', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(updatePasswordSchema), updatePassword);

export default router;
