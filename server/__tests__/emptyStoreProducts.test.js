import { jest } from '@jest/globals';

jest.unstable_mockModule('../models/Product.js', () => ({
  default: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

const Product = (await import('../models/Product.js')).default;
const { getProducts } = await import('../controllers/productController.js');

function mockQuery(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockResolvedValue(result),
  };
}

describe('GET /api/v1/products?storeId=<new_store> — empty product list', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('fresh store with no products → count:0, products:[], error-free', async () => {
    Product.countDocuments.mockResolvedValue(0);
    Product.find.mockReturnValue(mockQuery([]));

    req.query = { storeId: 'newstore123', page: '1', limit: '12' };

    await getProducts(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 0,
      pagination: { page: 1, pages: 0, total: 0 },
      products: [],
    });
  });

  test('established store with products returns normally', async () => {
    const products = [
      { _id: 'p1', name: 'Product 1', price: 100, store: 'store1' },
      { _id: 'p2', name: 'Product 2', price: 200, store: 'store1' },
    ];
    Product.countDocuments.mockResolvedValue(2);
    Product.find.mockReturnValue(mockQuery(products));

    req.query = { storeId: 'store1' };

    await getProducts(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      pagination: { page: 1, pages: 1, total: 2 },
      products,
    });
  });

  test('no storeId returns all active products', async () => {
    Product.countDocuments.mockResolvedValue(5);
    Product.find.mockReturnValue(mockQuery([{ _id: 'p1', name: 'All Store Product' }]));

    req.query = {};

    await getProducts(req, res, next);

    expect(Product.countDocuments).toHaveBeenCalledWith({ isActive: true });
    expect(Product.find).toHaveBeenCalledWith({ isActive: true });
  });

  test('pagination math for empty result', async () => {
    Product.countDocuments.mockResolvedValue(0);
    Product.find.mockReturnValue(mockQuery([]));

    req.query = { storeId: 'empty_store', page: '3', limit: '10' };

    await getProducts(req, res, next);

    /* 0 products → pages = ceil(0/10) = 0 */
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { page: 3, pages: 0, total: 0 },
      }),
    );
  });
});
