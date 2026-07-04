import cron from 'node-cron';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Store from '../models/Store.js';
import sendEmail, { abandonedCartReminderTemplate, lowStockAlertTemplate } from './sendEmail.js';

export const startCronJobs = () => {
  // 1. FLASH SALE EXPIRY
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Product.updateMany(
        { 'flashSale.active': true, 'flashSale.endsAt': { $lt: now } },
        { $set: { 'flashSale.active': false } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Flash sale expired for ${result.modifiedCount} products.`);
      }
    } catch (error) {
      console.error('[Cron Error] Flash sale expiry:', error.message);
    }
  });

  // 2. ABANDONED CART RECOVERY
  cron.schedule('0 * * * *', async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const carts = await Cart.find({
        $expr: { $gt: [{ $size: '$items' }, 0] },
        updatedAt: { $lt: twoHoursAgo },
        recoveryEmailSent: { $ne: true }
      }).populate('user', 'email name');

      for (const cart of carts) {
        if (!cart.user) continue;

        // check if user placed order in last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentOrder = await Order.findOne({ customer: cart.user._id, createdAt: { $gte: oneDayAgo } });
        if (recentOrder) continue;

        const html = abandonedCartReminderTemplate(cart.user, cart.items, 'http://localhost:5173/cart');
        await sendEmail({
          to: cart.user.email,
          subject: 'Complete your purchase at ShopWave!',
          html,
        });

        cart.recoveryEmailSent = true;
        await cart.save();
      }
    } catch (error) {
      console.error('[Cron Error] Abandoned cart recovery:', error.message);
    }
  });

  // 3. RESTOCK PREDICTOR
  cron.schedule('0 8 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeProducts = await Product.find({ isActive: true, stock: { $gt: 0 } }).populate({ path: 'store', populate: { path: 'owner' } });

      for (const product of activeProducts) {
        // Find total sold in last 30 days
        const orders = await Order.find({
          'items.product': product._id,
          createdAt: { $gte: thirtyDaysAgo },
          orderStatus: { $nin: ['cancelled', 'failed'] }
        });

        let totalSold = 0;
        orders.forEach(order => {
          const item = order.items.find(i => i.product.toString() === product._id.toString());
          if (item) totalSold += item.quantity;
        });

        const avgDailySales = totalSold / 30;
        if (avgDailySales > 0) {
          const daysUntilStockout = Math.floor(product.stock / avgDailySales);
          
          if (daysUntilStockout <= 5 && product.store && product.store.owner) {
            const html = lowStockAlertTemplate(product.name, product.stock, daysUntilStockout);
            await sendEmail({
              to: product.store.owner.email,
              subject: `Low Stock Alert: ${product.name}`,
              html,
            });
          }
        }
      }
    } catch (error) {
      console.error('[Cron Error] Restock predictor:', error.message);
    }
  });
};
