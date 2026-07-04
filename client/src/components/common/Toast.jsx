import React from 'react';
import { Toaster } from 'react-hot-toast';

export const Toast = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--surface)',
          color: 'var(--ink)',
          fontFamily: 'var(--font, Inter), sans-serif',
          fontSize: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border)',
        },
        success: {
          className: 'toast-success',
          iconTheme: { primary: 'var(--secondary)', secondary: '#fff' },
        },
        error: {
          className: 'toast-error',
          iconTheme: { primary: 'var(--danger)', secondary: '#fff' },
        },
      }}
    />
  );
};

export default Toast;
