import { db } from './firestore.js';

async function testWrite() {
  console.log('Attempting test write to Firestore...');
  try {
    const res = await db.collection('test').add({
      message: 'Hello from automation!',
      time: new Date()
    });
    console.log('✅ Success! Document written with ID:', res.id);
  } catch (error) {
    console.error('❌ Test write failed:');
    console.error(error);
  }
  process.exit();
}

testWrite();
