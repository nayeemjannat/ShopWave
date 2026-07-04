const CLOUDINARY_DOMAIN = 'res.cloudinary.com';

export const cloudinaryUrl = (url, options = {}) => {
  if (!url || !url.includes(CLOUDINARY_DOMAIN)) return url;

  const { width = 400, quality = 'auto', format = 'auto' } = options;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transforms = [`w_${width}`, `q_${quality}`, `f_${format}`].join(',');
  return `${parts[0]}/upload/${transforms}/${parts[1]}`;
};

export const cloudinaryHeroUrl = (url) => cloudinaryUrl(url, { width: 1400 });
export const cloudinaryCardUrl = (url) => cloudinaryUrl(url, { width: 400 });
export const cloudinaryThumbUrl = (url) => cloudinaryUrl(url, { width: 100 });
