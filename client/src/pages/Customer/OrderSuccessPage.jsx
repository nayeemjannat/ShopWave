import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || '';

  return (
    <div className="min-h-[70vh] bg-white dark:bg-[#111] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Order Confirmed!</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-sm">
        Thank you for your purchase. Your order has been placed successfully. A confirmation email/WhatsApp notification has been sent.
      </p>
      {orderId && (
        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-900 mb-8 text-xs font-semibold">
          <span className="text-gray-500">Order ID: </span>
          <span className="text-gray-900 dark:text-white">{orderId}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/orders"
          className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors shadow-sm"
        >
          View Order History
        </Link>
        <Link
          to="/"
          className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
