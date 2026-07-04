import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const recalcTotals = (items) => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: items.reduce((sum, i) => {
    const price = i.product?.flashSale?.isActive ? i.product.flashSale.salePrice : (i.product?.price || 0);
    return sum + price * i.quantity;
  }, 0),
});

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.get('/api/v1/cart');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addItemToCart = createAsyncThunk('cart/addItem', async (item, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.post('/api/v1/cart', item);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add item');
  }
});

export const updateItem = createAsyncThunk('cart/updateItem', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.put(`/api/v1/cart/${itemId}`, { quantity });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update item');
  }
});

export const removeItem = createAsyncThunk('cart/removeItem', async (itemId, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.delete(`/api/v1/cart/${itemId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    totalItems: 0,
    isLoading: false,
    cartId: null,
    error: null,
  },
  reducers: {
    addItemLocal: (state, action) => {
      const idx = state.items.findIndex(i => i.product?._id === action.payload.product?._id);
      if (idx > -1) {
        state.items[idx].quantity += action.payload.quantity || 1;
      } else {
        state.items.push(action.payload);
      }
      Object.assign(state, recalcTotals(state.items));
    },
    removeItemLocal: (state, action) => {
      state.items = state.items.filter(i => i._id !== action.payload);
      Object.assign(state, recalcTotals(state.items));
    },
    clearCartLocal: (state) => {
      state.items = []; state.totalAmount = 0; state.totalItems = 0;
    },
  },
  extraReducers: (builder) => {
    const handleCartResponse = (state, action) => {
      state.isLoading = false;
      const cart = action.payload?.cart;
      if (cart) {
        state.items = cart.items || [];
        state.cartId = cart._id;
        Object.assign(state, recalcTotals(state.items));
      }
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled, handleCartResponse)
      .addCase(fetchCart.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });

    builder
      .addCase(addItemToCart.pending, (state) => { state.isLoading = true; })
      .addCase(addItemToCart.fulfilled, handleCartResponse)
      .addCase(addItemToCart.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });

    builder
      .addCase(updateItem.fulfilled, handleCartResponse)
      .addCase(removeItem.fulfilled, handleCartResponse);
  },
});

export const { addItemLocal, removeItemLocal, clearCartLocal } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalAmount;
export const selectCartCount = (state) => state.cart.totalItems;
export const selectIsInCart = (productId) => (state) =>
  state.cart.items.some(i => i.product?._id === productId);

export default cartSlice.reducer;
