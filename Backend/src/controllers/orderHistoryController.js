const OrderHistory = require('../models/OrderHistory');
const AgentProduct = require('../models/AgentProduct');
const { updateAgentProductQuantities } = require('../utils/productUtils');
const mongoose = require('mongoose');

// Barcha buyurtmalar tarixini olish
const getOrderHistory = async (req, res) => {
    try {
        console.log('User making request:', req.user); // Debug log
        const { 
            page = 1, 
            limit = 10, 
            startDate, 
            endDate, 
            search 
        } = req.query;
        console.log('Query parameters:', { page, limit, startDate, endDate, search }); // Debug log

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Filter by search query (orderId or product name)
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'products.name': { $regex: search, $options: 'i' } }
            ];
        }

        // For non-admin users, only show their own orders
        if (req.user.role !== 'admin') {
            console.log('Non-admin user, filtering by seller ID:', req.user._id || req.user.id); // Debug log
            query.seller = req.user._id || req.user.id;
        } else {
            console.log('Admin user, showing all orders'); // Debug log
        }

        console.log('Final query:', JSON.stringify(query, null, 2)); // Debug log
        
        // First, get the raw orders without populating
        let orders = await OrderHistory.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Manually populate the seller and storeOwner
        console.log('Starting to populate orders...');
        orders = await Promise.all(orders.map(async (order, index) => {
            console.log(`\nProcessing order ${index + 1}:`, order._id);
            
            // Log original seller and storeOwner values
            console.log('Original seller:', order.seller);
            console.log('Original storeOwner:', order.storeOwner);
            
            // Populate seller if exists
            if (order.seller) {
                console.log('Looking up seller with ID:', order.seller);
                try {
                    // Try to find as Agent first, then as Seller
                    let seller = await mongoose.model('Agent').findById(order.seller).select('fullname phone').lean();
                    
                    if (!seller) {
                        // If not found as Agent, try as Seller
                        seller = await mongoose.model('Seller').findById(order.seller).select('fullName username phone').lean();
                        if (seller) {
                            // Map seller fields to match agent structure
                            seller.fullname = seller.fullName || seller.username;
                        }
                    }
                    
                    console.log('Found seller:', seller);
                    order.seller = seller || order.seller;
                } catch (err) {
                    console.error('Error populating seller:', err);
                }
            } else {
                console.log('No seller ID found for this order');
            }
            
            // Populate storeOwner if exists
            if (order.storeOwner) {
                console.log('Looking up storeOwner with ID:', order.storeOwner);
                try {
                    const storeOwner = await mongoose.model('ShopOwner').findById(order.storeOwner).select('shopName').lean();
                    console.log('Found storeOwner:', storeOwner);
                    order.storeOwner = storeOwner || order.storeOwner;
                } catch (err) {
                    console.error('Error populating storeOwner:', err);
                }
            } else {
                console.log('No storeOwner ID found for this order');
            }
            
            console.log('Processed order:', {
                _id: order._id,
                seller: order.seller,
                storeOwner: order.storeOwner
            });
            
            return order;
        }));
        
        // Get total count
        const total = await OrderHistory.countDocuments(query);
        
        console.log('Found orders:', orders.length); // Debug log
        console.log('Total orders in DB:', total); // Debug log

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Buyurtmalar tarixini olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// To'g'ridan-to'g'ri buyurtma yaratish
const createDirectOrder = async (req, res) => {
    try {
        const { products, storeOwner, paymentMethod = 'cash' } = req.body;

        // Validate required fields
        if (!products || !products.length) {
            return res.status(400).json({
                success: false,
                message: 'Kamida bitta mahsulot kiritilishi kerak'
            });
        }

        // Validate seller and storeOwner
        if (!req.user || (!req.user._id && !req.user.id)) {
            console.log('User object from auth:', req.user); // Debug log
            return res.status(400).json({
                success: false,
                message: 'Foydalanuvchi ma\'lumotlari topilmadi. Iltimos, qaytadan kiring.'
            });
        }
        
        // Use _id if id is not available (Mongoose uses _id by default)
        const sellerId = req.user._id || req.user.id;

        if (!storeOwner) {
            return res.status(400).json({
                success: false,
                message: 'Do\'kon egasini tanlang'
            });
        }

        // Calculate total sum
        const totalSum = products.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseFloat(item.quantity));
        }, 0);

        // Get the last order ID
        const lastOrder = await OrderHistory.findOne({}, {}, { sort: { orderId: -1 } });
        const orderId = lastOrder ? lastOrder.orderId + 1 : 1001;

