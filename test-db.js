const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://127.0.0.1:27017/primenews';

console.log('Testing connection to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Success: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error: Could not connect to MongoDB', err);
        process.exit(1);
    });
