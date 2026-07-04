import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../../features/auth/authSlice';
import { addItemToCart } from '../../features/cart/cartSlice';
import ProductCard from '../../components/common/ProductCard';
import axiosInstance from '../../utils/axiosInstance';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const imageContainerRef = useRef(null);
  const reviewsRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const productRes = await axiosInstance.get(`/api/v1/products/${id}`, { signal: controller.signal });
        if (productRes.success && productRes.product) {
          const prod = productRes.product;
          setProduct(prod);
          setActiveImage(prod.images?.[0] || 'https://via.placeholder.com/400');
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          const relatedRes = await axiosInstance.get(
            `/api/v1/products?storeId=${prod.store}&category=${encodeURIComponent(prod.category)}&limit=4`,
            { signal: controller.signal }
          );
          if (relatedRes.success) {
            setRelatedProducts(relatedRes.products?.filter(p => p._id !== id) || []);
          }

          const reviewsRes = await axiosInstance.get(`/api/v1/reviews/product/${id}`, { signal: controller.signal });
          if (reviewsRes.success) {
            setReviews(reviewsRes.reviews || []);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
    return () => controller.abort();
  }, [id]);

  const handleAddToCart = useCallback((e, redirect = false) => {
    e.preventDefault();
    if (!product || product.stock <= 0) {
      return toast.error('Product is out of stock');
    }

    setIsAdding(true);
    const cartPayload = {
      productId: product._id,
      quantity,
      variantName: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : undefined,
      price: selectedVariant?.price || undefined
    };

    dispatch(addItemToCart(cartPayload))
      .unwrap()
      .then(() => {
        toast.success('Added to cart!');
        setIsAdding(false);
        if (redirect) {
          navigate('/checkout');
        }
      })
      .catch((err) => {
        toast.error(err || 'Failed to add item to cart');
        setIsAdding(false);
      });
  }, [product, quantity, selectedVariant, dispatch, navigate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please write a comment');
    setIsSubmittingReview(true);
    try {
      const res = await axiosInstance.post('/api/v1/reviews', {
        product: id,
        rating,
        comment
      });
      if (res.success) {
        toast.success('Review submitted successfully!');
        setComment('');
        const reviewsRes = await axiosInstance.get(`/api/v1/reviews/product/${id}`);
        if (reviewsRes.success) {
          setReviews(reviewsRes.reviews || []);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name || 'ShopWave', url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  }, [product]);

  const handleMouseMove = useCallback((e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const scrollToReviews = useCallback(() => {
    setActiveTab('reviews');
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-surface">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-sm font-bold text-ink mt-4">Product Not Found</h2>
        <Link to="/shop" className="btn-primary btn-md mt-4">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isFlashSaleActive = product.flashSale?.isActive && new Date(product.flashSale?.endDate) > new Date();
  const currentBasePrice = selectedVariant?.price || product.price;
  const activePrice = isFlashSaleActive ? product.flashSale.salePrice : currentBasePrice;
  const hasDiscount = isFlashSaleActive || (product.discountedPrice && product.discountedPrice < product.price);
  const totalImages = product.images?.length || 1;
  const currentImageIndex = (product.images || []).indexOf(activeImage) + 1;

  const reviewDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (dist[r.rating] !== undefined) dist[r.rating]++;
    });
    return dist;
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return product.ratings?.average || 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews, product.ratings?.average]);

  const canReview = isAuthenticated;

  const getStockStatus = () => {
    if (product.stock <= 0) return { text: 'Out of Stock', icon: '✗', color: 'text-danger' };
    if (product.stock <= 3) return { text: `Only ${product.stock} left`, icon: '⚠', color: 'text-warning' };
    return { text: 'In Stock', icon: '✓', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 pb-24 md:pb-12">
      {/* Product Top Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
            className="relative aspect-square bg-surface border border-border rounded-2xl overflow-hidden shadow-card group"
          >
            {/* Flash badge */}
            {isFlashSaleActive && (
              <span className="absolute top-3 left-3 z-10 bg-warning text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                Flash Sale
              </span>
            )}
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-opacity md:group-hover:scale-150 md:group-hover:opacity-0 pointer-events-none"
              style={{ transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
            />
            {/* Zoom overlay */}
            <img
              src={activeImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ transform: 'scale(2)', transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
            />
            {/* Image count overlay */}
            {totalImages > 1 && (
              <div className="absolute bottom-3 right-3 bg-ink/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                {currentImageIndex} / {totalImages}
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden bg-surface border flex-shrink-0 ${
                    activeImage === img ? 'border-primary border-2 shadow-sm' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Specifications */}
        <div className="flex flex-col space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-ink font-semibold truncate max-w-[180px]">{product.name}</span>
          </nav>

          <div className="space-y-2">
            {/* Brand badge */}
            {product.brand && (
              <button
                onClick={() => navigate(`/shop?brand=${encodeURIComponent(product.brand)}`)}
                className="text-[10px] font-bold text-muted bg-ghost border border-border px-2.5 py-0.5 rounded-full hover:bg-border transition-colors"
              >
                {product.brand}
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-black text-ink leading-tight line-clamp-3">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-500 font-bold text-base">
                {'★'.repeat(Math.round(avgRating))}
                {'☆'.repeat(5 - Math.round(avgRating))}
              </span>
              <button
                onClick={scrollToReviews}
                className="text-muted font-bold hover:text-primary transition-colors"
              >
                ({avgRating.toFixed(1)}) {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </button>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="flex items-baseline gap-3">
            <span className="text-[28px] font-black text-primary">
              {formatPrice(activePrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted line-through">
                  {formatPrice(currentBasePrice)}
                </span>
                <span className="text-[10px] font-bold text-white bg-warning px-2 py-0.5 rounded-full">
                  {Math.round(((currentBasePrice - activePrice) / currentBasePrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock status */}
          <div className={`flex items-center gap-1.5 text-xs font-bold ${stockStatus.color}`}>
            <span>{stockStatus.icon}</span>
            <span>{stockStatus.text}</span>
          </div>

          {/* Variants selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest">Select Variant</h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => {
                      setSelectedVariant(v);
                      if (v.stock > 0) setQuantity(1);
                    }}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all duration-200 ${
                      selectedVariant?._id === v._id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-ink/70 hover:border-primary/30'
                    }`}
                  >
                    {v.name}: {v.value} ({formatPrice(v.price)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Buy Actions */}
          <div className="space-y-4 pt-4 border-t border-border">
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted uppercase tracking-widest">Quantity:</span>
                <div className="flex items-center border border-border rounded-xl overflow-hidden bg-surface">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 hover:bg-ghost text-xs font-bold h-10 min-w-[36px]"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-extrabold w-12 text-center select-none h-10 flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || product.stock, quantity + 1))}
                    className="px-3 py-1.5 hover:bg-ghost text-xs font-bold h-10 min-w-[36px]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart - full width primary */}
            <button
              onClick={(e) => handleAddToCart(e, false)}
              disabled={product.stock <= 0 || isAdding}
              className={`btn-primary btn-lg w-full ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* Wishlist + Compare */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsInWishlist(!isInWishlist)}
                className={`btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5 ${isInWishlist ? 'text-danger border-danger/30' : ''}`}
              >
                <svg className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs">{isInWishlist ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
              <button
                onClick={() => setIsInCompare(!isInCompare)}
                className={`btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5 ${isInCompare ? 'text-primary border-primary/30' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs">{isInCompare ? 'Comparing' : 'Compare'}</span>
              </button>
            </div>

            {/* Share btn */}
            <button
              onClick={handleShare}
              className="btn-ghost btn-sm w-full flex items-center justify-center gap-1.5 text-muted"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div ref={reviewsRef} className="border-t border-border pt-8 scroll-mt-24">
        {/* Tab Header */}
        <div className="flex border-b border-border gap-6 mb-6">
          {[
            { key: 'description', label: 'Description' },
            { key: 'specifications', label: 'Specifications' },
            { key: 'reviews', label: `Reviews (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="min-h-[150px]">
          {activeTab === 'description' && (
            <div className="text-xs text-ink/80 leading-relaxed max-w-none">
              <div className={`whitespace-pre-line ${!expandedDesc ? 'max-h-[400px] overflow-hidden relative' : ''}`}>
                {product.description || 'No description available.'}
                {!expandedDesc && product.description && product.description.length > 400 && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent"></div>
                )}
              </div>
              {product.description && product.description.length > 400 && (
                <button
                  onClick={() => setExpandedDesc(!expandedDesc)}
                  className="text-primary font-bold text-xs mt-2 hover:underline"
                >
                  {expandedDesc ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-xl border border-border rounded-xl overflow-hidden bg-surface">
              {product.dynamicFields && Object.keys(product.dynamicFields).length > 0 ? (
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    {Object.entries(product.dynamicFields).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-ghost/50' : 'bg-surface'}>
                        <td className="w-1/3 p-3 font-bold text-muted capitalize">{key}</td>
                        <td className="p-3 text-ink font-semibold">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-xs text-muted font-medium">No specifications available.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 max-w-3xl">
              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div className="flex items-start gap-8 p-5 bg-ghost/30 border border-border rounded-2xl">
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-black text-ink">{avgRating.toFixed(1)}</div>
                    <div className="text-amber-500 font-bold text-sm mt-1">
                      {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewDistribution[star];
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-ink w-6 text-right">{star}★</span>
                          <div className="flex-1 h-2.5 bg-ghost rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="text-muted w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Write Review Form */}
              {canReview && (
                <form onSubmit={handleReviewSubmit} className="bg-surface border border-border p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Write a review</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted">Rating:</span>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="input-field text-xs font-bold px-2.5 py-1.5"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Very Poor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="3"
                      placeholder="Write your feedback..."
                      className="textarea-field text-xs"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn-primary btn-md"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {!isAuthenticated && (
                <p className="text-xs text-muted italic bg-ghost/30 p-4 rounded-xl border border-border">
                  Please <Link to="/login" className="text-primary underline font-bold">login</Link> to write a customer review.
                </p>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Customer Feedback ({reviews.length})</h3>
                {reviews.length === 0 ? (
                  <p className="text-xs text-muted italic">No reviews yet for this product. Be the first to share your thoughts!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r._id} className="p-4 border border-border rounded-2xl bg-surface space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-ink">{r.user?.name || 'Anonymous'}</span>
                        <span className="text-muted text-[10px]">{formatDate(r.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-xs">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                        {r.isVerifiedPurchase && (
                          <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">Verified</span>
                        )}
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border pt-10 space-y-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-ink">Related Products</h2>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Other popular choices</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-border px-4 py-3 shadow-sticky">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-lg font-black text-primary">{formatPrice(activePrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted line-through ml-2">{formatPrice(currentBasePrice)}</span>
            )}
          </div>
          <button
            onClick={(e) => handleAddToCart(e, false)}
            disabled={product.stock <= 0 || isAdding}
            className={`btn-primary btn-md flex-shrink-0 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
