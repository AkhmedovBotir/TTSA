const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Savatchani olish
const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price originalPrice image category subcategory quantity unit unitSize shop status',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' },
                    { path: 'shop', select: 'name title address phone' }
                ]
            });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
            await cart.save();
        }

        // Mahsulot mavjudligini tekshirish
        const updatedItems = [];
        let hasChanges = false;

        for (let item of cart.items) {
            const product = await Product.findById(item.product._id);
            
            if (!product || product.status !== 'active') {
                hasChanges = true;
                continue; // Mahsulot o'chiriladi
            }

            // Narx o'zgarishini tekshirish
            if (product.price !== item.price || product.originalPrice !== item.originalPrice) {
                item.price = product.price;
                item.originalPrice = product.originalPrice;
                hasChanges = true;
            }

            // Omborda yetarli miqdorni tekshirish
            if (product.quantity < item.quantity) {
                item.quantity = product.quantity;
                hasChanges = true;
            }

            updatedItems.push(item);
        }

        if (hasChanges) {
            cart.items = updatedItems;
            await cart.save();
        }

        res.json({
            success: true,
            data: {
                cart: {
                    id: cart._id,
                    items: cart.items.map(item => ({
                        id: item._id,
                        product: {
                            id: item.product._id,
                            name: item.product.name,
                            price: item.product.price,
                            originalPrice: item.product.originalPrice,
                            image: item.product.image,
                            category: item.product.category,
                            subcategory: item.product.subcategory,
                            unit: item.product.unit,
                            unitSize: item.product.unitSize,
                            shop: item.product.shop,
                            inStock: item.product.quantity > 0,
                            availableQuantity: item.product.quantity
                        },
                        quantity: item.quantity,
                        price: item.price,
                        originalPrice: item.originalPrice,
                        discount: item.originalPrice > item.price ? 
                            Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0,
                        totalPrice: item.price * item.quantity,
                        totalOriginalPrice: item.originalPrice * item.quantity,
                        addedAt: item.addedAt
                    })),
                    totalPrice: cart.totalPrice,
                    totalOriginalPrice: cart.totalOriginalPrice,
                    totalDiscount: cart.totalDiscount,
                    itemCount: cart.itemCount,
                    updatedAt: cart.updatedAt
                }
            }
        });

    } catch (error) {
        console.error('Savatchani olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Mahsulotni savatchaga qo'shish
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.userId;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Mahsulot ID kiritilishi shart"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Miqdor kamida 1 bo'lishi kerak"
            });
        }

        // Mahsulotni topish
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Mahsulot topilmadi"
            });
        }

        if (product.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Mahsulot faol emas"
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Omborda yetarli miqdor yo'q. Mavjud: ${product.quantity}`
            });
        }

        // Savatchani topish yoki yaratish
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Mahsulot allaqachon savatchada bor-yo'qligini tekshirish
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex !== -1) {
            // Mavjud mahsulot miqdorini yangilash
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            
            if (newQuantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Omborda yetarli miqdor yo'q. Mavjud: ${product.quantity}`
                });
            }
            
            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = product.price;
            cart.items[existingItemIndex].originalPrice = product.originalPrice;
        } else {
            // Yangi mahsulot qo'shish
            cart.items.push({
                product: productId,
                quantity: quantity,
                price: product.price,
                originalPrice: product.originalPrice
            });
        }

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Mahsulot savatchaga qo'shildi",
            data: {
                cartId: cart._id,
                itemCount: cart.itemCount,
                totalPrice: cart.totalPrice
            }
        });

    } catch (error) {
        console.error('Savatchaga qo\'shishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Savatchadagi mahsulot miqdorini yangilash
const updateCartItemQuantity = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.userId;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Miqdor kamida 1 bo'lishi kerak"
            });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Savatcha topilmadi"
            });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Savatcha elementi topilmadi"
            });
        }

        // Mahsulot mavjudligini tekshirish
        const product = await Product.findById(item.product);
        if (!product || product.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Mahsulot mavjud emas"
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Omborda yetarli miqdor yo'q. Mavjud: ${product.quantity}`
            });
        }

        item.quantity = quantity;
        item.price = product.price;
        item.originalPrice = product.originalPrice;

        await cart.save();

        res.json({
            success: true,
            message: "Miqdor yangilandi",
            data: {
                itemId: item._id,
                quantity: item.quantity,
                totalPrice: cart.totalPrice
            }
        });

    } catch (error) {
        console.error('Miqdorni yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Savatchadan mahsulotni o'chirish
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.userId;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Savatcha topilmadi"
            });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Savatcha elementi topilmadi"
            });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.json({
            success: true,
            message: "Mahsulot savatchadan o'chirildi",
            data: {
                itemCount: cart.itemCount,
                totalPrice: cart.totalPrice
            }
        });

    } catch (error) {
        console.error('Savatchadan o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Savatchani tozalash
const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Savatcha topilmadi"
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: "Savatcha tozalandi",
            data: {
                itemCount: 0,
                totalPrice: 0
            }
        });

    } catch (error) {
        console.error('Savatchani tozalashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart
};


