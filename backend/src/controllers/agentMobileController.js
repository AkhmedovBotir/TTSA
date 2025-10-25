const Agent = require('../models/Agent');
const Category = require('../models/Category');
const Product = require('../models/Product');
const AgentProduct = require('../models/AgentProduct');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mongoose = require('mongoose');

// Login for agent
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Iltimos, telefon raqam va parolni kiriting!'
            });
        }

        // Find agent by phone
        const agent = await Agent.findOne({ phone });
        if (!agent) {
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri!'
            });
        }

        // Check password
        const isMatch = await agent.checkPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri!'
            });
        }

        // Check if agent is active
        if (agent.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Sizning hisobingiz faol emas!'
            });
        }

        // Create JWT token with agent data
        const tokenPayload = { 
            id: agent._id,
            role: 'agent',
            phone: agent.phone
        };
        
        console.log('Creating JWT token with payload:', tokenPayload);
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '30d' }
        );
        
        console.log('Token created successfully');

        // Remove password from response
        const agentData = agent.toObject();
        delete agentData.password;

        res.status(200).json({
            success: true,
            message: 'Muvaffaqiyatli kirish',
            token,
            agent: agentData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq qayta urinib ko\'ring.'
        });
    }
};

// Get all active categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'active' })
            .select('name description image')
            .sort({ name: 1 });
            
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriyalarni yuklashda xatolik yuz berdi'
        });
    }
};

// Get subcategories by category ID
const getSubcategories = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri kategoriya ID formati'
            });
        }

        const category = await Category.findOne({ 
            _id: categoryId, 
            status: 'active' 
        }).select('subcategories');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategoriya topilmadi'
            });
        }

        res.status(200).json({
            success: true,
            data: category.subcategories || []
        });
    } catch (error) {
        console.error('Get subcategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Pastki kategoriyalarni yuklashda xatolik yuz berdi'
        });
    }
};

// Get products by subcategory
const getProducts = async (req, res) => {
    try {
        const { subcategoryId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const products = await Product.find({ 
            subcategory: subcategoryId,
            status: 'active'
        })
        .select('name description price images stock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Product.countDocuments({ 
            subcategory: subcategoryId,
            status: 'active'
        });

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Mahsulotlarni yuklashda xatolik yuz berdi'
        });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find({ status: 'active' })
                .select('-originalPrice')  // Exclude originalPrice
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments({ status: 'active' })
        ]);
        
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Mahsulotlarni yuklashda xatolik yuz berdi'
        });
    }
};

// Get product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri mahsulot ID formati'
            });
        }

        const product = await Product.findOne({ 
            _id: id,
            status: 'active' 
        }).select('-__v -createdAt -updatedAt');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Mahsulot topilmadi'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Mahsulot ma\'lumotlarini yuklashda xatolik yuz berdi'
        });
    }
};

