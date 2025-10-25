const mongoose = require('mongoose');
const DraftOrder = require('../models/DraftOrder');
const OrderHistory = require('../models/OrderHistory');
const AgentProduct = require('../models/AgentProduct');
const InstallmentPayment = require('../models/InstallmentPayment');
const InterestRate = require('../models/InterestRate');
const { updateAgentProductQuantities } = require('../utils/productUtils');

// Barcha vaqtinchalik buyurtmalarni olish
const getDraftOrders = async (req, res) => {
    try {
        // Convert user ID to string for consistent comparison
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        
        // Admin sees all orders, others see only their own
        const filter = req.user.role === 'admin' ? {} : { seller: userId };
        
        // First, find the draft orders without populating to check if they exist
        const draftOrders = await DraftOrder.find(filter).sort({ createdAt: -1 }).lean();
        
        console.log('User ID:', userId);
        console.log('User role:', req.user.role);
        console.log('Raw orders found:', draftOrders.length);
        
        // If no orders found, return empty array
        if (draftOrders.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        
        // Now populate the necessary fields with error handling
        let populatedOrders = [];
        try {
            // First populate seller and shop references
            populatedOrders = await Promise.all(draftOrders.map(async (order) => {
                try {
                    // Populate seller
                    if (order.seller) {
                        const seller = await mongoose.model('Seller').findById(order.seller).select('fullName username').lean();
                        order.seller = seller;
                    }
                    
                    // Populate storeOwner (Shop)
                    if (order.storeOwner) {
                        const shop = await mongoose.model('Shop').findById(order.storeOwner).select('name').lean();
                        order.storeOwner = shop;
                    }
                    
                    // Populate products
                    if (order.products && order.products.length) {
                        const productIds = order.products.map(p => p.productId).filter(Boolean);
                        if (productIds.length) {
                            const products = await mongoose.model('Product')
                                .find({ _id: { $in: productIds } })
                                .select('name images')
                                .lean();
                                
                            // Map products back to order
                            const productMap = {};
                            products.forEach(p => productMap[p._id.toString()] = p);
                            
                            order.products = order.products.map(item => ({
                                ...item,
                                productId: item.productId ? (productMap[item.productId.toString()] || null) : null
                            }));
                        }
                    }
                    
                    return order;
                } catch (err) {
                    console.error('Error populating order:', err);
                    return order; // Return unpopulated order if error
                }
            }));
            
            console.log('Successfully populated orders:', populatedOrders.length);
            
        } catch (populateError) {
            console.error('Population error:', populateError);
            // If population fails, return the orders without population
            populatedOrders = draftOrders;
        }

        res.status(200).json({
            success: true,
            data: populatedOrders
        });
    } catch (error) {
        console.error('Vaqtinchalik buyurtmalarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Yangi vaqtinchalik buyurtma yaratish
const createDraftOrder = async (req, res) => {
    try {
        const { products, storeOwner, paymentMethod = 'cash' } = req.body;
        
        if (!products || !products.length) {
            return res.status(400).json({
                success: false,
                message: 'Kamida bitta mahsulot kiritilishi kerak'
            });
        }

        // Auto-resolve storeOwner for sellers
        let resolvedStoreOwner = storeOwner;
        
        if (!storeOwner && req.seller) {
            console.log('Auto-resolving storeOwner for seller:', {
                sellerId: req.seller._id,
                directShops: req.seller.shops || [],
                shopOwners: req.seller.shopOwners || []
            });
            
            // Get all shop IDs for this seller
            let allShopIds = [...(req.seller.shops || [])];
            
            // Add shops from shopOwners array
            if (req.seller.shopOwners && req.seller.shopOwners.length > 0) {
                const Shop = require('../models/Shop');
                for (const shopOwner of req.seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            console.log('Seller all shop IDs for storeOwner:', allShopIds);
            
            if (allShopIds.length > 0) {
                // Use the first available shop's owner as storeOwner
                const Shop = require('../models/Shop');
                for (const shopId of allShopIds) {
                    const shop = await Shop.findById(shopId).populate('owner');
                    if (shop && shop.owner) {
                        resolvedStoreOwner = shop.owner._id;
                        console.log('Resolved storeOwner from shop:', {
                            shopId: shop._id,
                            shopName: shop.name,
                            ownerId: resolvedStoreOwner,
                            ownerName: shop.owner.name
                        });
                        break;
                    }
                }
            }
        }
        
        // Validate required fields
        if (!resolvedStoreOwner) {
            return res.status(400).json({
                success: false,
                message: 'Do\'kon egasi kiritilishi shart yoki sizga hech qanday do\'kon tayinlanmagan'
            });
        }

        // Validate payment method
        if (paymentMethod && !['cash', 'card', 'installment'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri to\'lov usuli. Ruxsat etilgan: cash, card, installment'
            });
        }

        // Validate products
        for (const item of products) {
            if (!item.productId || !item.name || item.quantity === undefined || item.price === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Barcha maydonlarni to\'ldiring (productId, name, quantity, price)'
                });
            }

            // Convert quantity and price to numbers
            item.quantity = parseFloat(item.quantity);
            item.price = parseFloat(item.price);

            if (isNaN(item.quantity) || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mahsulot miqdori to\'g\'ri kiritilmagan'
                });
            }

            if (isNaN(item.price) || item.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mahsulot narxi to\'g\'ri kiritilmagan'
                });
            }
        }

        // Calculate total sum
        const totalSum = products.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Create the draft order
        const newDraftOrder = new DraftOrder({
            seller: req.seller ? req.seller._id : req.user._id, // Use seller or user ID
            storeOwner: resolvedStoreOwner,
            products: products.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit || 'dona',
                unitSize: item.unitSize || 1
            })),
            totalSum: totalSum,
            paymentMethod: paymentMethod || 'cash'
        });

        // Save the draft order
        await newDraftOrder.save();

        // Handle different user types (agent vs seller)
        if (req.user.role === 'agent') {
            // Agent logic - find agent products
            const agentId = req.user._id;
            const productIds = products.map(p => p.productId);
            
            const agentProducts = await AgentProduct.find({
                agent: agentId,
                $or: [
                    { _id: { $in: productIds } },
                    { product: { $in: productIds } }
                ],
                status: 'assigned'
            });
            
            console.log('Found agent products:', agentProducts);
            
            const productToAgentProduct = {};
            agentProducts.forEach(ap => {
                productToAgentProduct[ap._id.toString()] = ap;
                productToAgentProduct[ap.product.toString()] = ap;
            });
            
            const productsToUpdate = [];
            products.forEach(product => {
                const agentProduct = productToAgentProduct[product.productId];
                if (agentProduct) {
                    productsToUpdate.push({
                        productId: agentProduct._id,
                        quantity: product.quantity,
                        agentId: agentId
                    });
                } else {
                    console.warn(`No agent product found for product ${product.productId}`);
                }
            });
            
            if (productsToUpdate.length === 0) {
                throw new Error('Hech qanday mahsulot topilmadi yoki tayyor emas');
            }
            
            console.log('Updating agent products with:', productsToUpdate);
            await updateAgentProductQuantities(productsToUpdate, true);
            
        } else if (req.seller) {
            // Seller logic - update product quantities directly
            const Product = require('../models/Product');
            const Shop = require('../models/Shop');
            const productIds = products.map(p => p.productId);
            
            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(req.seller.shops || [])];
            
            // Add shops from shopOwners array
            if (req.seller.shopOwners && req.seller.shopOwners.length > 0) {
                for (const shopOwner of req.seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            console.log('Seller draft order - shop IDs:', {
                sellerId: req.seller._id,
                directShops: req.seller.shops || [],
                shopOwners: req.seller.shopOwners || [],
                allShopIds: allShopIds
            });
            
            if (allShopIds.length === 0) {
                throw new Error('Sizga hech qanday do\'kon tayinlanmagan');
            }
            
            // Find products that belong to seller's shops
            const sellerProducts = await Product.find({
                _id: { $in: productIds },
                shop: { $in: allShopIds }
            });
            
            console.log('Found seller products:', sellerProducts);
            
            if (sellerProducts.length === 0) {
                throw new Error('Sizning do\'konlaringizda bunday mahsulotlar topilmadi');
            }
            
            // Check if quantities are sufficient
            for (const product of products) {
                const sellerProduct = sellerProducts.find(sp => sp._id.toString() === product.productId);
                if (!sellerProduct) {
                    throw new Error(`Mahsulot ${product.name} sizning do'koningizda topilmadi`);
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

        res.status(201).json({
            success: true,
            message: 'Vaqtinchalik buyurtma muvaffaqiyatli saqlandi',
            data: newDraftOrder
        });
    } catch (error) {
        console.error('Vaqtinchalik buyurtma yaratishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Vaqtinchalik buyurtmani yangilash
const updateDraftOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { products, storeOwner } = req.body;

        // Validate required fields
        if (!products && !storeOwner) {
            return res.status(400).json({
                success: false,
                message: 'Yangilash uchun ma\'lumot kiritilmagan'
            });
        }

        const draftOrder = await DraftOrder.findById(id);
        if (!draftOrder) {
            return res.status(404).json({
                success: false,
                message: 'Vaqtinchalik buyurtma topilmadi'
            });
        }

        // Check permission (only owner or admin can update)
        if (draftOrder.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sizda ushbu amalni bajarish uchun ruxsat yo\'q'
            });
        }

        // Update products if provided
        if (products && products.length) {
            // First, restore quantities of old products (if any)
            if (draftOrder.products && draftOrder.products.length) {
                if (req.user.role === 'agent') {
                    // Restore agent product quantities
                    const productsToRestore = draftOrder.products.map(product => ({
                        productId: product.productId,
                        quantity: product.quantity,
                        agentId: req.user._id
                    }));
                    await updateAgentProductQuantities(productsToRestore, false);
                } else if (req.user.role === 'seller') {
                    // Restore seller product quantities
                    const Product = require('../models/Product');
                    for (const product of draftOrder.products) {
                        await Product.findByIdAndUpdate(product.productId, {
                            $inc: { quantity: product.quantity }
                        });
                    }
                }
            }

            // Validate new products
            for (const item of products) {
                if (!item.productId || !item.name || item.quantity === undefined || item.price === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'Barcha maydonlarni to\'ldiring (productId, name, quantity, price)'
                    });
                }

                // Convert quantity and price to numbers
                item.quantity = parseFloat(item.quantity);
                item.price = parseFloat(item.price);

                if (isNaN(item.quantity) || item.quantity <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mahsulot miqdori to\'g\'ri kiritilmagan'
                    });
                }

                if (isNaN(item.price) || item.price < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mahsulot narxi to\'g\'ri kiritilmagan'
                    });
                }
            }

            // Update product quantities based on user role
            try {
                if (req.user.role === 'agent') {
                    // For agents, use the existing updateAgentProductQuantities function
                    const productsToUpdate = products.map(product => ({
                        productId: product.productId,
                        quantity: product.quantity,
                        agentId: req.user._id
                    }));
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
                }
            } catch (error) {
                // If updating quantities fails, restore the original quantities
                if (draftOrder.products && draftOrder.products.length) {
                    if (req.user.role === 'agent') {
                        const productsToRestore = draftOrder.products.map(product => ({
                            productId: product.productId,
                            quantity: product.quantity,
                            agentId: req.user._id
                        }));
                        await updateAgentProductQuantities(productsToRestore, false);
                    } else if (req.user.role === 'seller') {
                        // Restore seller product quantities
                        const Product = require('../models/Product');
                        for (const product of draftOrder.products) {
                            await Product.findByIdAndUpdate(product.productId, {
                                $inc: { quantity: product.quantity }
                            });
                        }
                    }
                }
                throw error;
            }

            // Update the draft order with new products
            draftOrder.products = products.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit || 'dona',
                unitSize: item.unitSize || 1
            }));
            
            // Recalculate total sum
            draftOrder.totalSum = products.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
        }

        if (storeOwner) {
            draftOrder.storeOwner = storeOwner;
        }

        await draftOrder.save();

        res.status(200).json({
            success: true,
            message: 'Vaqtinchalik buyurtma muvaffaqiyatli yangilandi',
            data: draftOrder
        });
    } catch (error) {
        console.error('Vaqtinchalik buyurtmani yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Vaqtinchalik buyurtmani o'chirish
const deleteDraftOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const draftOrder = await DraftOrder.findById(id);
        if (!draftOrder) {
            return res.status(404).json({
                success: false,
                message: 'Vaqtinchalik buyurtma topilmadi'
            });
        }

        // Check permission
        if (draftOrder.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sizda ushbu amalni bajarish uchun ruxsat yo\'q'
            });
        }

        // Restore product quantities before deleting
        if (draftOrder.products && draftOrder.products.length) {
            if (req.user.role === 'agent') {
                // Agent logic - restore agent product quantities
                const productsToRestore = draftOrder.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity,
                    agentId: draftOrder.seller
                }));
                
                await updateAgentProductQuantities(productsToRestore, false);
            } else if (req.user.role === 'seller') {
                // Seller logic - restore product quantities directly
                const Product = require('../models/Product');
                
                for (const product of draftOrder.products) {
                    await Product.findByIdAndUpdate(product.productId, {
                        $inc: { quantity: product.quantity }
                    });
                }
                
                console.log('Restored seller product quantities');
            }
        }

        // Delete the draft order
        await DraftOrder.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Vaqtinchalik buyurtma muvaffaqiyatli o\'chirildi va mahsulot miqdorlari qaytarildi'
        });
    } catch (error) {
        console.error('Vaqtinchalik buyurtmani o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

// Vaqtinchalik buyurtmani tasdiqlash
const confirmDraftOrder = async (req, res) => {
    try {
        console.log('=== CONFIRM DRAFT ORDER REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('Draft ID:', req.params.id);
        console.log('================================');
        
        const { id } = req.params;
        let { paymentMethod = 'cash', customer, installmentDuration, startDate } = req.body;

        // Normalize incoming fields (handle stringified JSON and numbers)
        try {
            if (typeof customer === 'string') {
                customer = JSON.parse(customer);
            }
        } catch (e) {
            console.log('Failed to parse customer JSON:', e?.message);
        }
        if (typeof installmentDuration === 'string') {
            const num = Number(installmentDuration);
            if (!Number.isNaN(num)) installmentDuration = num;
        }

        // Auto-detect installment if required fields are present
        const hasInstallmentSignals = !!customer && !!installmentDuration;
        if (paymentMethod !== 'installment' && hasInstallmentSignals) {
            console.log('Coercing paymentMethod to installment due to presence of customer + installmentDuration');
            paymentMethod = 'installment';
        }
        console.log('Effective paymentMethod:', paymentMethod);

        // 1. Find the draft order
        const draftOrder = await DraftOrder.findById(id);
        if (!draftOrder) {
            return res.status(404).json({
                success: false,
                message: 'Vaqtinchalik buyurtma topilmadi'
            });
        }

        // 2. Check permission
        if (draftOrder.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sizda ushbu amalni bajarish uchun ruxsat yo\'q'
            });
        }

        // 2.5 Resolve Shop and ShopOwner robustly (draft may store Shop or ShopOwner)
        const Shop = require('../models/Shop');
        let resolvedShop = null;
        let resolvedOwnerId = null;
        
        console.log('Draft order storeOwner:', {
            draftId: draftOrder._id,
            storeOwner: draftOrder.storeOwner,
            storeOwnerType: typeof draftOrder.storeOwner
        });
        
        try {
            // Try as Shop ID first
            resolvedShop = await Shop.findById(draftOrder.storeOwner).populate('owner');
            console.log('Tried as Shop ID:', {
                found: !!resolvedShop,
                shop: resolvedShop ? { id: resolvedShop._id, name: resolvedShop.name, owner: resolvedShop.owner } : null
            });
            
            if (!resolvedShop) {
                // Try as ShopOwner ID
                resolvedShop = await Shop.findOne({ owner: draftOrder.storeOwner }).populate('owner');
                console.log('Tried as ShopOwner ID:', {
                    found: !!resolvedShop,
                    shop: resolvedShop ? { id: resolvedShop._id, name: resolvedShop.name, owner: resolvedShop.owner } : null
                });
            }
            
            // If still no shop found and we have a seller, try to find from seller's shops
            if (!resolvedShop && req.seller) {
                console.log('Trying to resolve shop from seller:', {
                    sellerId: req.seller._id,
                    directShops: req.seller.shops || [],
                    shopOwners: req.seller.shopOwners || [],
                    sellerStatus: req.seller.status
                });
                
                // Get all shop IDs for this seller
                let allShopIds = [...(req.seller.shops || [])];
                
                // Add shops from shopOwners array
                if (req.seller.shopOwners && req.seller.shopOwners.length > 0) {
                    for (const shopOwner of req.seller.shopOwners) {
                        const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                        allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                    }
                }
                
                // Remove duplicates
                allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
                
                console.log('Seller all shop IDs:', allShopIds);
                
                if (allShopIds.length > 0) {
                    // Try to find the first available shop
                    for (const shopId of allShopIds) {
                        const shop = await Shop.findById(shopId).populate('owner');
                        if (shop && shop.owner) {
                            resolvedShop = shop;
                            break;
                        }
                    }
                }
            }
            
            if (resolvedShop && resolvedShop.owner) {
                resolvedOwnerId = resolvedShop.owner._id;
                console.log('Resolved shop owner:', {
                    shopId: resolvedShop._id,
                    shopName: resolvedShop.name,
                    ownerId: resolvedOwnerId,
                    ownerName: resolvedShop.owner.name
                });
            } else {
                console.log('No shop owner resolved:', {
                    resolvedShop: !!resolvedShop,
                    hasOwner: !!(resolvedShop && resolvedShop.owner),
                    finalOwnerId: resolvedOwnerId
                });
            }
        } catch (e) {
            console.log('Shop resolution error:', e?.message);
        }

        // 3. If installment, create InstallmentPayment instead of OrderHistory
        if (paymentMethod === 'installment') {
            try {
                console.log('Validating installment customer:', customer);
                console.log('Validating installment duration:', installmentDuration);
                
                // Image ixtiyoriy
                if (!customer || !customer.fullName || !customer.birthDate || !customer.passportSeries || !customer.primaryPhone) {
                    console.log('Customer validation failed for installment');
                    console.log('Missing fields:', {
                        hasCustomer: !!customer,
                        hasFullName: !!(customer && customer.fullName),
                        hasBirthDate: !!(customer && customer.birthDate),
                        hasPassportSeries: !!(customer && customer.passportSeries),
                        hasPrimaryPhone: !!(customer && customer.primaryPhone)
                    });
                    return res.status(400).json({
                        success: false,
                        message: "Muddatli to'lov uchun mijoz ma'lumotlari to'liq kiritilishi shart"
                    });
                }
                if (!installmentDuration || ![2,3,4,5,6,10,12].includes(installmentDuration)) {
                    console.log('Installment duration validation failed');
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri muddatli to'lov muddati"
                    });
                }

                if (!startDate) {
                    console.log('Start date validation failed');
                    return res.status(400).json({
                        success: false,
                        message: "Muddatli to'lov boshlanish sanasi kiritilishi shart"
                    });
                }

                // Validate start date format and ensure it's not in the past
                const startDateObj = new Date(startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (isNaN(startDateObj.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri sana formati"
                    });
                }

                if (startDateObj < today) {
                    return res.status(400).json({
                        success: false,
                        message: "Boshlanish sanasi bugundan oldin bo'lishi mumkin emas"
                    });
                }

                const InstallmentPayment = require('../models/InstallmentPayment');

        // Ensure we have an owner id
        if (!resolvedOwnerId) {
            console.log('No resolved owner ID, trying fallback...');
            
            // Fallback: Try to get any shop owner from seller's shops
            if (req.seller) {
                const Shop = require('../models/Shop');
                let fallbackOwnerId = null;
                
                console.log('Fallback: Seller info:', {
                    sellerId: req.seller._id,
                    directShops: req.seller.shops || [],
                    shopOwners: req.seller.shopOwners || []
                });
                
                // Try direct shops first
                if (req.seller.shops && req.seller.shops.length > 0) {
                    console.log('Fallback: Trying direct shops...');
                    for (const shopId of req.seller.shops) {
                        console.log('Checking shop ID:', shopId);
                        const shop = await Shop.findById(shopId).populate('owner');
                        console.log('Shop found:', {
                            found: !!shop,
                            hasOwner: !!(shop && shop.owner),
                            shopName: shop ? shop.name : null,
                            ownerName: shop && shop.owner ? shop.owner.name : null
                        });
                        if (shop && shop.owner) {
                            fallbackOwnerId = shop.owner._id;
                            console.log('Fallback: Found owner from direct shop:', {
                                shopId: shop._id,
                                shopName: shop.name,
                                ownerId: fallbackOwnerId,
                                ownerName: shop.owner.name
                            });
                            break;
                        }
                    }
                }
                
                // Try shopOwners if no direct shop found
                if (!fallbackOwnerId && req.seller.shopOwners && req.seller.shopOwners.length > 0) {
                    console.log('Fallback: Trying shopOwners...');
                    for (const shopOwner of req.seller.shopOwners) {
                        console.log('Checking shopOwner:', shopOwner.shopOwner);
                        const shop = await Shop.findOne({ owner: shopOwner.shopOwner }).populate('owner');
                        console.log('Shop found via shopOwner:', {
                            found: !!shop,
                            hasOwner: !!(shop && shop.owner),
                            shopName: shop ? shop.name : null,
                            ownerName: shop && shop.owner ? shop.owner.name : null
                        });
                        if (shop && shop.owner) {
                            fallbackOwnerId = shop.owner._id;
                            console.log('Fallback: Found owner from shopOwners:', {
                                shopId: shop._id,
                                shopName: shop.name,
                                ownerId: fallbackOwnerId,
                                ownerName: shop.owner.name
                            });
                            break;
                        }
                    }
                }
                
                if (fallbackOwnerId) {
                    resolvedOwnerId = fallbackOwnerId;
                    console.log('Using fallback owner ID:', resolvedOwnerId);
                } else {
                    console.log('Fallback: No owner found from seller shops');
                }
            } else {
                console.log('Fallback: No seller found in request');
            }
            
            if (!resolvedOwnerId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Do'kon egasi topilmadi. Iltimos, administrator bilan bog'laning." 
                });
            }
        }

                // Calculate installment fields here (validators run before pre-save)
                const endDate = new Date(startDateObj);
                endDate.setMonth(endDate.getMonth() + installmentDuration);
                const totalSumNumber = parseFloat(draftOrder.totalSum.toString());
                
                // Get interest rate for this duration
                const interestRateDoc = await InterestRate.getActiveRate(installmentDuration);
                let interestRate = 0;
                let interestAmount = 0;
                let totalWithInterest = totalSumNumber;
                
                if (interestRateDoc) {
                    interestRate = interestRateDoc.interestRate;
                    interestAmount = Math.round((totalSumNumber * interestRate) / 100);
                    totalWithInterest = totalSumNumber + interestAmount;
                }
                
                const monthlyPayment = Math.ceil(totalWithInterest / installmentDuration);

                const installmentPayment = new InstallmentPayment({
                    orderId: draftOrder.orderId,
                    seller: draftOrder.seller,
                    storeOwner: resolvedOwnerId,
                    products: draftOrder.products.map(p => ({
                        productId: p.productId,
                        name: p.name,
                        quantity: p.quantity,
                        price: p.price,
                        unit: p.unit,
                        unitSize: p.unitSize
                    })),
                    totalSum: totalSumNumber,
                    customer: {
                        fullName: customer.fullName,
                        birthDate: new Date(customer.birthDate),
                        passportSeries: customer.passportSeries.toUpperCase(),
                        primaryPhone: customer.primaryPhone,
                        secondaryPhone: customer.secondaryPhone || null,
                        ...(customer.image ? { image: customer.image } : {})
                    },
                    installment: {
                        duration: installmentDuration,
                        startDate,
                        endDate,
                        monthlyPayment,
                        interestRate,
                        totalWithInterest,
                        interestAmount
                    }
                });

                await installmentPayment.save();

                await DraftOrder.findByIdAndDelete(id);

                return res.status(200).json({
                    success: true,
                    message: "Muddatli to'lov muvaffaqiyatli tasdiqlandi",
                    data: installmentPayment
                });
            } catch (e) {
                console.error('Confirm installment error:', e);
                return res.status(500).json({ success: false, message: "Muddatli to'lovni tasdiqlashda xatolik", error: e.message });
            }
        }

        // 3. Create order history for cash/card
        const orderHistory = new OrderHistory({
            orderId: draftOrder.orderId,
            seller: draftOrder.seller,
            // OrderHistory.storeOwner expects ShopOwner reference
            storeOwner: resolvedOwnerId || draftOrder.storeOwner,
            products: draftOrder.products.map(p => ({
                productId: p.productId,
                name: p.name,
                quantity: p.quantity,
                price: p.price,
                unit: p.unit,
                unitSize: p.unitSize
            })),
            totalSum: parseFloat(draftOrder.totalSum.toString()),
            paymentMethod,
            status: 'completed',
            completedAt: new Date()
        });

        await orderHistory.save();
        await DraftOrder.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Buyurtma muvaffaqiyatli tasdiqlandi',
            data: orderHistory
        });
    } catch (error) {
        console.error('Buyurtmani tasdiqlashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

module.exports = {
    getDraftOrders,
    createDraftOrder,
    updateDraftOrder,
    deleteDraftOrder,
    confirmDraftOrder
};
