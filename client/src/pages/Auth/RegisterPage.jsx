import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { registerUser, selectAuthLoading, selectAuthError } from '../../features/auth/authSlice';
import { selectStoreConfig, selectStoreName } from '../../features/store/storeSlice';

const getPasswordStrength = (password) => {
  if (!password) return null;
  if (password.length < 6) return { label: 'Weak', barWidth: 'w-1/3', barColor: 'bg-danger' };
  if (password.length < 10) return { label: 'Medium', barWidth: 'w-2/3', barColor: 'bg-warning' };
  return { label: 'Strong', barWidth: 'w-full', barColor: 'bg-secondary' };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const storeConfig = useSelector(selectStoreConfig);
  const storeName = useSelector(selectStoreName);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (authError) toast.error(authError);
  }, [authError]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      ...(form.referralCode && { referralCode: form.referralCode }),
    };

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created successfully! Welcome!');
      navigate('/');
    }
  };

  const strength = getPasswordStrength(form.password);
  const logoUrl = storeConfig?.logo;

  return (
    <div className="min-h-screen flex">
      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1E1B3A] to-primary">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 bg-white" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex flex-col items-center text-white px-12 text-center max-w-sm">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName || 'ShopWave'} className="h-16 object-contain mb-6" />
          ) : (
            <div className="text-3xl font-bold tracking-tight mb-6">{storeName || 'ShopWave'}</div>
          )}
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            One platform. Any product. Any business.
          </p>
          <div className="space-y-4 w-full max-w-xs text-left">
            {[
              'Free account — no hidden fees',
              'Exclusive deals for members',
              'Fast & secure checkout',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 text-green-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-white/90">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-xs text-white/50">Trusted by 500+ businesses in Bangladesh</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || 'ShopWave'} className="h-12 object-contain mb-3" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-white">S</span>
              </div>
            )}
          </div>

          <h1 className="text-h1 text-ink mb-1">Create account</h1>
          <p className="text-body text-muted mb-8">Join us today — it&apos;s completely free</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Email address <span className="text-danger">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Password <span className="text-danger">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-ghost rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.barColor} ${strength.barWidth}`} />
                  </div>
                  <p className={`text-badge mt-1 font-medium ${
                    strength.label === 'Weak' ? 'text-danger' :
                    strength.label === 'Medium' ? 'text-warning' : 'text-secondary'
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label-field">Confirm password <span className="text-danger">*</span></label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-field pr-12 ${
                    form.confirmPassword && form.password !== form.confirmPassword ? 'border-danger' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-badge text-danger mt-1">Passwords do not match</p>
              )}
            </div>

            {searchParams.get('ref') && (
              <input type="hidden" name="referralCode" value={form.referralCode} />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-body text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-label text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-label text-muted">
            By creating an account you agree to our{' '}
            <span className="underline cursor-pointer hover:text-ink">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer hover:text-ink">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
