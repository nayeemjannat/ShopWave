import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  try {
const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"ShopWave" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
  }
};

export const orderConfirmationTemplate = (order) => `
  <h2>Order Confirmation</h2>
  <p>Thank you for your order!</p>
  <p>Order Number: ${order.orderNumber}</p>
  <p>Total Amount: ৳${order.totalAmount}</p>
`;

export const passwordResetTemplate = (otp) => `
  <h2>Password Reset</h2>
  <p>Your OTP code is: <strong>${otp}</strong></p>
  <p>This code will expire in 10 minutes.</p>
`;

export const abandonedCartReminderTemplate = (user, items, cartUrl) => `
  <h2>Hi ${user.name}, you left something behind!</h2>
  <p>You have ${items.length} items waiting in your cart.</p>
  <a href="${cartUrl}">Click here to complete your purchase</a>
`;

export const lowStockAlertTemplate = (product, stock, daysLeft) => `
  <h2>Low Stock Alert</h2>
  <p>Product <strong>${product}</strong> is running low.</p>
  <p>Current stock: ${stock}</p>
  <p>Estimated days until stockout: ${daysLeft} days</p>
`;

export const orderShippedTemplate = (order) => `
  <h2>Your Order has been Shipped!</h2>
  <p>Order Number: ${order.orderNumber}</p>
  <p>Your items are on the way.</p>
`;

export default sendEmail;
