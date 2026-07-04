import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !email || !newPassword) {
      return toast.error('Please fill in all fields');
    }
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/api/v1/auth/reset-password', { email, otp, newPassword });
      if (res.success) {
        toast.success('Password reset successfully! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1E1B3A] to-primary">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 bg-white" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex flex-col items-center text-white px-12 text-center max-w-sm">
          <div className="text-3xl font-bold tracking-tight mb-6">ShopWave</div>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            One platform. Any product. Any business.
          </p>
          <div className="space-y-4 w-full max-w-xs text-left">
            {[
              'Fast delivery across Bangladesh',
              'Secure payments with SSLCommerz',
              'Easy returns within 7 days',
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
              <span className="text-xl font-bold text-white">S</span>
            </div>
          </div>

          <h1 className="text-h1 text-ink mb-1">Reset Password</h1>
          <p className="text-body text-muted mb-8">Enter the OTP sent to your email to configure your new password.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email-address" className="label-field">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="otp" className="label-field">OTP Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field"
                placeholder="Enter OTP"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="label-field">New Password</label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
