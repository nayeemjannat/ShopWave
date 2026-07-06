import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';

dotenv.config();

// ── Realistic electronics catalog (PRD demo store = electronics) ──────────
const buildProducts = (storeId) => {
  const now = new Date();
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  return [
    {
      store: storeId,
      name: 'Samsung Galaxy A54 5G',
      nameBn: 'স্যামসাং গ্যালাক্সি এ৫৪ ৫জি',
      description: 'Samsung Galaxy A54 5G comes with a stunning 6.4" Super AMOLED display, 50MP OIS camera, and all-day battery life. Perfect blend of performance and style.',
      price: 42999,
      comparePrice: 47999,
      images: [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=800&auto=format&fit=crop',
      ],
      category: 'Smartphones',
      brand: 'Samsung',
      stock: 24,
      isFeatured: true,
      dynamicFields: { model: 'SM-A546E', ram: '8GB', storage: '128GB', processor: 'Exynos 1380', battery: '5000', display: '6.4" Super AMOLED 120Hz', camera: '50MP+12MP+5MP', warranty: '1 Year' },
      flashSale: { active: true, discountPct: 12, startsAt: now, endsAt: in5Days },
      tags: ['smartphone', 'samsung', '5g', 'featured'],
    },
    {
      store: storeId,
      name: 'iPhone 14',
      nameBn: 'আইফোন ১৪',
      description: 'iPhone 14 with A15 Bionic chip, advanced dual-camera system, and Crash Detection. Built tougher with the toughest glass on a smartphone.',
      price: 89999,
      comparePrice: 94999,
      images: ['https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=800&auto=format&fit=crop'],
      category: 'Smartphones',
      brand: 'Apple',
      stock: 12,
      isFeatured: true,
      dynamicFields: { model: 'A2882', ram: '6GB', storage: '128GB', processor: 'A15 Bionic', battery: '3279', display: '6.1" Super Retina XDR', camera: '12MP+12MP', warranty: '1 Year' },
      tags: ['smartphone', 'apple', 'iphone', 'featured'],
    },
    {
      store: storeId,
      name: 'Xiaomi Redmi Note 13 Pro',
      nameBn: 'শাওমি রেডমি নোট ১৩ প্রো',
      description: 'Flagship-level 200MP camera, 120W HyperCharge, and a curved AMOLED display — all at a price that makes sense.',
      price: 32999,
      comparePrice: 35999,
      images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop'],
      category: 'Smartphones',
      brand: 'Xiaomi',
      stock: 30,
      isFeatured: true,
      dynamicFields: { model: '23090RA98C', ram: '8GB', storage: '256GB', processor: 'Snapdragon 7s Gen 2', battery: '5100', display: '6.67" AMOLED 120Hz', camera: '200MP+8MP+2MP', warranty: '1 Year' },
      flashSale: { active: true, discountPct: 8, startsAt: now, endsAt: in5Days },
      tags: ['smartphone', 'xiaomi', 'featured'],
    },
    {
      store: storeId,
      name: 'Realme 12 Pro+',
      nameBn: 'রিয়েলমি ১২ প্রো প্লাস',
      description: 'Periscope telephoto camera with 3x optical zoom, sleek leather-textured back, and flagship Snapdragon performance.',
      price: 38999,
      images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=800&auto=format&fit=crop'],
      category: 'Smartphones',
      brand: 'Realme',
      stock: 18,
      dynamicFields: { model: 'RMX3840', ram: '8GB', storage: '256GB', processor: 'Snapdragon 7s Gen 2', battery: '5000', display: '6.7" AMOLED 120Hz', camera: '50MP+64MP+8MP', warranty: '1 Year' },
      tags: ['smartphone', 'realme'],
    },
    {
      store: storeId,
      name: 'OnePlus Nord CE 4',
      nameBn: 'ওয়ানপ্লাস নর্ড সিই ৪',
      description: 'Snapdragon 7 Gen 3, 100W SuperVOOC charging, and OxygenOS smoothness in a sleek metal-rimmed body.',
      price: 36999,
      comparePrice: 39999,
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop'],
      category: 'Smartphones',
      brand: 'OnePlus',
      stock: 15,
      dynamicFields: { model: 'CPH2601', ram: '8GB', storage: '256GB', processor: 'Snapdragon 7 Gen 3', battery: '5500', display: '6.7" AMOLED 120Hz', camera: '50MP+8MP', warranty: '1 Year' },
      tags: ['smartphone', 'oneplus'],
    },
    {
      store: storeId,
      name: 'Apple MacBook Air M2',
      nameBn: 'অ্যাপল ম্যাকবুক এয়ার এম২',
      description: 'Strikingly thin design powered by the M2 chip. Up to 18 hours of battery life and a stunning Liquid Retina display.',
      price: 134999,
      comparePrice: 142999,
      images: ['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=800&auto=format&fit=crop'],
      category: 'Laptops',
      brand: 'Apple',
      stock: 8,
      isFeatured: true,
      dynamicFields: { model: 'MLY33', ram: '8GB', storage: '256GB SSD', processor: 'Apple M2', battery: '52.6Wh (18hr)', display: '13.6" Liquid Retina', camera: '1080p FaceTime HD', warranty: '1 Year' },
      tags: ['laptop', 'apple', 'macbook', 'featured'],
    },
    {
      store: storeId,
      name: 'ASUS Vivobook 15',
      nameBn: 'আসুস ভিভোবুক ১৫',
      description: 'Everyday productivity laptop with 12th Gen Intel Core i5, 15.6" FHD display, and a sleek lightweight chassis.',
      price: 62999,
      comparePrice: 68999,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop'],
      category: 'Laptops',
      brand: 'Others',
      stock: 14,
      dynamicFields: { model: 'X1502ZA', ram: '8GB', storage: '512GB SSD', processor: 'Intel Core i5-1235U', battery: '42Wh', display: '15.6" FHD IPS', camera: '720p HD', warranty: '2 Years' },
      flashSale: { active: true, discountPct: 9, startsAt: now, endsAt: in5Days },
      tags: ['laptop', 'asus'],
    },
    {
      store: storeId,
      name: 'Lenovo IdeaPad Slim 3',
      nameBn: 'লেনোভো আইডিয়াপ্যাড স্লিম ৩',
      description: 'Reliable everyday computing with AMD Ryzen 5 power and a sharp Full HD display — built for students and professionals.',
      price: 54999,
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop'],
      category: 'Laptops',
      brand: 'Others',
      stock: 20,
      dynamicFields: { model: '82XB', ram: '8GB', storage: '512GB SSD', processor: 'AMD Ryzen 5 7530U', battery: '45Wh', display: '15.6" FHD', camera: '720p HD', warranty: '1 Year' },
      tags: ['laptop', 'lenovo'],
    },
    {
      store: storeId,
      name: 'Apple iPad 10th Gen',
      nameBn: 'অ্যাপল আইপ্যাড ১০ম জেনারেশন',
      description: 'A vibrant 10.9" Liquid Retina display, A14 Bionic chip, and support for Apple Pencil and Magic Keyboard Folio.',
      price: 52999,
      comparePrice: 56999,
      images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=800&auto=format&fit=crop'],
      category: 'Tablets',
      brand: 'Apple',
      stock: 16,
      isFeatured: true,
      dynamicFields: { model: 'A2696', ram: '4GB', storage: '64GB', processor: 'Apple A14 Bionic', battery: '7606mAh', display: '10.9" Liquid Retina', camera: '12MP', warranty: '1 Year' },
      tags: ['tablet', 'apple', 'ipad', 'featured'],
    },
    {
      store: storeId,
      name: 'Samsung Galaxy Tab A9+',
      nameBn: 'স্যামসাং গ্যালাক্সি ট্যাব এ৯ প্লাস',
      description: 'Big 11" display with quad-speaker setup tuned by AKG — great for streaming, study, and everyday browsing.',
      price: 28999,
      images: ['https://images.unsplash.com/photo-1623126908029-58c83eaf2eb4?q=80&w=800&auto=format&fit=crop'],
      category: 'Tablets',
      brand: 'Samsung',
      stock: 22,
      dynamicFields: { model: 'SM-X210', ram: '4GB', storage: '64GB', processor: 'Snapdragon 695', battery: '7040mAh', display: '11" TFT 90Hz', camera: '8MP', warranty: '1 Year' },
      tags: ['tablet', 'samsung'],
    },
    {
      store: storeId,
      name: 'Sony WH-1000XM5 Headphones',
      nameBn: 'সনি ডব্লিউএইচ-১০০০এক্সএম৫ হেডফোন',
      description: 'Industry-leading noise cancellation with crystal clear hands-free calling and up to 30 hours of battery life.',
      price: 38999,
      comparePrice: 42999,
      images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop'],
      category: 'Accessories',
      brand: 'Others',
      stock: 25,
      isFeatured: true,
      dynamicFields: { model: 'WH-1000XM5', ram: '-', storage: '-', processor: 'Integrated V1 chip', battery: '30hr playback', display: '-', camera: '-', warranty: '1 Year' },
      flashSale: { active: true, discountPct: 10, startsAt: now, endsAt: in5Days },
      tags: ['accessories', 'audio', 'headphones', 'featured'],
    },
    {
      store: storeId,
      name: 'Anker PowerCore 20000mAh',
      nameBn: 'অ্যাংকার পাওয়ারকোর ২০০০০mAh',
      description: 'High-capacity portable charger with PowerIQ fast charging — charge your phone up to 6 times on a single charge.',
      price: 3499,
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop'],
      category: 'Accessories',
      brand: 'Others',
      stock: 60,
      dynamicFields: { model: 'A1271', ram: '-', storage: '-', processor: '-', battery: '20000mAh', display: 'LED indicator', camera: '-', warranty: '18 Months' },
      tags: ['accessories', 'powerbank'],
    },
    {
      store: storeId,
      name: 'Logitech MX Master 3S Mouse',
      nameBn: 'লজিটেক এমএক্স মাস্টার ৩এস মাউস',
      description: 'Ultra-precise 8K DPI sensor, quiet clicks, and ergonomic design — built for all-day productivity.',
      price: 9999,
      comparePrice: 11499,
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop'],
      category: 'Accessories',
      brand: 'Others',
      stock: 35,
      dynamicFields: { model: 'MX2200s', ram: '-', storage: '-', processor: '-', battery: '70 days', display: '-', camera: '-', warranty: '1 Year' },
      tags: ['accessories', 'mouse'],
    },
    {
      store: storeId,
      name: 'Canon EOS M50 Mark II',
      nameBn: 'ক্যানন ইওএস এম৫০ মার্ক ২',
      description: 'Vlogging-ready mirrorless camera with 4K video, eye-detection autofocus, and a vari-angle touchscreen.',
      price: 78999,
      comparePrice: 84999,
      images: ['https://images.unsplash.com/photo-1606986628253-05620e9c20a8?q=80&w=800&auto=format&fit=crop'],
      category: 'Cameras',
      brand: 'Others',
      stock: 7,
      isFeatured: true,
      dynamicFields: { model: 'EOS M50 II', ram: '-', storage: 'SD Card', processor: 'DIGIC 8', battery: '305 shots', display: '3" Vari-angle Touch', camera: '24.1MP APS-C', warranty: '1 Year' },
      tags: ['camera', 'canon', 'featured'],
    },
    {
      store: storeId,
      name: 'GoPro HERO12 Black',
      nameBn: 'গোপ্রো হিরো১২ ব্ল্যাক',
      description: 'Shoot stunning 5.3K video with HyperSmooth 6.0 stabilization. Waterproof up to 10m without a housing.',
      price: 49999,
      images: ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=800&auto=format&fit=crop'],
      category: 'Cameras',
      brand: 'Others',
      stock: 10,
      dynamicFields: { model: 'HERO12', ram: '-', storage: 'microSD', processor: 'GP2', battery: '1720mAh', display: '2.27" Touch', camera: '27MP / 5.3K60', warranty: '1 Year' },
      flashSale: { active: true, discountPct: 15, startsAt: now, endsAt: in5Days },
      tags: ['camera', 'gopro'],
    },
    {
      store: storeId,
      name: 'Samsung 55" Crystal UHD 4K Smart TV',
      nameBn: 'স্যামসাং ৫৫" ক্রিস্টাল ইউএইচডি ৪কে স্মার্ট টিভি',
      description: 'Vivid 4K picture quality, built-in voice assistants, and a clean cable solution for an uncluttered setup.',
      price: 64999,
      comparePrice: 72999,
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop'],
      category: 'TV & Audio',
      brand: 'Samsung',
      stock: 9,
      isFeatured: true,
      dynamicFields: { model: 'UA55CU7700', ram: '-', storage: '-', processor: 'Crystal Processor 4K', battery: '-', display: '55" 4K UHD', camera: '-', warranty: '2 Years' },
      tags: ['tv', 'samsung', 'featured'],
    },
    {
      store: storeId,
      name: 'JBL Flip 6 Portable Speaker',
      nameBn: 'জেবিএল ফ্লিপ ৬ পোর্টেবল স্পিকার',
      description: 'Bold JBL Pro Sound in a compact, IP67 waterproof and dustproof design — up to 12 hours of playtime.',
      price: 12999,
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop'],
      category: 'TV & Audio',
      brand: 'Others',
      stock: 28,
      dynamicFields: { model: 'JBLFLIP6', ram: '-', storage: '-', processor: '-', battery: '12hr playback', display: '-', camera: '-', warranty: '1 Year' },
      tags: ['audio', 'jbl', 'speaker'],
    },
  ];
};

