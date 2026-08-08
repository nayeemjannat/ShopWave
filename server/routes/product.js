import express from 'express';
import multer from 'multer';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProducts, bulkImport, generateDescription } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, productSchema, productUpdateSchema } from '../middleware/validate.js';
import { upload } from '../config/cloudinary.js';

const uploadCSV = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

router.use(protect);
router.use(authorize('storeAdmin', 'superAdmin'));

router.post('/', upload.array('images', 5), validate(productSchema), createProduct);
router.put('/:id', upload.array('images', 5), validate(productUpdateSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/bulk-import', uploadCSV.single('file'), bulkImport);
router.post('/generate-description', generateDescription);

export default router;
