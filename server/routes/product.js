import express from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProducts, bulkImport, generateDescription } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, productSchema } from '../middleware/validate.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

router.use(protect);
router.use(authorize('storeAdmin', 'superAdmin'));

router.post('/', upload.array('images', 5), validate(productSchema), createProduct);
router.put('/:id', upload.array('images', 5), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/bulk-import', upload.single('file'), bulkImport);
router.post('/generate-description', generateDescription);

export default router;