// Convert storeOwner to ObjectId if it's not already
        const storeOwnerId = typeof storeOwner === 'string' ? new mongoose.Types.ObjectId(storeOwner) : storeOwner;

        // Create order history
        const order = new OrderHistory({
            orderId,
            seller: new mongoose.Types.ObjectId(sellerId),
            storeOwner: storeOwnerId,
            products: products.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit || 'dona',
                unitSize: item.unitSize || 1
            })),
            totalSum,
            paymentMethod,
            status: 'completed',
            completedAt: new Date()
        });

        await order.save();

        // Update product quantities based on user role
        if (products && products.length) {
            try {
                if (req.user.role === 'agent') {
                    // Agent logic - update agent product quantities
                    const productsToUpdate = products.map(product => ({
                        productId: product.productId,
                        quantity: product.quantity,
                        agentId: sellerId
                    }));

                    console.log('Updating agent product quantities:', productsToUpdate);
                    await updateAgentProductQuantities(productsToUpdate, true);
                } else if (req.user.role === 'seller') {
                    // Seller logic - update product quantities directly
                    const Product = require('../models/Product');
                    
                    // Check if quantities are sufficient
                    for (const product of products) {
                        const sellerProduct = await Product.findById(product.productId);
                        if (!sellerProduct) {
                            throw new Error(`Mahsulot topilmadi: ${product.productId}`);
                        }
                        if (sellerProduct.quantity < product.quantity) {
                            throw new Error(`Mahsulot ${product.name} yetarli emas. Mavjud: ${sellerProduct.quantity}, kerak: ${product.quantity}`);
                        }
                    }
                    
                    // Update product quantities
                    for (const product of products) {
                        await Product.findByIdAndUpdate(product.productId, {
                            $inc: { quantity: -product.quantity }
                        });
                    }
                    
                    console.log('Updated seller product quantities');
                }
            } catch (error) {
                console.error('Error updating product quantities:', error);
                // Don't fail the order if quantity update fails, just log it
            }
        }

        res.status(201).json({
            success: true,
            message: 'Buyurtma muvaffaqiyatli yaratildi',
            data: order
        });
    } catch (error) {
        console.error('To\'g\'ridan-to\'g\'ri buyurtma yaratishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Buyurtmani bekor qilish
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await OrderHistory.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Buyurtma topilmadi'
            });
        }

        // Check permission (only admin or seller can cancel)
        const sellerId = order.seller?._id ? order.seller._id.toString() : order.seller?.toString();
        const userId = req.user._id?.toString() || req.user.id?.toString();
        
        console.log('Seller ID from order:', sellerId);
        console.log('Current user ID:', userId);
        console.log('User role:', req.user.role);
        
        if (sellerId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sizda bu amalni bajarish uchun ruxsat yo\'q. Faqat admin yoki buyurtma egasi bekor qilishi mumkin.'
            });
        }

        // Check if order can be cancelled
        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Bu buyurtma allaqachon bekor qilingan'
            });
        }

        // Restore product quantities before cancelling
        if (order.products && order.products.length) {
            try {
                const sellerId = order.seller?._id?.toString() || order.seller?.toString();
                if (sellerId) {
                    // Check if this was an agent order or seller order
                    const isAgentOrder = await AgentProduct.exists({ agent: sellerId });
                    
                    if (isAgentOrder) {
                        // Agent order - restore agent product quantities
                        const productsToRestore = order.products.map(product => ({
                            productId: product.productId,
                            quantity: product.quantity,
                            agentId: sellerId
                        }));
                        
                        console.log('Restoring agent product quantities:', productsToRestore);
                        await updateAgentProductQuantities(productsToRestore, false); // false = add quantities back
                    } else {
                        // Seller order - restore product quantities directly
                        const Product = require('../models/Product');
                        
                        for (const product of order.products) {
                            await Product.findByIdAndUpdate(product.productId, {
                                $inc: { quantity: product.quantity }
                            });
                        }
                        
                        console.log('Restored seller product quantities');
                    }
                } else {
                    console.warn('Could not determine seller ID for order:', order._id);
                }
            } catch (error) {
                console.error('Error restoring product quantities:', error);
                // Don't fail the cancellation if quantity restore fails
            }
        }

        // Update order status to cancelled
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason || 'Bekor qilish sababi kiritilmagan';
        await order.save();

        // Here you might want to add logic to reverse any payment transactions
        // or send notifications to relevant parties

        res.status(200).json({
            success: true,
            message: 'Buyurtma muvaffaqiyatli bekor qilindi',
            data: order
        });
    } catch (error) {
        console.error('Buyurtmani bekor qilishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Admin uchun barcha buyurtmalar tarixini olish
const getAdminOrderHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, paymentMethod, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (status) query.status = status;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const total = await OrderHistory.countDocuments(query);
        const orders = await OrderHistory.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

        const sellerIds = [...new Set(orders.map(order => order.seller?.toString()).filter(Boolean))];
        const storeOwnerIds = [...new Set(orders.map(order => order.storeOwner?.toString()).filter(Boolean))];

        // Fetch all sellers (both Agent and Seller models) and store owners in bulk
        const [agents, sellers, storeOwners] = await Promise.all([
            sellerIds.length > 0 ? mongoose.model('Agent').find({ _id: { $in: sellerIds } }, 'fullname phone').lean() : [],
            sellerIds.length > 0 ? mongoose.model('Seller').find({ _id: { $in: sellerIds } }, 'fullName username phone shop').lean() : [], // Added shop field
            storeOwnerIds.length > 0 ? mongoose.model('ShopOwner').find({ _id: { $in: storeOwnerIds } }, 'name phone').lean() : []
        ]);

        // Create seller map with shop information
        const sellerMap = {};
        agents.forEach(agent => { 
            sellerMap[agent._id.toString()] = { _id: agent._id, name: agent.fullname, phone: agent.phone, type: 'agent' }; 
        });
        sellers.forEach(seller => { 
            sellerMap[seller._id.toString()] = { 
                _id: seller._id, 
                name: seller.fullName || seller.username, 
                phone: seller.phone, 
                type: 'seller',
                shop: seller.shop // Added shop field
            }; 
        });

        const storeOwnerMap = storeOwners.reduce((acc, owner) => {
            acc[owner._id.toString()] = { _id: owner._id, name: owner.name, phone: owner.phone };
            return acc;
        }, {});

        // Populate orders with seller and storeOwner information
        const populatedOrders = await Promise.all(orders.map(async (order) => {
            const seller = order.seller ? sellerMap[order.seller.toString()] || null : null;
            
            // If storeOwner is null but seller has shop, try to find the shop owner
            let storeOwner = order.storeOwner ? storeOwnerMap[order.storeOwner.toString()] || null : null;
            
            if (!storeOwner && seller && seller.shop) {
                try {
                    const shop = await mongoose.model('Shop').findById(seller.shop).populate('owner').lean();
                    if (shop && shop.owner) {
                        storeOwner = {
                            _id: shop.owner._id,
                            name: shop.owner.name,
                            phone: shop.owner.phone
                        };
                    }
                } catch (error) {
                    console.log('Error finding shop owner for seller:', seller._id, error.message);
                }
            }

            return {
                ...order,
                seller,
                storeOwner
            };
        }));

        res.status(200).json({
            success: true,
            data: populatedOrders,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
        });
    } catch (error) {
        console.error('Error in getAdminOrderHistory:', error);
        res.status(500).json({ success: false, message: "Server xatosi", error: error.message });
    }
};

module.exports = {
    getOrderHistory,
    createDirectOrder,
    cancelOrder,
    getAdminOrderHistory
};
