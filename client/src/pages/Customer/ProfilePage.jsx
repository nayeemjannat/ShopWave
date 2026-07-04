import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, setUser } from '../../features/auth/authSlice';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  
  const [referralInfo, setReferralInfo] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/users/referrals');
        if (res.success) {
          setReferralInfo(res);
        }
      } catch (err) {
        console.error('Failed to load referral details', err);
      }
    };
    fetchReferral();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const res = await axiosInstance.put('/api/v1/users/profile', { name, phone, avatar });
      if (res.success) {
        dispatch(setUser(res.user));
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error('Please enter current and new passwords');
    }
    setIsLoadingPassword(true);
    try {
      const res = await axiosInstance.put('/api/v1/users/password', { currentPassword, newPassword });
      if (res.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details & Password Card */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-55 dark:border-gray-900 pb-2">General Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors shadow-sm"
                >
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-55 dark:border-gray-900 pb-2">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors shadow-sm"
                >
                  {isLoadingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Cards Column */}
        <div className="space-y-6">
          {/* Loyalty & Referrals */}
          <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-55 dark:border-gray-900 pb-2">Rewards</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Loyalty Points</span>
                <span className="text-sm font-bold text-amber-600">🌟 {user?.loyaltyPoints || 0} pts</span>
              </div>
              {referralInfo && (
                <div className="space-y-3 pt-2 border-t border-gray-50 dark:border-gray-900">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Referral Code</span>
                    <span className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-950 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-900">{referralInfo.referralCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Referred Users</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{referralInfo.referralCount}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-100 dark:border-gray-900">
                    <p className="font-bold mb-1">Referral Link:</p>
                    <p className="break-all select-all font-mono text-[9px] text-secondary">{referralInfo.referralUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
