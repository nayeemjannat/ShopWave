import express from 'express';
import { updateProfile, updatePassword, toggleWishlist, getWishlist, getLoyaltyPoints, getReferralInfo, getAllUsers, banUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/wishlist', toggleWishlist);
router.get('/wishlist', getWishlist);
router.get('/loyalty', getLoyaltyPoints);
router.get('/referrals', getReferralInfo);

router.use(authorize('superAdmin'));
router.get('/', getAllUsers);
router.put('/:id/ban', banUser);

export default router;
