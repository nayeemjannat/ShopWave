import React from 'react';
import { useSelector } from 'react-redux';
import { selectStoreType, selectStoreName } from '../../features/store/storeSlice';
import { getStoreLayout } from '../../layouts/storeLayouts';

export const HomePage = () => {
  const storeType = useSelector(selectStoreType);
  const storeName = useSelector(selectStoreName);
  const isStoreLoading = useSelector((state) => state.store.isLoading);

  if (isStoreLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest animate-pulse">Loading Storefront...</p>
      </div>
    );
  }

  // Retrieve the appropriate layout dynamically
  const StoreLayout = getStoreLayout(storeType);

  return <StoreLayout />;
};

export default HomePage;
