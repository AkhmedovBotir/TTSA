const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('./config/database');
const setupAdminSocket = require('./sockets/adminSocket');

const app = express();
const httpServer = createServer(app);

// Middleware
const corsOptions = {
  origin: 'http://localhost:5173', // yoki process.env.FRONTEND_URL
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/shop-owner', require('./routes/shopOwner'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/client', require('./routes/client'));
app.use('/api/category', require('./routes/category'));
app.use('/api/agent', require('./routes/agent'))
app.use('/api/product', require('./routes/product'))
app.use('/api/shop-owner-mobile', require('./routes/shopOwnerMobile'));
app.use('/api/seller-mobile', require('./routes/sellerMobile'));
app.use('/api/installment-payment', require('./routes/installmentPayment'));
app.use('/api/agent-mobile', require('./routes/agentMobile'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/draft-orders', require('./routes/draftOrder'));
app.use('/api/order-history', require('./routes/orderHistory'));
app.use('/api/user-mobile', require('./routes/userMobile'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Serverda xatolik yuz berdi",
        error: err.message
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB ga ulanish muvaffaqiyatli');
        
        // Socket.io sozlamalari
        
        // Server
        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => {
            console.log(`Server ${PORT} portda ishga tushdi`);
        });
    })
    .catch(err => {
        console.error('MongoDB ga ulanishda xatolik:', err);
        process.exit(1);
    });