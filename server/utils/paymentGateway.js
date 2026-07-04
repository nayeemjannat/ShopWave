import SSLCommerzPayment from 'sslcommerz-lts';

const getStoreCredentials = (store) => {
  const { storeId, storePassword, isLive } = store.payment;
  return {
    storeId: isLive ? storeId : process.env.SANDBOX_SSLCOMMERZ_STORE_ID,
    storePassword: isLive ? storePassword : process.env.SANDBOX_SSLCOMMERZ_STORE_PASS,
    isLive,
  };
};

export const verifySSLCommerzPayment = async (store, valId) => {
  const { storeId, storePassword, isLive } = getStoreCredentials(store);
  if (!storeId || !storePassword || !valId) {
    throw new Error('Payment verification credentials are missing');
  }

  const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
  const validation = await sslcz.validate({ val_id: valId });
  const status = validation?.status?.toUpperCase?.() || '';

  if (!['VALID', 'VALIDATED'].includes(status)) {
    throw new Error('Payment verification failed');
  }

  return validation;
};

export const initiatePayment = async (store, orderData) => {
  const { provider } = store.payment;
  const { storeId: sid, storePassword: spass, isLive } = getStoreCredentials(store);

  if (provider === 'sslcommerz') {
    return await initiateSSLCommerz(sid, spass, isLive, orderData, store.storeType);
  } else if (provider === 'shurjopay') {
    throw new Error('ShurjoPay not fully implemented');
  } else if (provider === 'bkash') {
    throw new Error('bKash not fully implemented');
  } else {
    throw new Error('Invalid payment provider');
  }
};

const initiateSSLCommerz = async (storeId, storePass, isLive, orderData, storeType) => {
  const sslcz = new SSLCommerzPayment(storeId, storePass, isLive);
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
  
  const data = {
    total_amount: orderData.totalAmount,
    currency: 'BDT',
    tran_id: orderData.orderId,
    success_url: `${BACKEND_URL}/api/v1/orders/sslcommerz/success`,
    fail_url: `${BACKEND_URL}/api/v1/orders/sslcommerz/fail`,
    cancel_url: `${BACKEND_URL}/api/v1/orders/sslcommerz/cancel`,
    cus_name: orderData.shippingAddress.fullName || 'Customer Name',
    cus_email: orderData.customerEmail || 'customer@example.com',
    cus_phone: orderData.shippingAddress.phone || '01700000000',
    cus_add1: orderData.shippingAddress.address || 'Dhaka',
    cus_city: orderData.shippingAddress.city || 'Dhaka',
    product_name: 'ShopWave Order',
    product_category: storeType || 'general',
    product_profile: 'general',
    shipping_method: 'NO',
    num_of_item: 1,
  };

  try {
    const apiResponse = await sslcz.init(data);
    if (apiResponse?.GatewayPageURL) {
      return { paymentUrl: apiResponse.GatewayPageURL, sessionKey: apiResponse.sessionkey };
    } else {
      throw new Error('SSLCommerz gateway URL not generated');
    }
  } catch (error) {
    console.error('SSLCommerz Init Error:', error);
    throw new Error('sslcommerz payment failed to initiate');
  }
};
