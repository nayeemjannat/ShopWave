import express from 'express';
import { createReview, getProductReviews, approveReview, rejectReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.use(protect);
router.post('/', createReview);

router.use(authorize('storeAdmin', 'superAdmin'));
router.put('/:id/approve', approveReview);
router.put('/:id/reject', rejectReview);

export default router;
