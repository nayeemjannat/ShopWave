import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import storeReducer from '../features/store/storeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    store: storeReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