export const seedDatabase = async (options = {}) => {
  const { closeConnection = true } = options;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  }

  let adminUser = await User.findOne({ email: 'admin@shopwave.com' });
  let demoStore;

  if (adminUser) {
    console.log('⚠️  Super Admin already exists. Skipping user creation.');
    demoStore = await Store.findOne({ slug: 'demo' });
  } else {
    adminUser = new User({
      name: 'Nayeem',
      email: 'admin@shopwave.com',
      password: 'Admin@1234',
      role: 'superAdmin',
      phone: '+8801234567890',
      isVerified: true,
    });
    await adminUser.save();
    console.log(`✅ Super Admin Created: ${adminUser._id}`);

    demoStore = new Store({
      name: 'ShopWave Demo',
      slug: 'demo',
      owner: adminUser._id,
      storeType: 'electronics',
      config: {
        primaryColor: '#4B44B0',
        secondaryColor: '#1B9C75',
        currency: 'BDT',
        language: 'en',
        activeModules: ['wishlist', 'cart', 'comparison', 'flashSale', 'reviews', 'loyaltyPoints'],
      },
      payment: {
        provider: 'sslcommerz',
        storeId: 'demo_store_id',
        storePassword: 'demo_store_password',
        isLive: false,
        cod: { enabled: true, fee: 20 },
      },
      isActive: true,
    });
    await demoStore.save();
    console.log(`✅ Demo Store Created: ${demoStore._id}`);
    console.log(`   Slug: ${demoStore.slug}`);
    console.log(`   Owner: ${adminUser.email}`);
  }

  let demoCustomer = await User.findOne({ email: 'customer@shopwave.com' });
  if (!demoCustomer) {
    demoCustomer = new User({
      name: 'Demo Customer',
      email: 'customer@shopwave.com',
      password: 'Customer@1234',
      role: 'customer',
      phone: '+8801987654321',
      isVerified: true,
    });
    demoCustomer.referralCode = demoCustomer.generateReferralCode();
    await demoCustomer.save();
    console.log(`✅ Demo Customer Created: ${demoCustomer.email}`);
  }

  if (!demoStore) {
    console.log('⚠️  Demo store not found — skipping product seeding.');
  } else {
    const existingCount = await Product.countDocuments({ store: demoStore._id });
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} product(s) already exist for the demo store. Skipping product seeding.`);
      console.log('   (Delete products manually or drop the collection if you want to reseed.)');
    } else {
      const products = buildProducts(demoStore._id);
      await Product.insertMany(products);
      const featuredCount = products.filter(p => p.isFeatured).length;
      const flashCount = products.filter(p => p.flashSale?.active).length;
      console.log(`✅ Seeded ${products.length} demo products`);
      console.log(`   Featured: ${featuredCount} · Flash Sale: ${flashCount}`);
      console.log(`   Categories: Smartphones, Laptops, Tablets, Accessories, Cameras, TV & Audio`);
    }
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nYou can now login with:');
  console.log('   Email: admin@shopwave.com');
  console.log('   Password: Admin@1234');
  console.log('   Store Slug: demo');

  if (closeConnection) {
    await mongoose.connection.close();
  }

  return {
    adminEmail: 'admin@shopwave.com',
    password: 'Admin@1234',
    storeSlug: 'demo',
  };
};

// Allow running directly: node scripts/seed.js
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  seedDatabase().catch((err) => { console.error(err); process.exit(1); });
}
