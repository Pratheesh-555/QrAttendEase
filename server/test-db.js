import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing MongoDB Connection...\n');
console.log('📍 Connection String:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file!');
  process.exit(1);
}

if (process.env.MONGODB_URI.includes('<db_password>')) {
  console.error('❌ Please replace <db_password> with your actual MongoDB password!');
  console.log('\n📝 Steps:');
  console.log('1. Go to https://cloud.mongodb.com/');
  console.log('2. Click "Database Access" → Find user → Edit Password');
  console.log('3. Copy the password and replace <db_password> in server/.env');
  console.log('4. If password has special characters, URL encode them:');
  console.log('   @ → %40, # → %23, $ → %24');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  
  console.log('✅ MongoDB Connected Successfully!\n');
  console.log('📊 Connection Details:');
  console.log('   Host:', mongoose.connection.host);
  console.log('   Database:', mongoose.connection.name);
  console.log('   Status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  
  // Test write operation
  const testSchema = new mongoose.Schema({ test: String, timestamp: Date });
  const TestModel = mongoose.model('ConnectionTest', testSchema);
  
  console.log('\n🧪 Testing Write Operation...');
  const testDoc = await TestModel.create({ test: 'Connection successful!', timestamp: new Date() });
  console.log('✅ Write successful! Document ID:', testDoc._id);
  
  console.log('\n🧪 Testing Read Operation...');
  const readDoc = await TestModel.findById(testDoc._id);
  console.log('✅ Read successful! Data:', readDoc.test);
  
  console.log('\n🧹 Cleaning up test data...');
  await TestModel.deleteOne({ _id: testDoc._id });
  console.log('✅ Cleanup successful!');
  
  console.log('\n🎉 All tests passed! Your database is ready to use!');
  
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error('\n❌ MongoDB Connection Failed!\n');
  console.error('Error:', error.message);
  
  if (error.message.includes('bad auth')) {
    console.log('\n💡 Solution: Check your password in the connection string');
    console.log('   Make sure special characters are URL encoded');
  } else if (error.message.includes('ENOTFOUND')) {
    console.log('\n💡 Solution: Check your cluster name in the connection string');
  } else if (error.message.includes('IP')) {
    console.log('\n💡 Solution: Whitelist your IP address in MongoDB Atlas');
    console.log('   Go to Network Access → Add IP Address → Allow from Anywhere');
  }
  
  process.exit(1);
}
