process.env.MONGO_URI='mongodb+srv://shopwave:ihKIM7OmSKu2N9Ai@cluster0.e0es9ji.mongodb.net/shopwave?retryWrites=true&w=majority&appName=Cluster0';
import('mongoose').then(async m => {
  await m.default.connect(process.env.MONGO_URI);
  const db = m.default.connection.db;
  
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.default.genSalt(10);
  const hashedPwd = await bcrypt.default.hash('StoreDemo@1234', salt);
  
  const demoUser = await db.collection('users').insertOne({
    name: 'Demo Store Admin',
    email: 'demo-store@shopwave.com',
    password: hashedPwd,
    role: 'storeAdmin',
    phone: '+8801234567891',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const demoStore = await db.collection('stores').findOne({ slug: 'demo' }, { projection: { _id: 1 } });
  await db.collection('stores').updateOne(
    { slug: 'demo' },
    { $set: { owner: demoUser.insertedId } }
  );
  
  console.log('Created demo store admin:', demoUser.insertedId.toString());
  console.log('Updated demo store owner');
  
  const demoProduct = await db.collection('products').findOne(
    { store: demoStore._id },
    { projection: { _id: 1 } }
  );
  console.log('Demo product:', demoProduct?._id?.toString());
  
  const customer = await db.collection('users').findOne({email:'customer@shopwave.com'},{projection:{_id:1}});
  
  if (demoProduct && customer) {
    await db.collection('reviews').deleteOne({user: customer._id, product: demoProduct._id});
    
    await db.collection('reviews').insertOne({
      user: customer._id,
      product: demoProduct._id,
      store: demoStore._id,
      rating: 4,
      body: 'Great demo product!',
      isVerifiedPurchase: true,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created review for demo product');
  }
  
  await m.default.connection.close();
});
