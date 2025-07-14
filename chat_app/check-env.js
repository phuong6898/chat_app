require('dotenv').config();

console.log('=== Environment Variables Check ===');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING');
console.log('PORT:', process.env.PORT || '5000 (default)');

if (!process.env.JWT_SECRET) {
    console.log('\n⚠️  JWT_SECRET is missing! Please set it in your .env file');
    console.log('Example: JWT_SECRET=your_secret_key_here');
}

if (!process.env.JWT_REFRESH_SECRET) {
    console.log('\n⚠️  JWT_REFRESH_SECRET is missing! Please set it in your .env file');
    console.log('Example: JWT_REFRESH_SECRET=your_refresh_secret_key_here');
}

if (!process.env.MONGO_URI) {
    console.log('\n⚠️  MONGO_URI is missing! Please set it in your .env file');
    console.log('Example: MONGO_URI=mongodb://localhost:27017/chat_app');
}

console.log('\n=== End Check ==='); 