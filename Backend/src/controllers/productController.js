const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Mahsulot yaratish
const createProduct = async (req, res) => {
    try {
        const { name, price, originalPrice, category, subcategory, quantity, status } = req.body;
        const user = req.admin || req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Avtorizatsiya talab qilinadi" });
        }
        if (!name || !price || !category || !subcategory || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(category) || !mongoose.Types.ObjectId.isValid(subcategory)) {
            return res.status(400).json({
                success: false,
                message: "Kategoriya yoki subkategoriya ID noto'g'ri"
            });
        }
        // Kategoriya va subkategoriya mavjudligini tekshirish
        const cat = await Category.findById(category);
        if (!cat || cat.parent !== null) {
            return res.status(400).json({
                success: false,
                message: "Asosiy kategoriya topilmadi"
            });
        }
        const subcat = await Category.findById(subcategory);
        if (!subcat || !subcat.parent || subcat.parent.toString() !== category) {
            return res.status(400).json({
                success: false,
                message: "Subkategoriya topilmadi yoki noto'g'ri parentga tegishli"
            });
        }

        // Rasm faylini tekshirish
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/products/${req.file.filename}`;
        }

        const product = new Product({
            name,
            price,
            originalPrice: originalPrice || price,
            image: imagePath,
            category,
            subcategory,
            quantity,
            status: status || 'active',
            createdBy: user._id,
            createdByModel: user.role === 'shop-owner' ? 'ShopOwner' : 'Admin'
        });
        await product.save();
        res.status(201).json({
            success: true,
            message: "Mahsulot muvaffaqiyatli yaratildi",
            product: {
                id: product._id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                category: product.category,
                subcategory: product.subcategory,
                quantity: product.quantity,
                status: product.status,
                createdBy: product.createdBy,
                createdByModel: product.createdByModel
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Mahsulot yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Barcha mahsulotlar
const getAllProducts = async (req, res) => {
    try {
        const { status, category, subcategory } = req.query;
        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate({ path: 'createdBy', select: 'username fullname' })
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: products.length,
            products: products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                originalPrice: p.originalPrice,
                image: p.image,
                category: p.category ? { id: p.category._id, name: p.category.name } : null,
                subcategory: p.subcategory ? { id: p.subcategory._id, name: p.subcategory.name } : null,
                quantity: p.quantity,
                status: p.status,
                createdBy: p.createdBy ? {
                    id: p.createdBy._id,
                    name: p.createdBy.fullname || p.createdBy.username
                } : null,
                createdByModel: p.createdByModel,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Mahsulotlar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Bitta mahsulot
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri mahsulot ID formati"
            });
        }
        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('subcategory', 'name');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Mahsulot topilmadi"
            });
        }
        res.json({
            success: true,
            product: {
                id: product._id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                category: product.category ? { id: product.category._id, name: product.category.name } : null,
                subcategory: product.subcategory ? { id: product.subcategory._id, name: product.subcategory.name } : null,
                quantity: product.quantity,
                status: product.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Mahsulotni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Mahsulot yangilash
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, originalPrice, category, subcategory, quantity, status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri mahsulot ID formati"
            });
        }
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Mahsulot topilmadi"
            });
        }

        // Rasm faylini tekshirish
        let imagePath = product.image; // Mavjud rasmni saqlash
        if (req.file) {
            imagePath = `/uploads/products/${req.file.filename}`;
        }

        const updates = {};
        if (name) updates.name = name;
        if (price !== undefined) {
            updates.price = price;
            // If originalPrice is not being updated, keep the existing one
            if (originalPrice === undefined) {
                const existingProduct = await Product.findById(id);
                if (existingProduct) {
                    updates.originalPrice = existingProduct.originalPrice;
                }
            }
        }
        if (originalPrice !== undefined) updates.originalPrice = originalPrice;
        if (imagePath !== undefined) updates.image = imagePath;
        if (quantity !== undefined) updates.quantity = quantity;
        if (status) updates.status = status;
        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Kategoriya ID noto'g'ri"
                });
            }
            const cat = await Category.findById(category);
            if (!cat || cat.parent !== null) {
                return res.status(400).json({
                    success: false,
                    message: "Asosiy kategoriya topilmadi"
                });
            }
            product.category = category;
        }
        if (subcategory) {
            if (!mongoose.Types.ObjectId.isValid(subcategory)) {
                return res.status(400).json({
                    success: false,
                    message: "Subkategoriya ID noto'g'ri"
                });
            }
            const subcat = await Category.findById(subcategory);
            if (!subcat || !subcat.parent || (category && subcat.parent.toString() !== category)) {
                return res.status(400).json({
                    success: false,
                    message: "Subkategoriya topilmadi yoki noto'g'ri parentga tegishli"
                });
            }
            product.subcategory = subcategory;
        }
        await product.save();
        res.json({
            success: true,
            message: "Mahsulot muvaffaqiyatli yangilandi",
            product: {
                id: product._id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                category: product.category,
                subcategory: product.subcategory,
                quantity: product.quantity,
                status: product.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Mahsulotni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Mahsulotni o'chirish
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri mahsulot ID formati"
            });
        }
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Mahsulot topilmadi"
            });
        }
        await product.deleteOne();
        res.json({
            success: true,
            message: "Mahsulot muvaffaqiyatli o'chirildi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Mahsulotni o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
}; 