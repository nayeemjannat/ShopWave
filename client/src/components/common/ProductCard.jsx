import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addItemToCart } from '../../features/cart/cartSlice';
import { toggleWishlist, selectIsAuthenticated, selectCurrentUser } from '../../features/auth/authSlice';
import { selectIsModuleActive } from '../../features/store/storeSlice';
import { formatPrice, calculateDiscount } from '../../utils/formatters';
import { cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const StarRating = ({ rating, size = 'w-3.5 h-3.5' }) => (
  <div className={`flex gap-0.5 ${size}`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const ProductCard = memo(({ product, showCompare = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isCompareActive = useSelector(selectIsModuleActive('comparison'));

  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const {
    _id,
    name,
    price,
    images = [],
    flashSale = {},
    ratings = 0,
    numOfReviews = 0,
    stock = 0,
    slug,
  } = product;

  const isFlashSaleActive = flashSale?.isActive && new Date(flashSale?.endDate) > new Date();
  const activePrice = isFlashSaleActive ? flashSale.salePrice : price;
  const hasDiscount = isFlashSaleActive || (product.discountedPrice && product.discountedPrice < price);
  const discountPriceVal = isFlashSaleActive ? flashSale.salePrice : (product.discountedPrice || price);
  const discountPercentage = hasDiscount ? calculateDiscount(price, discountPriceVal) : 0;

  const imageSrc = cloudinaryCardUrl(images[0]) || 'https://via.placeholder.com/300?text=No+Image';

  const isInWishlist = user?.wishlist?.some(item => 
    typeof item === 'string' ? item === _id : item?._id === _id
  );

  const handleWishlistToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist');
      navigate('/login');
      return;
    }
    dispatch(toggleWishlist(_id))
      .unwrap()
      .then((res) => {
        toast.success(res.inWishlist ? 'Added to wishlist!' : 'Removed from wishlist!');
      })
      .catch((err) => {
        toast.error(err || 'Failed to update wishlist');
      });
  }, [_id, isAuthenticated, dispatch, navigate]);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    setIsAdding(true);
    dispatch(addItemToCart({ productId: _id, quantity: 1 }))
      .unwrap()
      .then(() => {
        toast.success('Added to cart!');
        setTimeout(() => setIsAdding(false), 800);
      })
      .catch((err) => {
        toast.error(err || 'Failed to add item to cart');
        setIsAdding(false);
      });
  }, [_id, stock, dispatch]);

  const getCompareItems = () => {
    try {
      return JSON.parse(localStorage.getItem('shopwave_compare') || '[]');
    } catch {
      return [];
    }
  };

  const [isCompared, setIsCompared] = useState(() => {
    const list = getCompareItems();
    return list.some(item => item._id === _id);
  });

  const handleCompareChange = useCallback((e) => {
    e.stopPropagation();
    const list = getCompareItems();
    if (e.target.checked) {
      if (list.length >= 4) {
        toast.error('You can compare up to 4 products only.');
        return;
      }
      const newList = [...list, product];
      localStorage.setItem('shopwave_compare', JSON.stringify(newList));
      setIsCompared(true);
      toast.success('Added to comparison list!');
    } else {
      const newList = list.filter(item => item._id !== _id);
      localStorage.setItem('shopwave_compare', JSON.stringify(newList));
      setIsCompared(false);
      toast.success('Removed from comparison list!');
    }
  }, [_id, product]);

  return (
    <div className="group relative bg-surface border border-border rounded-2xl overflow-hidden shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 flex flex-col h-full">
      {/* Product Image */}
      <Link to={`/product/${_id}/${slug || 'product'}`} className="block relative aspect-square overflow-hidden bg-ghost">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-xl"
          loading="lazy"
        />

        {stock <= 0 && (
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-danger text-white text-badge font-bold uppercase px-3 py-1.5 rounded tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {stock > 0 && hasDiscount && (
          <div className="absolute top-3 left-3 bg-danger text-white text-badge font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm uppercase tracking-wide">
            <span>-{discountPercentage}%</span>
          </div>
        )}

        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 btn-icon bg-white/80 backdrop-blur-md"
          aria-label="Toggle Wishlist"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isInWishlist ? 'fill-danger text-danger scale-110' : 'text-muted'}`}
            fill={isInWishlist ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <StarRating rating={ratings} />
        {numOfReviews > 0 && (
          <span className="text-label text-muted ml-0.5">({numOfReviews})</span>
        )}

        <Link
          to={`/product/${_id}/${slug || 'product'}`}
          className="block mb-1.5 text-h3 text-ink line-clamp-2 hover:text-primary transition-colors duration-150"
        >
          {name}
        </Link>

        {product.dynamicFields && Object.keys(product.dynamicFields).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(product.dynamicFields).slice(0, 2).map(([key, val]) => (
              <span key={key} className="text-badge bg-ghost border border-border text-muted px-2 py-0.5 rounded font-medium uppercase">
                {key}: {val}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-price text-ink">
              {formatPrice(activePrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>

          {/* Compare checkbox row (always visible) */}
          {isCompareActive && showCompare && (
            <div className="mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-label text-muted">
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={handleCompareChange}
                  className="custom-checkbox"
                />
                <span>Compare</span>
              </label>
            </div>
          )}

          {/* Add to Cart - slides up on hover (desktop), always visible (mobile) */}
          <div className="md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200">
            <button
              onClick={handleAddToCart}
              disabled={stock <= 0 || isAdding}
              className={`w-full h-10 px-3 rounded-10px text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 ${
                stock <= 0
                  ? 'bg-ghost text-muted cursor-not-allowed border border-border'
                  : isAdding
                  ? 'bg-secondary text-white'
                  : 'btn-primary btn-md w-full'
              }`}
            >
              {isAdding ? (
                <>
                  <svg className="w-4 h-4 animate-cart-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added!</span>
                </>
              ) : stock <= 0 ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