module.exports = {
    login,
    getCategories,
    getSubcategories,
    getProducts,
    getProductById,
    getAllProducts,
    
    // Get all products assigned to the current agent
    getMyProducts: async (req, res) => {
        try {
            console.log('Request headers:', req.headers);
            console.log('Authenticated user:', req.user);
            
            // Get agent ID from the authenticated user
            const agentId = req.user?.id || req.user?._id;
            
            if (!agentId) {
                console.error('No agent ID found in request user:', req.user);
                return res.status(401).json({
                    success: false,
                    message: 'Agent ID topilmadi. Iltimos, qaytadan kiring.'
                });
            }
            
            console.log('Fetching products for agent ID:', agentId);
            
            // First, verify the agent exists
            const agent = await Agent.findById(agentId);
            if (!agent) {
                console.error('Agent not found with ID:', agentId);
                return res.status(404).json({
                    success: false,
                    message: 'Agent topilmadi',
                    details: `Agent ID: ${agentId}`
                });
            }
            
            // Get all assigned products with more detailed population
            const agentProducts = await AgentProduct.find({ 
                agent: agentId,
                status: 'assigned',
                remainingQuantity: { $gt: 0 }  // Only show products with remaining quantity > 0
            })
            .populate({
                path: 'product',
                select: 'name price category subcategory images',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' }
                ]
            })
            .populate('assignedBy', 'fullname phone')
            .sort({ createdAt: -1 });

            console.log(`Found ${agentProducts.length} products for agent ${agentId}`);
            
            // Format the response
            const formattedProducts = agentProducts.map(ap => ({
                id: ap._id,
                product: {
                    id: ap.product?._id,
                    name: ap.product?.name,
                    price: ap.product?.price,
                    category: ap.product?.category?.name,
                    subcategory: ap.product?.subcategory?.name,
                    image: ap.product?.images?.[0] || null
                },
                assignedBy: ap.assignedBy,
                assignedQuantity: ap.assignedQuantity,
                remainingQuantity: ap.remainingQuantity,
                assignedAt: ap.assignedAt
            }));

            res.status(200).json({
                success: true,
                data: formattedProducts
            });

        } catch (error) {
            console.error('Error getting agent products:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    },
    
    // Sell product (mark as sold)
    sellProduct: async (req, res) => {
        try {
            const { agentProductId, quantity } = req.body;
            const agentId = req.user.id;

            if (!mongoose.Types.ObjectId.isValid(agentProductId) || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri ma'lumot kiritilgan"
                });
            }

            const agentProduct = await AgentProduct.findOne({
                _id: agentProductId,
                agent: agentId,
                status: 'assigned'
            });

            if (!agentProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga tegishli emas"
                });
            }

            if (agentProduct.remainingQuantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Yetarli mahsulot yo'q. Qolgan: ${agentProduct.remainingQuantity}`
                });
            }

            // Update remaining quantity
            agentProduct.remainingQuantity -= quantity;
            
            // If all products are sold, mark as sold
            if (agentProduct.remainingQuantity === 0) {
                agentProduct.status = 'sold';
                agentProduct.soldAt = Date.now();
            }
            
            await agentProduct.save();

            res.status(200).json({
                success: true,
                message: `${quantity} ta mahsulot sotildi`,
                data: agentProduct
            });

        } catch (error) {
            console.error('Error selling product:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    },
    
    // Get product sales statistics
    getSalesStatistics: async (req, res) => {
        try {
            const agentId = req.user.id;
            
            const [
                totalAssigned,
                totalSold,
                totalRemaining,
                productsByCategory
            ] = await Promise.all([
                // Total assigned products
                AgentProduct.aggregate([
                    { $match: { agent: mongoose.Types.ObjectId(agentId) } },
                    { $group: { _id: null, total: { $sum: '$assignedQuantity' } } }
                ]),
                // Total sold products
                AgentProduct.aggregate([
                    { 
                        $match: { 
                            agent: mongoose.Types.ObjectId(agentId),
                            status: 'sold' 
                        } 
                    },
                    { $group: { _id: null, total: { $sum: { $subtract: ['$assignedQuantity', '$remainingQuantity'] } } } }
                ]),
                // Total remaining products
                AgentProduct.aggregate([
                    { $match: { agent: mongoose.Types.ObjectId(agentId) } },
                    { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
                ]),
                // Products by category
                AgentProduct.aggregate([
                    { $match: { agent: mongoose.Types.ObjectId(agentId) } },
                    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
                    { $unwind: '$product' },
                    { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
                    { $unwind: '$category' },
                    { 
                        $group: { 
                            _id: '$category._id',
                            categoryName: { $first: '$category.name' },
                            totalAssigned: { $sum: '$assignedQuantity' },
                            totalSold: { $sum: { $subtract: ['$assignedQuantity', '$remainingQuantity'] } },
                            totalRemaining: { $sum: '$remainingQuantity' }
                        } 
                    }
                ])
            ]);

            const stats = {
                totalAssigned: totalAssigned[0]?.total || 0,
                totalSold: totalSold[0]?.total || 0,
                totalRemaining: totalRemaining[0]?.total || 0,
                byCategory: productsByCategory
            };

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error getting sales statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    }
};
