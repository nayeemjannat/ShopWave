import express from 'express';
import { getStoreConfig, updateStoreConfig, getAnalytics, getGlobalAnalytics, createStore, createStoreWithAdmin, getAllStores, getPaymentCredentials, updatePaymentCredentials, getCoupons, createCoupon, deleteCoupon } from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getStoreConfig);
router.get('/:slug/config', getStoreConfig);

router.use(protect);

router.put('/config', authorize('storeAdmin', 'superAdmin'), updateStoreConfig);
router.get('/analytics', authorize('storeAdmin', 'superAdmin'), getAnalytics);
router.get('/analytics/global', authorize('superAdmin'), getGlobalAnalytics);
router.get('/coupons', authorize('storeAdmin', 'superAdmin'), getCoupons);
router.post('/coupons', authorize('storeAdmin', 'superAdmin'), createCoupon);
router.delete('/coupons/:id', authorize('storeAdmin', 'superAdmin'), deleteCoupon);

router.get('/all', authorize('superAdmin'), getAllStores);
router.post('/', authorize('superAdmin'), createStoreWithAdmin);
router.post('/assign', authorize('superAdmin'), createStore);
router.get('/:id/payment', authorize('superAdmin'), getPaymentCredentials);
router.put('/:id/payment', authorize('superAdmin'), updatePaymentCredentials);

export default router;
