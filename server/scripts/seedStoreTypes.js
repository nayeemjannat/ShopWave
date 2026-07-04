import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';

dotenv.config();

const DEMO_PASSWORD = 'StoreDemo@1234';

// ── 5 demo stores — one per remaining store type (electronics already seeded by seed.js) ──
const STORE_DEFS = [
  {
    slug: 'clothing-demo',
    name: 'Aarong Fashion House',
    storeType: 'clothing',
    ownerEmail: 'clothing@shopwave.com',
    ownerName: 'Fashion Demo Owner',
    primaryColor: '#BE185D',
    secondaryColor: '#1B9C75',
    activeModules: ['wishlist', 'cart', 'comparison', 'reviews'],
    products: [
      {
        name: "Men's Cotton Panjabi",
        nameBn: 'পুরুষদের সুতি পাঞ্জাবি',
        description: 'Breathable premium cotton panjabi with traditional embroidery — perfect for Eid and festive occasions.',
        price: 1899, comparePrice: 2299,
        images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'],
        category: 'Panjabi', brand: 'Aarong', stock: 40, isFeatured: true,
        dynamicFields: { material: '100% Cotton', sizes: ['M', 'L', 'XL', 'XXL'], colors: ['White', 'Off-White', 'Sky Blue'], gender: 'Men', season: 'All Season', fit: 'Regular' },
      },
      {
        name: "Women's Embroidered Saree",
        nameBn: 'মহিলাদের এমব্রয়ডারি শাড়ি',
        description: 'Handwoven cotton saree with intricate embroidery work, finished with a matching blouse piece.',
        price: 3499, comparePrice: 3999,
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'],
        category: 'Saree', brand: 'Aarong', stock: 25, isFeatured: true,
        dynamicFields: { material: 'Cotton Silk', sizes: ['Free Size'], colors: ['Maroon', 'Navy Blue', 'Emerald'], gender: 'Women', season: 'All Season', fit: 'Regular' },
        flashSale: { active: true, discountPct: 10, startsAt: new Date(), endsAt: new Date(Date.now() + 5 * 86400000) },
      },
      {
        name: "Kids' Printed T-Shirt Set",
        nameBn: 'বাচ্চাদের প্রিন্টেড টি-শার্ট সেট',
        description: 'Soft cotton t-shirt and shorts combo set with playful prints — comfortable for everyday wear.',
        price: 899,
        images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=800&auto=format&fit=crop'],
        category: 'Kids Wear', brand: 'Aarong', stock: 55,
        dynamicFields: { material: 'Cotton Blend', sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], colors: ['Yellow', 'Red', 'Green'], gender: 'Kids', season: 'Summer', fit: 'Relaxed' },
      },
      {
        name: "Men's Denim Jacket",
        nameBn: 'পুরুষদের ডেনিম জ্যাকেট',
        description: 'Classic washed-denim jacket with button closure and chest pockets — a year-round wardrobe staple.',
        price: 2799, comparePrice: 3199,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop'],
        category: 'Jackets', brand: 'Others', stock: 18, isFeatured: true,
        dynamicFields: { material: 'Denim', sizes: ['S', 'M', 'L', 'XL'], colors: ['Light Blue', 'Dark Blue'], gender: 'Men', season: 'Winter', fit: 'Slim' },
      },
      {
        name: "Women's Floral Maxi Dress",
        nameBn: 'মহিলাদের ফ্লোরাল ম্যাক্সি ড্রেস',
        description: 'Flowy floral maxi dress in breathable viscose fabric — ideal for summer outings.',
        price: 2199,
        images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop'],
        category: 'Dresses', brand: 'Others', stock: 30,
        dynamicFields: { material: 'Viscose', sizes: ['S', 'M', 'L'], colors: ['Floral Pink', 'Floral Blue'], gender: 'Women', season: 'Summer', fit: 'Relaxed' },
      },
    ],
  },
  {
    slug: 'beauty-demo',
    name: "Nadia's Clean Beauty",
    storeType: 'beauty',
    ownerEmail: 'beauty@shopwave.com',
    ownerName: 'Beauty Demo Owner',
    primaryColor: '#9D4EDD',
    secondaryColor: '#1B9C75',
    activeModules: ['wishlist', 'cart', 'reviews', 'referral', 'loyaltyPoints'],
    products: [
      {
        name: 'Niacinamide 10% + Zinc 1% Serum',
        nameBn: 'নায়াসিনামাইড ১০% সিরাম',
        description: 'Reduces blemishes and balances oil production with high-strength niacinamide and zinc PCA.',
        price: 990, comparePrice: 1190,
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop'],
        category: 'Serum', brand: 'Others', stock: 60, isFeatured: true,
        dynamicFields: { skinType: ['Oily', 'Combination'], volume: 30, ingredients: ['Niacinamide', 'Zinc PCA'], certifications: ['Cruelty-free', 'Vegan'], shelfLife: '24 months' },
        flashSale: { active: true, discountPct: 15, startsAt: new Date(), endsAt: new Date(Date.now() + 5 * 86400000) },
      },
      {
        name: 'Hyaluronic Acid 2% + B5 Hydrating Serum',
        nameBn: 'হায়ালুরোনিক অ্যাসিড সিরাম',
        description: 'Multi-depth hydration with five forms of hyaluronic acid plus vitamin B5 for plump, dewy skin.',
        price: 1090,
        images: ['https://images.unsplash.com/photo-1556228852-80ea8ea88e29?q=80&w=800&auto=format&fit=crop'],
        category: 'Serum', brand: 'Others', stock: 45, isFeatured: true,
        dynamicFields: { skinType: ['All Skin Types', 'Dry'], volume: 30, ingredients: ['Hyaluronic Acid', 'Vitamin B5'], certifications: ['Cruelty-free'], shelfLife: '24 months' },
      },
      {
        name: 'Vitamin C Brightening Sunscreen SPF50',
        nameBn: 'ভিটামিন সি সানস্ক্রিন এসপিএফ৫০',
        description: 'Lightweight, no-white-cast sunscreen with broad spectrum SPF50 PA+++ and brightening vitamin C.',
        price: 1290, comparePrice: 1490,
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop'],
        category: 'Sunscreen', brand: 'Others', stock: 70,
        dynamicFields: { skinType: ['All Skin Types'], volume: 50, ingredients: ['Vitamin C', 'Zinc Oxide'], certifications: ['Halal', 'Cruelty-free'], shelfLife: '36 months' },
      },
      {
        name: 'Centella Asiatica Soothing Gel Cream',
        nameBn: 'সেন্টেলা এশিয়াটিকা জেল ক্রিম',
        description: 'Calming, fragrance-free gel-cream with 70% centella asiatica extract for sensitive, irritated skin.',
        price: 850,
        images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop'],
        category: 'Moisturizer', brand: 'Others', stock: 50, isFeatured: true,
        dynamicFields: { skinType: ['Sensitive', 'Normal'], volume: 60, ingredients: ['Centella Asiatica', 'Panthenol'], certifications: ['Vegan', 'Cruelty-free'], shelfLife: '24 months' },
      },
      {
        name: 'Salicylic Acid 2% Acne Cleanser',
        nameBn: 'স্যালিসাইলিক অ্যাসিড ক্লিনজার',
        description: 'Gentle daily cleanser that exfoliates and unclogs pores — ideal for acne-prone, oily skin.',
        price: 690,
        images: ['https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=800&auto=format&fit=crop'],
        category: 'Cleanser', brand: 'Others', stock: 65,
        dynamicFields: { skinType: ['Oily', 'Combination'], volume: 100, ingredients: ['Salicylic Acid', 'Tea Tree Oil'], certifications: ['Cruelty-free'], shelfLife: '24 months' },
      },
    ],
  },
  {
    slug: 'grocery-demo',
    name: 'Chaldal Express Mart',
    storeType: 'grocery',
    ownerEmail: 'grocery@shopwave.com',
    ownerName: 'Grocery Demo Owner',
    primaryColor: '#16A34A',
    secondaryColor: '#F97316',
    activeModules: ['wishlist', 'cart', 'reviews'],
    products: [
      {
        name: 'Premium Miniket Rice',
        nameBn: 'প্রিমিয়াম মিনিকেট চাল',
        description: 'Finely milled, aromatic miniket rice — a daily staple sourced from trusted local mills.',
        price: 78,
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop'],
        category: 'Rice & Grains', brand: 'Others', stock: 200, isFeatured: true,
        dynamicFields: { weight: 1, unit: 'kg', origin: 'Bangladesh', expiryDate: '2027-06-01', storage: 'Store in a cool, dry place' },
      },
      {
        name: 'Fresh Farm Eggs (Dozen)',
        nameBn: 'তাজা ডিম (এক ডজন)',
        description: 'Farm-fresh chicken eggs, rich in protein, delivered same-day from local poultry farms.',
        price: 150,
        images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=800&auto=format&fit=crop'],
        category: 'Dairy & Eggs', brand: 'Others', stock: 90, isFeatured: true,
        dynamicFields: { weight: 12, unit: 'pcs', origin: 'Bangladesh', expiryDate: '2026-07-15', storage: 'Keep refrigerated' },
        flashSale: { active: true, discountPct: 8, startsAt: new Date(), endsAt: new Date(Date.now() + 5 * 86400000) },
      },
      {
        name: 'Organic Mixed Vegetables Pack',
        nameBn: 'অর্গানিক সবজির প্যাক',
        description: 'A curated mix of seasonal organic vegetables — potato, tomato, brinjal, and beans.',
        price: 180,
        images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop'],
        category: 'Vegetables', brand: 'Others', stock: 60,
        dynamicFields: { weight: 2, unit: 'kg', origin: 'Bangladesh', expiryDate: '2026-07-05', storage: 'Refrigerate for best freshness' },
      },
      {
        name: 'Pran Pure Soybean Oil',
        nameBn: 'প্রাণ পিওর সয়াবিন তেল',
        description: 'Refined soybean oil, cholesterol-free and enriched with Vitamin A — trusted household choice.',
        price: 189, comparePrice: 210,
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop'],
        category: 'Cooking Essentials', brand: 'Others', stock: 120, isFeatured: true,
        dynamicFields: { weight: 1, unit: 'L', origin: 'Bangladesh', expiryDate: '2027-01-01', storage: 'Store away from direct sunlight' },
      },
      {
        name: 'Fresh Hilsha Fish',
        nameBn: 'তাজা ইলিশ মাছ',
        description: 'Premium quality river hilsha — cleaned and ready to cook, sourced fresh daily.',
        price: 950,
        images: ['https://images.unsplash.com/photo-1535400255456-067ab866b412?q=80&w=800&auto=format&fit=crop'],
        category: 'Fish & Meat', brand: 'Others', stock: 25,
        dynamicFields: { weight: 1, unit: 'kg', origin: 'Bangladesh (Padma)', expiryDate: '2026-07-02', storage: 'Keep frozen until use' },
      },
    ],
  },
  {
    slug: 'digital-demo',
    name: 'PixelVault Digital',
    storeType: 'digital',
    ownerEmail: 'digital@shopwave.com',
    ownerName: 'Digital Demo Owner',
    primaryColor: '#0EA5E9',
    secondaryColor: '#1B9C75',
    activeModules: ['wishlist', 'cart', 'reviews'],
    products: [
      {
        name: 'Minimal Resume Template Pack (10 Designs)',
        nameBn: 'মিনিমাল রিজিউম টেমপ্লেট প্যাক',
        description: '10 ATS-friendly, fully editable resume templates in Canva and Figma formats.',
        price: 490, comparePrice: 690,
        images: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop'],
        category: 'Templates', brand: 'Others', stock: 9999, isFeatured: true,
        dynamicFields: { fileFormat: 'PDF, Figma, Canva', fileSize: '45 MB', licenseType: 'Personal Use Only', downloadLimit: 5, downloadUrl: 'https://cdn.example.com/resume-pack.zip' },
      },
      {
        name: 'Lightroom Mobile Presets — Cinematic Pack',
        nameBn: 'লাইটরুম প্রিসেট প্যাক',
        description: '20 cinematic-tone Lightroom mobile presets (.dng + .xmp) for instagram-ready photo edits.',
        price: 350,
        images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop'],
        category: 'Presets', brand: 'Others', stock: 9999, isFeatured: true,
        dynamicFields: { fileFormat: 'DNG, XMP', fileSize: '12 MB', licenseType: 'Personal Use Only', downloadLimit: 3, downloadUrl: 'https://cdn.example.com/presets-cinematic.zip' },
        flashSale: { active: true, discountPct: 20, startsAt: new Date(), endsAt: new Date(Date.now() + 5 * 86400000) },
      },
      {
        name: 'E-commerce UI Kit for Figma',
        nameBn: 'ই-কমার্স ইউআই কিট',
        description: 'Complete e-commerce mobile + web UI kit with 80+ screens, components, and auto-layout.',
        price: 1490, comparePrice: 1990,
        images: ['https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=800&auto=format&fit=crop'],
        category: 'UI Kits', brand: 'Others', stock: 9999, isFeatured: true,
        dynamicFields: { fileFormat: 'Figma (.fig)', fileSize: '180 MB', licenseType: 'Extended License', downloadLimit: 3, downloadUrl: 'https://cdn.example.com/ecommerce-uikit.fig' },
      },
      {
        name: '"Freelancing in Bangladesh" eBook',
        nameBn: 'ফ্রিল্যান্সিং ইবুক',
        description: 'A complete guide to starting and scaling a freelance career from Bangladesh — 120 pages.',
        price: 290,
        images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop'],
        category: 'eBooks', brand: 'Others', stock: 9999,
        dynamicFields: { fileFormat: 'PDF, EPUB', fileSize: '8 MB', licenseType: 'Personal Use Only', downloadLimit: 5, downloadUrl: 'https://cdn.example.com/freelancing-bd.pdf' },
      },
      {
        name: 'Royalty-Free Lo-Fi Beats Pack (15 Tracks)',
        nameBn: 'লো-ফাই বিটস প্যাক',
        description: '15 royalty-free lo-fi instrumental tracks for YouTube, podcasts, and content creation.',
        price: 690,
        images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop'],
        category: 'Audio', brand: 'Others', stock: 9999,
        dynamicFields: { fileFormat: 'MP3, WAV', fileSize: '210 MB', licenseType: 'Commercial Use', downloadLimit: 3, downloadUrl: 'https://cdn.example.com/lofi-pack.zip' },
      },
    ],
  },
  {
    slug: 'multi-demo',
    name: 'BazaarBD Megastore',
    storeType: 'multi',
    ownerEmail: 'multi@shopwave.com',
    ownerName: 'Multi-Category Demo Owner',
    primaryColor: '#F97316',
    secondaryColor: '#4B44B0',
    activeModules: ['wishlist', 'cart', 'comparison', 'flashSale', 'reviews', 'loyaltyPoints', 'referral'],
    products: [
      {
        name: 'Xiaomi Mi Smart Band 8',
        nameBn: 'শাওমি মি স্মার্ট ব্যান্ড ৮',
        description: 'AMOLED display fitness tracker with heart-rate monitoring, SpO2, and 16 days battery life.',
        price: 3299, comparePrice: 3799,
        images: ['https://images.unsplash.com/photo-1575311373937-04faf1bd6f9c?q=80&w=800&auto=format&fit=crop'],
        category: 'Electronics', brand: 'Xiaomi', stock: 45, isFeatured: true,
        dynamicFields: {},
      },
      {
        name: "Men's Casual Sneakers",
        nameBn: 'পুরুষদের ক্যাজুয়াল স্নিকার্স',
        description: 'Lightweight breathable sneakers with cushioned sole — built for all-day comfort.',
        price: 1799,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'],
        category: 'Fashion', brand: 'Others', stock: 35, isFeatured: true,
        dynamicFields: {},
        flashSale: { active: true, discountPct: 12, startsAt: new Date(), endsAt: new Date(Date.now() + 5 * 86400000) },
      },
      {
        name: 'Non-Stick Cookware Set (5 Pcs)',
        nameBn: 'নন-স্টিক রান্নার সেট',
        description: 'Durable non-stick cookware set including frypan, sauce pan, and kadai — induction compatible.',
        price: 2999, comparePrice: 3499,
        images: ['https://images.unsplash.com/photo-1584990347449-a0a8bbb7e1f5?q=80&w=800&auto=format&fit=crop'],
        category: 'Home & Kitchen', brand: 'Others', stock: 22, isFeatured: true,
        dynamicFields: {},
      },
      {
        name: 'Kids Building Blocks Set (200 Pcs)',
        nameBn: 'বাচ্চাদের বিল্ডিং ব্লক সেট',
        description: 'Educational building block set that encourages creativity and motor skill development.',
        price: 990,
        images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop'],
        category: 'Toys & Baby', brand: 'Others', stock: 50,
        dynamicFields: {},
      },
      {
        name: 'Whey Protein Powder 1kg (Chocolate)',
        nameBn: 'হুয়ে প্রোটিন পাউডার',
        description: '24g protein per serving, fast-absorbing whey blend for post-workout recovery.',
        price: 3499,
        images: ['https://images.unsplash.com/photo-1579722820308-d74e571900a9?q=80&w=800&auto=format&fit=crop'],
        category: 'Health & Sports', brand: 'Others', stock: 28,
        dynamicFields: {},
      },
    ],
  },
];

const seedStoreTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    for (const def of STORE_DEFS) {
      let owner = await User.findOne({ email: def.ownerEmail });
      if (!owner) {
        owner = new User({
          name: def.ownerName,
          email: def.ownerEmail,
          password: DEMO_PASSWORD,
          role: 'storeAdmin',
          isVerified: true,
        });
        await owner.save();
        console.log(`✅ Owner created: ${def.ownerEmail}`);
      } else {
        console.log(`⚠️  Owner already exists: ${def.ownerEmail} — reusing`);
      }

      let store = await Store.findOne({ slug: def.slug });
      if (!store) {
        store = new Store({
          name: def.name,
          slug: def.slug,
          owner: owner._id,
          storeType: def.storeType,
          config: {
            primaryColor: def.primaryColor,
            secondaryColor: def.secondaryColor,
            currency: 'BDT',
            language: 'en',
            activeModules: def.activeModules,
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
        await store.save();
        console.log(`✅ Store created: ${def.name}  (/${def.slug})`);
      } else {
        console.log(`⚠️  Store already exists: /${def.slug} — reusing`);
      }

      const existingCount = await Product.countDocuments({ store: store._id });
      if (existingCount > 0) {
        console.log(`   ⚠️  ${existingCount} product(s) already exist — skipping product seed for this store\n`);
        continue;
      }

      const productsToInsert = def.products.map(p => ({ ...p, store: store._id }));
      await Product.insertMany(productsToInsert);
      console.log(`   ✅ Seeded ${productsToInsert.length} products for /${def.slug}\n`);
    }

    console.log('🎉 All store-type demo stores seeded successfully!\n');
    console.log('── Login credentials (all use the same password) ──');
    console.log(`   Password: ${DEMO_PASSWORD}\n`);
    STORE_DEFS.forEach(def => {
      console.log(`   ${def.storeType.padEnd(12)} → ${def.ownerEmail.padEnd(28)} → http://localhost:5173/?store=${def.slug}`);
    });
    console.log('\nTip: open each link above to see ShopWave render a completely different storefront from the same codebase.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedStoreTypes();
