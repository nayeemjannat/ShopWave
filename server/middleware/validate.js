import Joi from 'joi';

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const productSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required(),
  store: Joi.string().required(),
  description: Joi.string().max(2000).optional().allow(''),
  dynamicFields: Joi.object().unknown(true).optional(),
  variants: Joi.array().items(Joi.object().unknown(true)).optional(),
  nameBn: Joi.string().optional().allow(''),
  brand: Joi.string().optional().allow(''),
  images: Joi.array().items(Joi.string()).optional(),
  sku: Joi.string().optional().allow(''),
  isFeatured: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  flashSale: Joi.object().unknown(true).optional()
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(2),
  price: Joi.number().min(0),
  category: Joi.string(),
  stock: Joi.number().integer().min(0),
  description: Joi.string().max(2000).allow(''),
  dynamicFields: Joi.object().unknown(true),
  variants: Joi.array().items(Joi.object().unknown(true)),
  nameBn: Joi.string().allow(''),
  brand: Joi.string().allow(''),
  images: Joi.array().items(Joi.string()),
  sku: Joi.string().allow(''),
  isFeatured: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
  flashSale: Joi.object().unknown(true)
}).min(1);

export const orderSchema = Joi.object({
  items: Joi.array().min(1).required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    postalCode: Joi.string().optional().allow('')
  }).required(),
  paymentMethod: Joi.string().valid('sslcommerz', 'cod').required(),
  couponCode: Joi.string().optional().allow(''),
  storeId: Joi.string().required(),
  shippingMethod: Joi.string().optional().allow(''),
  shippingFee: Joi.number().optional().allow(null, '')
});
