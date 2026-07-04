import express from 'express';
import { placeOrder, sslcommerzSuccess, sslcommerzFailCancel, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus, validateCoupon } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, orderSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/sslcommerz/success', sslcommerzSuccess);
router.post('/sslcommerz/fail', sslcommerzFailCancel);
router.post('/sslcommerz/cancel', sslcommerzFailCancel);

router.use(protect);

router.post('/validate-coupon', validateCoupon);
router.post('/', validate(orderSchema), placeOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

router.use(authorize('storeAdmin', 'superAdmin'));
router.get('/', getAllOrders);
router.put('/:id/status', updateOrderStatus);

export default router;
