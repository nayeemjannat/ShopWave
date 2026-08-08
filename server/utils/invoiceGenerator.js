import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cloudinary } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVOICE_DIR = path.resolve(__dirname, '../invoices');

const formatTaka = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

export const buildInvoiceBuffer = (order, store) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;

    doc.rect(50, 50, pageWidth, 90).fill('#4B44B0');
    doc.fill('#ffffff');
    doc.font('Helvetica-Bold').fontSize(22).text('ShopWave', 70, 72);
    doc.font('Helvetica').fontSize(11).text(store?.name || 'Online Store', 70, 104);
    doc.font('Helvetica-Bold').fontSize(14).text('INVOICE #' + order.orderNumber, 320, 72, { align: 'right' });
    doc.font('Helvetica').fontSize(10).text(
      'Date: ' + new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'),
      320,
      98,
      { align: 'right' }
    );

    doc.fill('#111111');
    doc.font('Helvetica-Bold').fontSize(11).text('BILL TO', 50, 180);
    doc.font('Helvetica').fontSize(10)
      .text(order.shippingAddress?.fullName || 'Customer', 50, 198)
      .text((order.shippingAddress?.address || '') + ', ' + (order.shippingAddress?.city || '') + ', ' + (order.shippingAddress?.district || ''))
      .text('Phone: ' + (order.shippingAddress?.phone || ''));

    doc.font('Helvetica-Bold').fontSize(11).text('PAYMENT', 320, 180);
    doc.font('Helvetica').fontSize(10)
      .text('Method: ' + (order.paymentMethod || 'cod').toUpperCase(), 320, 198)
      .text('Status: ' + (order.paymentStatus || 'pending').toUpperCase(), 320, 214)
      .text('Order Status: ' + (order.orderStatus || '').toUpperCase(), 320, 230);

    const tableTop = 285;
    doc.rect(50, tableTop, pageWidth, 24).fill('#f0f0f0');
    doc.fill('#111111').font('Helvetica-Bold').fontSize(9);
    doc.text('ITEM', 60, tableTop + 8);
    doc.text('QTY', 260, tableTop + 8);
    doc.text('PRICE', 330, tableTop + 8);
    doc.text('TOTAL', 460, tableTop + 8);

    let y = tableTop + 34;
    doc.font('Helvetica').fontSize(10);
    for (const it of order.items || []) {
      doc.text(it.name || '', 60, y, { width: 180 });
      doc.text(String(it.quantity), 260, y);
      doc.text(formatTaka(it.price), 330, y);
      doc.text(formatTaka((it.price || 0) * it.quantity), 460, y);
      y += 24;
    }

    const totalsY = y + 12;
    let row = 0;
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 360, totalsY);
    doc.text(formatTaka(order.subtotal), 460, totalsY);
    row++;
    if (order.discount > 0) {
      doc.text('Discount:', 360, totalsY + row * 18);
      doc.text('- ' + formatTaka(order.discount), 460, totalsY + row * 18);
      row++;
    }
    doc.text('Shipping:', 360, totalsY + row * 18);
    doc.text(formatTaka(order.shippingFee), 460, totalsY + row * 18);
    row++;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', 360, totalsY + row * 18);
    doc.text(formatTaka(order.totalAmount), 460, totalsY + row * 18);

    doc.fill('#888888').font('Helvetica').fontSize(9)
      .text('Thank you for shopping with ShopWave!', 50, 720, { align: 'center' });

    doc.end();
  });

const uploadToCloudinary = (order, buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'shopwave/invoices',
          resource_type: 'raw',
          filename_override: order.orderNumber + '.pdf',
          public_id: 'invoice-' + order.orderNumber,
          access_mode: 'public',
        },
        (err, res) => (err ? reject(err) : resolve(res))
      )
      .end(buffer);
  });

const saveToLocal = (buffer, orderNumber) => {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
  const filePath = path.join(INVOICE_DIR, orderNumber + '.pdf');
  fs.writeFileSync(filePath, buffer);
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${backendUrl}/invoices/${orderNumber}.pdf`;
};

export const generateOrderInvoice = async (order, store) => {
  const buffer = await buildInvoiceBuffer(order, store);

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const result = await uploadToCloudinary(buffer, order);
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary invoice upload failed, falling back to local:', err.message);
    }
  }

  return saveToLocal(buffer, order.orderNumber);
};
