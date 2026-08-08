process.env.MONGO_URI='mongodb+srv://shopwave:ihKIM7OmSKu2N9Ai@cluster0.e0es9ji.mongodb.net/shopwave?retryWrites=true&w=majority&appName=Cluster0';
import('mongoose').then(async m => {
  await m.default.connect(process.env.MONGO_URI);
  const db = m.default.connection.db;

  const demo = await db.collection('stores').findOne({slug:'demo'},{projection:{name:1}});
  console.log('DEMO name:', demo.name);

  const clothing = await db.collection('stores').findOne({slug:'fashion-hub'},{projection:{name:1,config:1}});
  console.log('CLOTHING name:', clothing.name);
  console.log('CLOTHING config:', JSON.stringify(clothing.config));

  // Check if theme was saved
  console.log('Has theme in config:', 'theme' in (clothing.config || {}));

  // Revert name
  await db.collection('stores').updateOne(
    {slug:'fashion-hub'},
    { $set: { name: 'Fashion Hub' } }
  );
  console.log('Reverted clothing name');

  const verify = await db.collection('stores').findOne({slug:'fashion-hub'},{projection:{name:1}});
  console.log('Verified name:', verify.name);

  await m.default.connection.close();
});
