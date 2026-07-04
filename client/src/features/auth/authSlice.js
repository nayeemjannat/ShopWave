import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async Thunks
export const registerUser = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.post('/api/v1/auth/register', formData);
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.post('/api/v1/auth/login', credentials);
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.get('/api/v1/auth/logout');
    localStorage.removeItem('token');
  } catch (err) {
    localStorage.removeItem('token');
    return rejectWithValue(err.response?.data?.message || 'Logout failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.get('/api/v1/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to get user');
  }
});

export const toggleWishlist = createAsyncThunk('auth/toggleWishlist', async (productId, { rejectWithValue }) => {
  try {
    const data = await axiosInstance.post('/api/v1/users/wishlist', { productId });
    return { productId, inWishlist: data.inWishlist };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle wishlist');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action) => { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });

    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.token = null; state.isAuthenticated = false;
      });

    // getMe
    builder
      .addCase(getMe.pending, (state) => { state.isLoading = true; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('token');
      });

    // toggleWishlist
    builder
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (state.user) {
          if (!state.user.wishlist) state.user.wishlist = [];
          const idx = state.user.wishlist.findIndex(item => 
            typeof item === 'string' ? item === action.payload.productId : item?._id === action.payload.productId
          );
          if (idx > -1) {
            state.user.wishlist.splice(idx, 1);
          } else {
            state.user.wishlist.push(action.payload.productId);
          }
        }
      });
  },
});

export const { clearError, setUser } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
