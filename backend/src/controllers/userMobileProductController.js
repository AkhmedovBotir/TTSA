const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Barcha faol mahsulotlarni olish (user uchun)
const getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            subcategory, 
            search,
            searchType = 'product', // 'product' yoki 'shop'
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            inStock,
            hasDiscount,
            minDiscount,
            maxDiscount
        } = req.query;

        // Query yaratish - faqat faol mahsulotlar
        const query = { status: 'active' };

        // Kategoriya filtri
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            query.category = category;
        }

        // Subkategoriya filtri
        if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) {
            query.subcategory = subcategory;
        }

        // Qidiruv filtri
        if (search) {
            if (searchType === 'shop') {
                // Do'kon nomi bo'yicha qidirish
                query['shop.name'] = { $regex: search, $options: 'i' };
            } else {
                // Mahsulot nomi bo'yicha qidirish (default)
                query.name = { $regex: search, $options: 'i' };
            }
        }

        // Narx filtri
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }



        // Omborda bor/yo'q filtri
        if (inStock !== undefined) {
            if (inStock === 'true' || inStock === true) {
                query.quantity = { $gt: 0 };
            } else if (inStock === 'false' || inStock === false) {
                query.quantity = { $lte: 0 };
            }
        }

        // Chegirma filtri
        if (hasDiscount === 'true' || hasDiscount === true) {
            query.$expr = { $gt: ['$originalPrice', '$price'] };
        }

        // Chegirma foizi filtri
        if (minDiscount || maxDiscount) {
            if (!query.$expr) query.$expr = {};
            
            if (minDiscount) {
                query.$expr.$gte = [
                    { $multiply: [{ $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] }, 100] },
                    parseFloat(minDiscount)
                ];
            }
            
            if (maxDiscount) {
                query.$expr.$lte = [
                    { $multiply: [{ $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] }, 100] },
                    parseFloat(maxDiscount)
                ];
            }
        }

        // Sortlash
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Mahsulotlarni olish
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name')
            .populate('deliveryRegions', 'name type')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Product.countDocuments(query);

        // Javobni tayyorlash
        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name,
            } : null,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            createdAt: product.createdAt
        }));

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + products.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Mahsulotlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Bitta mahsulotni ID bo'yicha olish
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri mahsulot ID formati"
            });
        }

        const product = await Product.findOne({ _id: id, status: 'active' })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name title address phone status')
            .populate('deliveryRegions', 'name type');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Mahsulot topilmadi"
            });
        }

        const formattedProduct = {
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name,
                title: product.shop.title,
                address: product.shop.address,
                phone: product.shop.phone,
                status: product.shop.status
            } : null,
            createdAt: product.createdAt
        };

        res.json({
            success: true,
            data: formattedProduct
        });

    } catch (error) {
        console.error('Mahsulotni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Kategoriya bo'yicha mahsulotlarni olish
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { 
            page = 1, 
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri kategoriya ID formati"
            });
        }

        // Kategoriya mavjudligini tekshirish
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Kategoriya topilmadi"
            });
        }

        // Query yaratish
        const query = { 
            status: 'active',
            $or: [
                { category: categoryId },
                { subcategory: categoryId }
            ]
        };

        // Sortlash
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Mahsulotlarni olish
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name')
            .populate('deliveryRegions', 'name type')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Product.countDocuments(query);

        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name
            } : null,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            createdAt: product.createdAt
        }));

        res.json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name
                },
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + products.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Kategoriya mahsulotlarini olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Qidiruv bo'yicha mahsulotlarni olish
const searchProducts = async (req, res) => {
    try {
        const { 
            q, 
            page = 1, 
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            searchType = 'product' // 'product' yoki 'shop'
        } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Qidiruv so'zi kamida 2 ta belgidan iborat bo'lishi kerak"
            });
        }
        
        if (q.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Qidiruv so'zi 100 ta belgidan ko'p bo'lmasligi kerak"
            });
        }

        // Query yaratish
        let query = { status: 'active' };

        if (searchType === 'shop') {
            // Do'kon nomi bo'yicha qidirish
            query = {
                status: 'active',
                'shop.name': { $regex: q.trim(), $options: 'i' }
            };
        } else {
            // Mahsulot nomi bo'yicha qidirish (default)
            query = {
                status: 'active',
                name: { $regex: q.trim(), $options: 'i' }
            };
        }

        // Sortlash
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Mahsulotlarni olish
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name')
            .populate('deliveryRegions', 'name type')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Product.countDocuments(query);

        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name
            } : null,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            createdAt: product.createdAt
        }));

        res.json({
            success: true,
            data: {
                searchQuery: q.trim(),
                searchType: searchType,
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + products.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Mahsulot qidirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Chegirmali mahsulotlarni olish
const getDiscountedProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20,
            sortBy = 'discount',
            sortOrder = 'desc'
        } = req.query;

        // Query yaratish - faqat chegirmali mahsulotlar
        const query = {
            status: 'active',
            $expr: { $gt: ['$originalPrice', '$price'] }
        };

        // Sortlash
        const sortOptions = {};
        if (sortBy === 'discount') {
            sortOptions.$expr = { $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] };
            sortOptions[sortOrder === 'desc' ? '$desc' : '$asc'] = 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Mahsulotlarni olish
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name')
            .populate('deliveryRegions', 'name type')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Product.countDocuments(query);

        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100),
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name
            } : null,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            createdAt: product.createdAt
        }));

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + products.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Chegirmali mahsulotlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Yangi mahsulotlarni olish
const getNewProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20,
            days = 30 // Oxirgi necha kundagi mahsulotlar
        } = req.query;

        // Query yaratish - yangi mahsulotlar
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const query = {
            status: 'active',
            createdAt: { $gte: daysAgo }
        };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Mahsulotlarni olish
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name')
            .populate('deliveryRegions', 'name type')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonini olish
        const total = await Product.countDocuments(query);

        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.originalPrice > product.price ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            category: product.category ? {
                id: product.category._id,
                name: product.category.name
            } : null,
            subcategory: product.subcategory ? {
                id: product.subcategory._id,
                name: product.subcategory.name
            } : null,
            quantity: product.quantity,
            unit: product.unit,
            unitSize: product.unitSize,
            shop: product.shop ? {
                id: product.shop._id,
                name: product.shop.name
            } : null,
            deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type
            })) : [],
            inStock: product.quantity > 0,
            status: product.status,
            image: product.image,
            createdAt: product.createdAt
        }));

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + products.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Yangi mahsulotlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Trend mahsulotlar (eng ko'p ko'rilgan va sotilgan)
const getTrendProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Trend mahsulotlarni topish - ko'p sotilgan mahsulotlar
        const trendProducts = await Product.aggregate([
            {
                $match: { status: 'active' }
            },
            {
                $lookup: {
                    from: 'orderhistories',
                    localField: '_id',
                    foreignField: 'products.productId',
                    as: 'orders'
                }
            },
            {
                $lookup: {
                    from: 'installmentpayments',
                    localField: '_id',
                    foreignField: 'products.productId',
                    as: 'installments'
                }
            },
            {
                $addFields: {
                    totalSold: {
                        $add: [
                            { $sum: '$orders.products.quantity' },
                            { $sum: '$installments.products.quantity' }
                        ]
                    },
                    totalViews: { $ifNull: ['$views', 0] }
                }
            },
            {
                $addFields: {
                    trendScore: {
                        $add: [
                            { $multiply: ['$totalSold', 3] }, // Sotilgan mahsulotlar 3 barobar
                            { $multiply: ['$totalViews', 1] }  // Ko'rilgan mahsulotlar 1 barobar
                        ]
                    }
                }
            },
            {
                $sort: { trendScore: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'subcategory',
                    foreignField: '_id',
                    as: 'subcategory'
                }
            },
            {
                $lookup: {
                    from: 'shops',
                    localField: 'shop',
                    foreignField: '_id',
                    as: 'shop'
                }
            },
            {
                $lookup: {
                    from: 'regions',
                    localField: 'deliveryRegions',
                    foreignField: '_id',
                    as: 'deliveryRegions'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    originalPrice: 1,
                    quantity: 1,
                    unit: 1,
                    unitSize: 1,
                    image: 1,
                    createdAt: 1,
                    views: 1,
                    totalSold: 1,
                    trendScore: 1,
                    category: { $arrayElemAt: ['$category', 0] },
                    subcategory: { $arrayElemAt: ['$subcategory', 0] },
                    shop: { $arrayElemAt: ['$shop', 0] },
                    deliveryRegions: 1
                }
            }
        ]);

        // Jami sonini olish
        const totalTrendProducts = await Product.aggregate([
            {
                $match: { status: 'active' }
            },
            {
                $lookup: {
                    from: 'orderhistories',
                    localField: '_id',
                    foreignField: 'products.productId',
                    as: 'orders'
                }
            },
            {
                $lookup: {
                    from: 'installmentpayments',
                    localField: '_id',
                    foreignField: 'products.productId',
                    as: 'installments'
                }
            },
            {
                $addFields: {
                    totalSold: {
                        $add: [
                            { $sum: '$orders.products.quantity' },
                            { $sum: '$installments.products.quantity' }
                        ]
                    }
                }
            },
            {
                $match: { totalSold: { $gt: 0 } }
            },
            {
                $count: 'total'
            }
        ]);

        const total = totalTrendProducts.length > 0 ? totalTrendProducts[0].total : 0;

        res.json({
            success: true,
            data: trendProducts.map(product => ({
                id: product._id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                discount: product.originalPrice > product.price ? 
                    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
                quantity: product.quantity,
                unit: product.unit,
                unitSize: product.unitSize,
                image: product.image,
                category: product.category,
                subcategory: product.subcategory,
                shop: product.shop,
                deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                    id: region._id,
                    name: region.name,
                    type: region.type
                })) : [],
                isTrend: true,
                totalSold: product.totalSold,
                views: product.views,
                trendScore: product.trendScore,
                createdAt: product.createdAt
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Trend mahsulotlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getDiscountedProducts,
    getNewProducts,
    getTrendProducts
}; 