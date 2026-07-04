import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/users');
      setUsers(Array.isArray(res.users) ? res.users : []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBan = async (id, currentlyBanned) => {
    if (!window.confirm(currentlyBanned ? 'Unban this user?' : 'Ban this user?')) return;
    try {
      await axiosInstance.put(`/api/v1/users/${id}/ban`);
      toast.success(currentlyBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Customers</h1>
        <span className="text-xs text-gray-400">Total: {users.length}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">👥</span>
          <p className="text-sm text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                  {u.name?.substring(0, 2) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{u.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                  <p className="text-[10px] text-gray-500">
                    Joined {formatDate(u.createdAt)} · {u.orderCount || 0} orders · {u.loyaltyPoints || 0} pts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  u.role === 'superAdmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                  u.role === 'storeAdmin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                }`}>
                  {u.role}
                </span>
                {u.isBanned && <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400">Banned</span>}
                <button
                  onClick={() => handleBan(u._id, u.isBanned)}
                  className={`text-xs font-bold ${u.isBanned ? 'text-green-600 hover:underline' : 'text-red-500 hover:underline'}`}
                >
                  {u.isBanned ? 'Unban' : 'Ban'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
