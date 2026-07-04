import React from 'react';
import { Link } from 'react-router-dom';

export const OrderFailurePage = () => {
  return (
    <div className="min-h-[70vh] bg-white dark:bg-[#111] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Failed!</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 text-sm">
        We could not complete your payment transaction. Please try again or choose a different payment method during checkout.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/cart"
          className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors shadow-sm"
        >
          Return to Cart
        </Link>
        <Link
          to="/checkout"
          className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
        >
          Retry Checkout
        </Link>
      </div>
    </div>
  );
};

export default OrderFailurePage;
