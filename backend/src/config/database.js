const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB ga muvaffaqiyatli ulanildi');
    } catch (error) {
        console.error('MongoDB ga ulanishda xatolik:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
