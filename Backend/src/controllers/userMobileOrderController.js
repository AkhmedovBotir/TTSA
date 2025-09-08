const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Buyurtma yaratish
const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { 
            deliveryAddress, 
            deliveryNotes, 
            paymentMethod = 'cash',
            estimatedDelivery 
        } = req.body;

        // Savatchani topish
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price originalPrice quantity unit unitSize shop status'
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Savatcha bo'sh"
            });
        }

        // Yetkazib berish manzili
        if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.address) {
            return res.status(400).json({
                success: false,
                message: "Yetkazib berish ma'lumotlari to'liq emas"
            });
        }

        // Mahsulotlarni tekshirish va buyurtma elementlarini yaratish
        const orderItems = [];
        let totalPrice = 0;
        let totalOriginalPrice = 0;
        let itemCount = 0;

        for (let cartItem of cart.items) {
            const product = await Product.findById(cartItem.product._id);
            
            if (!product || product.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: `Mahsulot "${cartItem.product.name}" mavjud emas`
                });
            }

            if (product.quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Mahsulot "${product.name}" uchun yetarli miqdor yo'q. Mavjud: ${product.quantity}`
                });
            }

            const discount = product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

            orderItems.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price,
                originalPrice: product.originalPrice,
                discount: discount
            });

            totalPrice += product.price * cartItem.quantity;
            totalOriginalPrice += product.originalPrice * cartItem.quantity;
            itemCount += cartItem.quantity;
        }

        // Buyurtmani yaratish
        const order = new Order({
            user: userId,
            items: orderItems,
            totalPrice: totalPrice,
            totalOriginalPrice: totalOriginalPrice,
            totalDiscount: totalOriginalPrice - totalPrice,
            itemCount: itemCount,
            paymentMethod: paymentMethod,
            deliveryAddress: deliveryAddress,
            deliveryNotes: deliveryNotes,
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
        });

        // Order number avtomatik yaratiladi pre-save hook orqali
        await order.save();

        // Mahsulot miqdorlarini kamaytirish
        for (let item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Savatchani tozalash
        cart.items = [];
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Buyurtma muvaffaqiyatli yaratildi",
            data: {
                order: {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    totalPrice: order.totalPrice,
                    totalDiscount: order.totalDiscount,
                    itemCount: order.itemCount,
                    deliveryAddress: order.deliveryAddress,
                    deliveryNotes: order.deliveryNotes,
                    estimatedDelivery: order.estimatedDelivery,
                    createdAt: order.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Buyurtma yaratishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Barcha buyurtmalarni olish
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { 
            page = 1, 
            limit = 10,
            status,
            paymentStatus
        } = req.query;

        // Query yaratish
        const query = { user: userId };
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Buyurtmalarni olish
        const orders = await Order.find(query)
            .populate({
                path: 'items.product',
                select: 'name image category subcategory unit unitSize shop',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' },
                    { path: 'shop', select: 'name title' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Order.countDocuments(query);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
                id: item._id,
                product: {
                    id: item.product._id,
                    name: item.product.name,
                    image: item.product.image,
                    category: item.product.category,
                    subcategory: item.product.subcategory,
                    unit: item.product.unit,
                    unitSize: item.product.unitSize,
                    shop: item.product.shop
                },
                quantity: item.quantity,
                price: item.price,
                originalPrice: item.originalPrice,
                discount: item.discount,
                totalPrice: item.price * item.quantity
            })),
            totalPrice: order.totalPrice,
            totalOriginalPrice: order.totalOriginalPrice,
            totalDiscount: order.totalDiscount,
            itemCount: order.itemCount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            deliveryAddress: order.deliveryAddress,
            deliveryNotes: order.deliveryNotes,
            estimatedDelivery: order.estimatedDelivery,
            actualDelivery: order.actualDelivery,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + orders.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Buyurtmalarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Bitta buyurtmani olish
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri buyurtma ID"
            });
        }

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate({
                path: 'items.product',
                select: 'name image category subcategory unit unitSize shop',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' },
                    { path: 'shop', select: 'name title address phone' }
                ]
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Buyurtma topilmadi"
            });
        }

        const formattedOrder = {
            id: order._id,
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
                id: item._id,
                product: {
                    id: item.product._id,
                    name: item.product.name,
                    image: item.product.image,
                    category: item.product.category,
                    subcategory: item.product.subcategory,
                    unit: item.product.unit,
                    unitSize: item.product.unitSize,
                    shop: item.product.shop
                },
                quantity: item.quantity,
                price: item.price,
                originalPrice: item.originalPrice,
                discount: item.discount,
                totalPrice: item.price * item.quantity
            })),
            totalPrice: order.totalPrice,
            totalOriginalPrice: order.totalOriginalPrice,
            totalDiscount: order.totalDiscount,
            itemCount: order.itemCount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            deliveryAddress: order.deliveryAddress,
            deliveryNotes: order.deliveryNotes,
            estimatedDelivery: order.estimatedDelivery,
            actualDelivery: order.actualDelivery,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        res.json({
            success: true,
            data: formattedOrder
        });

    } catch (error) {
        console.error('Buyurtmani olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Buyurtmani bekor qilish
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri buyurtma ID"
            });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Buyurtma topilmadi"
            });
        }

        // Faqat "pending" holatdagi buyurtmani bekor qilish mumkin
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Bu buyurtmani bekor qilish mumkin emas"
            });
        }

        // Buyurtma holatini yangilash
        order.status = 'cancelled';
        await order.save();

        // Mahsulot miqdorlarini qaytarish
        for (let item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: item.quantity } }
            );
        }

        res.json({
            success: true,
            message: "Buyurtma bekor qilindi",
            data: {
                orderId: order._id,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Buyurtmani bekor qilishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Buyurtma statistikasi
const getOrderStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const stats = await Order.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalPrice' },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    processingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelledOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            pendingOrders: 0,
            processingOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Buyurtma statistikasini olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getOrderStats
};

