import express from 'express';
import { createReview, getProductReviews, getAllReviews, approveReview, rejectReview, deleteReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.use(protect);
router.post('/', createReview);

router.use(authorize('storeAdmin', 'superAdmin'));
router.get('/', getAllReviews);
router.put('/:id/approve', approveReview);
router.put('/:id/reject', rejectReview);
router.delete('/:id', deleteReview);

export default router;
