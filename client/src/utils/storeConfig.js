export const MODULE_MAP = {
  electronics: ['specPanel', 'comparison', 'brandFilter', 'warrantyBadge'],
  clothing: ['sizeChart', 'colorSwatch', 'genderFilter', 'fitGuide'],
  beauty: ['ingredientList', 'skinTypeFilter', 'routineBuilder', 'certBadge'],
  grocery: ['freshnessBadge', 'qtyUnit', 'deliverySlot', 'nutritionInfo'],
  digital: ['instantDownload', 'licenseKey', 'previewModal'],
  multi: ['specPanel', 'comparison', 'sizeChart', 'colorSwatch', 'ingredientList', 'freshnessBadge', 'instantDownload', 'categoryTree', 'warrantyBadge'],
};

export const DYNAMIC_FIELDS_CONFIG = {
  electronics: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'ram', label: 'RAM', type: 'text' },
    { key: 'storage', label: 'Storage', type: 'text' },
    { key: 'warranty', label: 'Warranty', type: 'text' }
  ],
  clothing: [
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'sizes', label: 'Sizes', type: 'multiselect', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { key: 'colors', label: 'Colors', type: 'multiselect', options: ['Red', 'Blue', 'Green', 'Black', 'White'] }
  ],
  beauty: [
    { key: 'skinType', label: 'Skin Type', type: 'multiselect', options: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'] },
    { key: 'ingredients', label: 'Key Ingredients', type: 'text' },
    { key: 'volume', label: 'Volume/Weight', type: 'text' }
  ],
  grocery: [
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'weight', label: 'Weight/Volume', type: 'text' },
    { key: 'organic', label: 'Is Organic?', type: 'boolean' }
  ],
  digital: [
    { key: 'fileFormat', label: 'File Format', type: 'text' },
    { key: 'fileSize', label: 'File Size', type: 'text' },
    { key: 'version', label: 'Version', type: 'text' }
  ],
  multi: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'warranty', label: 'Warranty', type: 'text' }
  ]
};

export const getModulesForStore = (storeType) => {
  return MODULE_MAP[storeType] || [];
};

export const getDynamicFieldsConfig = (storeType) => {
  return DYNAMIC_FIELDS_CONFIG[storeType] || [];
};

export const isModuleActive = (activeModules, moduleName) => {
  if (!activeModules) return false;
  return activeModules.includes(moduleName);
};
