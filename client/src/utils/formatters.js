export const formatPrice = (amount, currency = 'BDT') => {
  if (currency === 'BDT') {
    return `৳${new Intl.NumberFormat('en-IN').format(amount)}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const formatDate = (dateString, format = 'short') => {
  const date = new Date(dateString);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const formatOrderStatus = (status) => {
  const map = {
    pending: { label: 'Pending', color: 'gray', icon: 'ti-clock' },
    processing: { label: 'Processing', color: 'amber', icon: 'ti-settings' },
    shipped: { label: 'Shipped', color: 'blue', icon: 'ti-truck' },
    delivered: { label: 'Delivered', color: 'green', icon: 'ti-check' },
    cancelled: { label: 'Cancelled', color: 'red', icon: 'ti-close' },
  };
  return map[status.toLowerCase()] || { label: status, color: 'gray', icon: 'ti-help' };
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round((1 - salePrice / originalPrice) * 100);
};

export const timeUntil = (endDate) => {
  const diff = new Date(endDate).getTime() - new Date().getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};
