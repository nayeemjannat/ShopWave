import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const applyThemeToDOM = (config) => {
  if (!config) return;
  document.documentElement.style.setProperty('--primary', config.primaryColor || '#534AB7');
  document.documentElement.style.setProperty('--secondary', config.secondaryColor || '#1D9E75');
  document.documentElement.style.setProperty('--font', config.fontFamily || 'Inter');
  document.documentElement.style.setProperty('--primary-hover', config.primaryHover || '#3d358a');
};

export const fetchStoreConfig = createAsyncThunk('store/fetchConfig', async (slug, { rejectWithValue }) => {
  try {
    const endpoint = slug ? `/api/v1/store/${slug}/config` : '/api/v1/store/config';
    const data = await axiosInstance.get(endpoint);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch store config');
  }
});

const defaultConfig = {
  primaryColor: '#534AB7',
  secondaryColor: '#1D9E75',
  fontFamily: 'Inter',
  logo: '',
  bannerImages: [],
  activeModules: [],
  currency: 'BDT',
  language: 'en',
};

const storeSlice = createSlice({
  name: 'store',
  initialState: {
    config: defaultConfig,
    storeType: null,
    storeName: '',
    slug: '',
    isLoading: false,
    error: null,
  },
  reducers: {
    updateConfigLocal: (state, action) => {
      state.config = { ...state.config, ...action.payload };
      applyThemeToDOM(state.config);
    },
    applyTheme: (state) => {
      applyThemeToDOM(state.config);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreConfig.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchStoreConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        const { config, storeType, name, id, slug } = action.payload;
        const payloadStore = action.payload.store;
        
        if (config || payloadStore) {
          state.config = {
            ...defaultConfig,
            ...(config || payloadStore?.theme || payloadStore?.config || {}),
            storeId: id || payloadStore?._id || payloadStore?.id,
          };
          state.storeType = storeType || payloadStore?.type || payloadStore?.storeType;
          state.storeName = name || payloadStore?.name;
          // Use slug from API response, then from dispatch arg, then fallback to 'demo'
          state.slug = slug || payloadStore?.slug || action.meta.arg || 'demo';
          state.storeId = id || payloadStore?._id || payloadStore?.id;
          applyThemeToDOM(state.config);
        }
      })
      .addCase(fetchStoreConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { updateConfigLocal, applyTheme } = storeSlice.actions;

// Selectors
export const selectStoreConfig = (state) => state.store.config;
export const selectStoreType = (state) => state.store.storeType;
export const selectStoreName = (state) => state.store.storeName;
export const selectStoreId = (state) => state.store.storeId;
export const selectStoreSlug = (state) => state.store.slug;
export const selectActiveModules = (state) => state.store.config.activeModules;
export const selectIsModuleActive = (moduleName) => (state) =>
  state.store.config.activeModules?.includes(moduleName) || false;

export default storeSlice.reducer;
