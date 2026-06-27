import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://lovishgoyaldev_db_user:dDoRXXfkvnh4WSy0@cluster0.zudjn4a.mongodb.net/surprizo?retryWrites=true&w=majority';

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Database connected!');

    // Fetch and print all users name, email, phoneNumber, and addresses
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    console.log('--- ALL USERS ---');
    for (const u of users) {
      console.log(`User: id=${u._id}, name=${u.name}, email=${u.email}, phone=${u.phoneNumber}`);
      if (u.addresses && u.addresses.length > 0) {
        for (const addr of u.addresses) {
          console.log(`  Address phone: ${addr.phone}, name: ${addr.name}`);
        }
      }
    }

    // Fetch and print all orders shipping address phones
    const ordersCollection = mongoose.connection.db.collection('orders');
    const orders = await ordersCollection.find({}).toArray();
    console.log('--- ALL ORDERS ---');
    for (const o of orders) {
      console.log(`Order: id=${o._id}, shippingName=${o.shippingAddress?.name}, shippingPhone=${o.shippingAddress?.phone}`);
    }

  } catch (error) {
    console.error('Error running search:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

run();