const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const ShopOwner = require('../models/ShopOwner');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Agent = require('../models/Agent');
const AgentProduct = require('../models/AgentProduct');
const Seller = require('../models/Seller');
const Shop = require('../models/Shop');
const OrderHistory = require('../models/OrderHistory');

// Helper function to format category response
const formatCategoryResponse = (category) => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    parent: category.parent ? {
        id: category.parent._id || category.parent,
        name: category.parent.name
    } : null,
    status: category.status,
    createdBy: category.createdBy ? {
        id: category.createdBy._id || category.createdBy,
        name: category.createdBy.fullname || category.createdBy.username
    } : null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
});

// Login for shop owner (username and password only)
const loginShopOwner = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Foydalanuvchi nomi va parol kiritilishi shart"
            });
        }

        // Find shop owner by username
        const owner = await ShopOwner.findOne({ username });

        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Foydalanuvchi nomi yoki parol noto'g'ri"
            });
        }

        // Check password
        const isMatch = await owner.checkPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Foydalanuvchi nomi yoki parol noto'g'ri"
            });
        }

        // Check if account is active
        if (owner.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: "Sizning hisobingiz faol emas. Iltimos, administrator bilan bog'laning."
            });
        }

        // Update last login
        owner.lastLogin = new Date();
        await owner.save();

        // Generate token
        const token = jwt.sign(
            { id: owner._id, role: 'shop-owner' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Muvaffaqiyatli kirish',
            token,
            owner: {
                id: owner._id,
                name: owner.name,
                username: owner.username,
                phone: owner.phone
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
};

// Category Controllers
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Kategoriya nomi kiritilishi shart"
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            name,
            parent: null,
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner'
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi kategoriya allaqachon mavjud"
            });
        }

        const category = new Category({
            name,
            parent: null,
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner',
            status: 'active'
        });

        await category.save();

        // Populate for response
        const populatedCategory = await Category.findById(category._id)
            .populate('createdBy', 'username fullname');

        res.status(201).json({
            success: true,
            message: 'Kategoriya muvaffaqiyatli yaratildi',
            category: formatCategoryResponse(populatedCategory)
        });
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi kategoriya allaqachon mavjud"
            });
        }
        res.status(500).json({
            success: false,
            message: 'Kategoriya yaratishda xatolik',
            error: error.message
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri kategoriya ID formati"
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategoriya topilmadi'
            });
        }

        // Check if user is the owner
        if (!category.createdBy.equals(req.shopOwner._id) || category.createdByModel !== 'ShopOwner') {
            return res.status(403).json({
                success: false,
                message: "Sizda ushbu kategoriyani yangilash uchun ruxsat yo'q"
            });
        }

        // Check if this is a subcategory (shouldn't be updated with this endpoint)
        if (category.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu subkategoriya, faqat kategoriyalarni yangilash mumkin"
            });
        }

        // Check if name is being updated and already exists
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ 
                name, 
                _id: { $ne: id },
                parent: null,
                createdBy: req.shopOwner._id,
                createdByModel: 'ShopOwner'
            });
            
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Bu nomdagi kategoriya allaqachon mavjud"
                });
            }
            
            category.name = name;
        }

        category.updatedAt = new Date();
        await category.save();

        // Populate for response
        const populatedCategory = await Category.findById(category._id)
            .populate('createdBy', 'username fullname');

        res.json({
            success: true,
            message: 'Kategoriya muvaffaqiyatli yangilandi',
            category: formatCategoryResponse(populatedCategory)
        });
    } catch (error) {
        console.error('Update category error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi kategoriya allaqachon mavjud"
            });
        }
        res.status(500).json({
            success: false,
            message: 'Kategoriyani yangilashda xatolik',
            error: error.message
        });
    }
};

const updateCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri kategoriya ID formati"
            });
        }

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status 'active' yoki 'inactive' bo'lishi kerak"
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategoriya topilmadi'
            });
        }

        // Check if user is the owner
        if (!category.createdBy.equals(req.shopOwner._id) || category.createdByModel !== 'ShopOwner') {
            return res.status(403).json({
                success: false,
                message: "Sizda ushbu kategoriya statusini o'zgartirish uchun ruxsat yo'q"
            });
        }

        // Check if this is a subcategory (shouldn't be updated with this endpoint)
        if (category.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu subkategoriya, faqat kategoriyalar statusini yangilash mumkin"
            });
        }

        // If deactivating, deactivate all subcategories as well
        if (status === 'inactive') {
            await Category.updateMany(
                { parent: id },
                { status: 'inactive', updatedAt: new Date() }
            );
        }

        category.status = status;
        category.updatedAt = new Date();
        await category.save();

        // Get updated category with populated fields for response
        const updatedCategory = await Category.findById(id)
            .populate('createdBy', 'username fullname');

        res.status(200).json({
            success: true,
            message: `Kategoriya statusi muvaffaqiyatli o'zgartirildi`,
            category: formatCategoryResponse(updatedCategory)
        });
    } catch (error) {
        console.error('Update category status error:', error);
        res.status(500).json({
            success: false,
            message: "Kategoriya statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri kategoriya ID formati"
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategoriya topilmadi'
            });
        }

        // Check if user is the owner
        if (!category.createdBy.equals(req.shopOwner._id) || category.createdByModel !== 'ShopOwner') {
            return res.status(403).json({
                success: false,
                message: "Sizda ushbu kategoriyani o'chirish uchun ruxsat yo'q"
            });
        }

        // Check if this is a subcategory (shouldn't be deleted with this endpoint)
        if (category.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu subkategoriya, faqat kategoriyalarni o'chirish mumkin"
            });
        }

        // Check if category has any subcategories
        const hasSubcategories = await Category.exists({ parent: id });
        if (hasSubcategories) {
            return res.status(400).json({
                success: false,
                message: "Ushbu kategoriyada subkategorialar mavjud. Iltimos, avval barcha subkategorialarni o'chiring."
            });
        }

        // Delete the category
        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Kategoriya muvaffaqiyatli o\'chirildi',
            category: {
                id: category._id,
                name: category.name
            }
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: "Kategoriyani o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};
const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {
            parent: null,
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner'
        };

        // Add status filter if provided
        if (status && ['active', 'inactive'].includes(status)) {
            query.status = status;
        }

        // Add search filter if provided
        if (search && search.trim() !== '') {
            query.name = { $regex: search.trim(), $options: 'i' };
        }

        // Get total count for pagination
        const total = await Category.countDocuments(query);

        // Get paginated categories with createdBy populated
        const categories = await Category.find(query)
            .select('-__v')
            .populate('createdBy', 'username fullname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Prepare response with subcategory counts
        const formattedCategories = await Promise.all(
            categories.map(async (category) => {
                const activeSubs = await Category.countDocuments({
                    parent: category._id,
                    status: 'active',
                    createdBy: req.shopOwner._id,
                    createdByModel: 'ShopOwner'
                });
                
                const totalSubs = await Category.countDocuments({
                    parent: category._id,
                    createdBy: req.shopOwner._id,
                    createdByModel: 'ShopOwner'
                });

                return {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    status: category.status,
                    description: category.description || '',
                    activeSubcategories: activeSubs,
                    totalSubcategories: totalSubs,
                    createdBy: category.createdBy ? {
                        id: category.createdBy._id,
                        name: category.createdBy.fullname || category.createdBy.username
                    } : null,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt
                };
            })
        );

        res.status(200).json({
            success: true,
            count: formattedCategories.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            categories: formattedCategories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriyalarni olishda xatolik',
            error: error.message
        });
    }
};

// Subcategory Controllers
const createSubcategory = async (req, res) => {
    try {
        const { name, parentId } = req.body;
        
        if (!name || !parentId) {
            return res.status(400).json({
                success: false,
                message: "Subkategoriya nomi va ota kategoriya IDsi kiritilishi shart"
            });
        }

        // Validate parent ID format
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ota kategoriya ID formati"
            });
        }

        // Check if parent category exists and is active
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
            return res.status(404).json({
                success: false,
                message: "Ota kategoriya topilmadi"
            });
        }

        if (parentCategory.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Ota kategoriya faol emas"
            });
        }

        // Check if subcategory with same name already exists under this parent
        const existingSubcategory = await Category.findOne({ name, parent: parentId });
        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi subkategoriya allaqachon mavjud"
            });
        }

        const subcategory = new Category({
            name,
            parent: parentId,
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner',
            status: 'active'
        });

        await subcategory.save();

        // Populate parent and createdBy for response
        const populatedSubcategory = await Category.findById(subcategory._id)
            .populate('parent', 'name')
            .populate('createdBy', 'username fullname');

        res.status(201).json({
            success: true,
            message: 'Subkategoriya muvaffaqiyatli yaratildi',
            subcategory: {
                id: populatedSubcategory._id,
                name: populatedSubcategory.name,
                slug: populatedSubcategory.slug,
                parent: {
                    id: populatedSubcategory.parent._id,
                    name: populatedSubcategory.parent.name
                },
                status: populatedSubcategory.status,
                createdBy: populatedSubcategory.createdBy ? {
                    id: populatedSubcategory.createdBy._id,
                    name: populatedSubcategory.createdBy.fullname || populatedSubcategory.createdBy.username
                } : null,
                createdAt: populatedSubcategory.createdAt
            }
        });
    } catch (error) {
        console.error('Create subcategory error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi subkategoriya allaqachon mavjud"
            });
        }
        res.status(500).json({
            success: false,
            message: 'Subkategoriya yaratishda xatolik',
            error: error.message
        });
    }
};

const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (updates.category) {
            const categoryExists = await Category.findById(updates.category);
            if (!categoryExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Kategoriya topilmadi'
                });
            }
        }

        const subcategory = await Category.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subkategoriya topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Subkategoriya muvaffaqiyatli yangilandi',
            subcategory
        });
    } catch (error) {
        console.error('Update subcategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Subkategoriyani yangilashda xatolik',
            error: error.message
        });
    }
};

const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First find the subcategory to check ownership
        const subcategory = await Category.findOne({
            _id: id,
            parent: { $ne: null }, // Ensure it's a subcategory
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner'
        });
        
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subkategoriya topilmadi yoki sizda unga kirish huquqi yo\'q'
            });
        }

        // Delete the subcategory
        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Subkategoriya muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Delete subcategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Subkategoriyani o\'chirishda xatolik yuz berdi',
            error: error.message
        });
    }
};

const getAllSubcategories = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { parent: { $ne: null }, createdBy: req.shopOwner._id };
        
        if (status) {
            filter.status = status;
        }

        const subcategories = await Category.find(filter)
            .populate('parent', 'name')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            count: subcategories.length,
            subcategories
        });
    } catch (error) {
        console.error('Get subcategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Subkategoriyalarni olishda xatolik',
            error: error.message
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeSubcategories, isSubcategory } = req.query;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Build the query based on whether it's a category or subcategory
        const query = {
            _id: id,
            createdBy: req.shopOwner._id,
            createdByModel: 'ShopOwner'
        };

        // If it's explicitly a subcategory, look for it with a parent
        if (isSubcategory === 'true') {
            query.parent = { $ne: null };
        } else {
            // Default to looking for a main category
            query.parent = null;
        }

        // Find the category/subcategory
        const category = await Category.findOne(query)
            .populate('createdBy', 'username fullname')
            .populate('parent', 'name'); // Populate parent if it's a subcategory

        if (!category) {
            return res.status(404).json({
                success: false,
                message: isSubcategory === 'true' 
                    ? 'Subkategoriya topilmadi yoki sizda unga kirish huquqi yo\'q'
                    : 'Kategoriya topilmadi yoki sizda unga kirish huquqi yo\'q'
            });
        }

        // Format the response using our helper function
        const response = formatCategoryResponse(category);

        // Include active subcategories if requested
        if (includeSubcategories === 'true') {
            const subcategories = await Category.find({
                parent: category._id,
                createdBy: req.shopOwner._id,
                createdByModel: 'ShopOwner',
                status: 'active'
            })
            .sort({ name: 1 })
            .populate('createdBy', 'username fullname');

            response.subcategories = subcategories.map(sub => ({
                id: sub._id,
                name: sub.name,
                slug: sub.slug,
                status: sub.status,
                createdBy: sub.createdBy ? {
                    id: sub.createdBy._id,
                    name: sub.createdBy.fullname || sub.createdBy.username
                } : null,
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt
            }));

            // Add subcategory count
            response.subcategoryCount = subcategories.length;
        } else {
            // Just get the count without fetching all subcategories
            const subcategoryCount = await Category.countDocuments({
                parent: category._id,
                createdBy: req.shopOwner._id,
                createdByModel: 'ShopOwner',
                status: 'active'
            });
            response.subcategoryCount = subcategoryCount;
        }

        res.status(200).json({
            success: true,
            category: response
        });
    } catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriyani olishda xatolik',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    loginShopOwner,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
    getCategoryById,
    getAllCategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getAllSubcategories,
    // Product controllers
    createProduct: async (req, res) => {
        try {
            const { 
                name, 
                price, 
                category, 
                subcategory, 
                quantity,
                originalPrice,
                unit,
                unitSize,
                status 
            } = req.body;

            const shopOwner = req.shopOwner;
            
            // Required fields validation
            if (!name || !price || !subcategory || quantity === undefined || quantity === null) {
                return res.status(400).json({
                    success: false,
                    message: "Barcha majburiy maydonlar to'ldirilishi shart (nomi, narx, subkategoriya, miqdori)"
                });
            }

            // If category is not provided, get it from subcategory
            let categoryId = category;
            if (!categoryId && subcategory) {
                const subcat = await Category.findById(subcategory);
                if (subcat && subcat.parent) {
                    categoryId = subcat.parent;
                }
            }

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: "Kategoriya topilmadi. Iltimos, kategoriya yoki subkategoriya kiriting"
                });
            }

            // Convert quantity to number
            const quantityNum = Number(quantity);
            if (isNaN(quantityNum) || quantityNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Miqdor noto'g'ri formatda. Musbat son bo'lishi kerak"
                });
            }

            // Check if category and subcategory exist and are valid
            const [cat, subcat] = await Promise.all([
                Category.findById(categoryId),
                Category.findById(subcategory)
            ]);

            if (!cat || cat.parent !== null) {
                return res.status(400).json({
                    success: false,
                    message: "Asosiy kategoriya topilmadi"
                });
            }

            if (!subcat || !subcat.parent || subcat.parent.toString() !== categoryId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "Subkategoriya topilmadi yoki noto'g'ri parentga tegishli"
                });
            }

            // Handle image - could be file upload, base64 string, or file URI
            let imageFilename = undefined;
            
            if (req.file) {
                // File upload via multipart/form-data
                imageFilename = req.file.filename;
            } else if (req.body.image && req.body.image.startsWith('data:image/')) {
                // Base64 image data
                const base64Data = req.body.image.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Generate unique filename
                const fileExtension = req.body.image.split(';')[0].split('/')[1];
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                imageFilename = `image-${uniqueSuffix}.${fileExtension}`;
                
                // Save file to disk
                const filePath = `uploads/products/${imageFilename}`;
                fs.writeFileSync(filePath, buffer);
            } else if (req.body.image && req.body.image.startsWith('file://')) {
                // File URI from mobile app - cannot access file content from server
                return res.status(400).json({
                    success: false,
                    message: "File URI format not supported. Please convert image to base64 or use file upload. Mobile app should convert image to base64 before sending.",
                    details: "The server cannot access files from mobile device file:// URIs. Convert image to base64 using expo-file-system or use FormData for file upload."
                });
            } else if (req.body.image) {
                // Unknown image format
                return res.status(400).json({
                    success: false,
                    message: "Unknown image format. Please send image as base64 (data:image/...) or use file upload.",
                    details: "Image should start with 'data:image/' for base64 or be uploaded as a file."
                });
            }

            // Get shop ID for the shop owner
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Create product with all provided fields
            const product = new Product({
                name,
                price,
                originalPrice: originalPrice || price, // Use provided originalPrice or default to price
                image: imageFilename, // Save image filename if provided
                category: categoryId, // Use resolved category ID
                subcategory,
                quantity: quantityNum, // Use converted quantity
                unit: unit || 'dona', // Default unit if not provided
                unitSize: unitSize || 1, // Default unitSize if not provided
                status: status || 'active',
                createdBy: shopOwner._id,
                createdByModel: 'ShopOwner',
                shop: shop._id
            });

            await product.save();
            
            // Return complete product information
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
                    unit: product.unit,
                    unitSize: product.unitSize,
                    status: product.status,
                    createdBy: product.createdBy,
                    createdByModel: product.createdByModel,
                    createdAt: product.createdAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Mahsulot yaratishda xatolik yuz berdi",
                error: error.message
            });
        }
    },
    
    getAllProducts: async (req, res) => {
        try {
            const { status, category, subcategory } = req.query;
            const shopOwner = req.shopOwner;
            
            // Get shop ID for the shop owner
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }
            
            const query = { shop: shop._id };
            if (status) query.status = status;
            if (category) query.category = category;
            if (subcategory) query.subcategory = subcategory;

            const products = await Product.find(query)
                .populate('category', 'name')
                .populate('subcategory', 'name')
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
                    unit: p.unit,
                    unitSize: p.unitSize,
                    status: p.status,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Mahsulotlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params;
            const shopOwner = req.shopOwner;

            // Get shop ID for the shop owner
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            const product = await Product.findOne({
                _id: id,
                shop: shop._id
            })
            .populate('category', 'name')
            .populate('subcategory', 'name');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga ruxsat yo'q"
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
                    unit: product.unit,
                    unitSize: product.unitSize,
                    status: product.status,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Mahsulotni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const shopOwner = req.shopOwner;

            // Get shop ID for the shop owner
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Check if product exists and belongs to this shop
            const product = await Product.findOne({
                _id: id,
                shop: shop._id
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga ruxsat yo'q"
                });
            }

            // Handle image update if provided
            if (req.file) {
                // File upload via multipart/form-data
                product.image = req.file.filename;
            } else if (req.body.image && req.body.image.startsWith('data:image/')) {
                // Base64 image data
                const base64Data = req.body.image.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Generate unique filename
                const fileExtension = req.body.image.split(';')[0].split('/')[1];
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const imageFilename = `image-${uniqueSuffix}.${fileExtension}`;
                
                // Save file to disk
                const filePath = `uploads/products/${imageFilename}`;
                fs.writeFileSync(filePath, buffer);
                
                product.image = imageFilename;
            } else if (req.body.image && req.body.image.startsWith('file://')) {
                // File URI from mobile app - cannot access file content from server
                return res.status(400).json({
                    success: false,
                    message: "File URI format not supported. Please convert image to base64 or use file upload. Mobile app should convert image to base64 before sending.",
                    details: "The server cannot access files from mobile device file:// URIs. Convert image to base64 using expo-file-system or use FormData for file upload."
                });
            }

            // Update product fields (excluding image which is handled separately)
            Object.keys(updates).forEach(update => {
                if (update !== 'image') { // Don't update image from body
                    product[update] = updates[update];
                }
            });

            await product.save();

            // Populate category and subcategory for response
            const updatedProduct = await Product.findById(product._id)
                .populate('category', 'name')
                .populate('subcategory', 'name');

            res.json({
                success: true,
                message: "Mahsulot muvaffaqiyatli yangilandi",
                product: {
                    id: updatedProduct._id,
                    name: updatedProduct.name,
                    price: updatedProduct.price,
                    originalPrice: updatedProduct.originalPrice,
                    image: updatedProduct.image,
                    category: updatedProduct.category ? { id: updatedProduct.category._id, name: updatedProduct.category.name } : null,
                    subcategory: updatedProduct.subcategory ? { id: updatedProduct.subcategory._id, name: updatedProduct.subcategory.name } : null,
                    quantity: updatedProduct.quantity,
                    unit: updatedProduct.unit,
                    unitSize: updatedProduct.unitSize,
                    status: updatedProduct.status,
                    createdAt: updatedProduct.createdAt,
                    updatedAt: updatedProduct.updatedAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Mahsulotni yangilashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getSubcategoryById: async (req, res) => {
        try {
            const { id } = req.params;
            const shopOwner = req.shopOwner;

            const subcategory = await Category.findOne({
                _id: id,
                createdBy: shopOwner._id,
                createdByModel: 'ShopOwner'
            });

            if (!subcategory) {
                return res.status(404).json({
                    success: false,
                    message: "Subkategoriya topilmadi yoki sizga ruxsat yo'q"
                });
            }

            res.json({
                success: true,
                subcategory: {
                    id: subcategory._id,
                    name: subcategory.name,
                    category: subcategory.category,
                    status: subcategory.status
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Subkategoriya olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const shopOwner = req.shopOwner;

            // Get shop ID for the shop owner
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            const product = await Product.findOneAndDelete({
                _id: id,
                shop: shop._id
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga ruxsat yo'q"
                });
            }

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
    },

    // Assign product to agent
    assignProductToAgent: async (req, res) => {
        try {
            const { productId, agentId, quantity } = req.body;
            const shopOwnerId = req.user.id;

            // Validate input
            if (!mongoose.Types.ObjectId.isValid(productId) || 
                !mongoose.Types.ObjectId.isValid(agentId) || 
                !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri ma'lumot kiritilgan"
                });
            }

            // Check if product exists and has enough quantity
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi"
                });
            }

            if (product.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Omborda yetarli mahsulot yo'q. Mavjud: ${product.quantity}`
                });
            }

            // Check if agent exists
            const agent = await Agent.findById(agentId);
            if (!agent) {
                return res.status(404).json({
                    success: false,
                    message: "Agent topilmadi"
                });
            }

            // Check if product is already assigned to this agent
            let agentProduct = await AgentProduct.findOne({
                product: productId,
                agent: agentId,
                status: 'assigned'
            });

            if (agentProduct) {
                // Update existing assignment
                agentProduct.assignedQuantity += parseInt(quantity);
                agentProduct.remainingQuantity += parseInt(quantity);
                await agentProduct.save();
            } else {
                // Create new assignment
                agentProduct = new AgentProduct({
                    product: productId,
                    agent: agentId,
                    assignedQuantity: quantity,
                    remainingQuantity: quantity,
                    assignedBy: shopOwnerId,
                    status: 'assigned'
                });
                await agentProduct.save();
            }

            res.status(200).json({
                success: true,
                message: `${quantity} ta mahsulot agentga muvaffaqiyatli yuklandi`,
                data: agentProduct
            });

        } catch (error) {
            console.error('Error assigning product to agent:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    },

    // Get all products assigned to agents
    getAgentProducts: async (req, res) => {
        try {
            const { agentId, status } = req.query;
            const filter = {};
            
            if (agentId) filter.agent = agentId;
            if (status) filter.status = status;

            const agentProducts = await AgentProduct.find(filter)
                .populate('product', 'name price')
                .populate('agent', 'fullname phone')
                .populate('assignedBy', 'fullname phone')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: agentProducts
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

    // Return product from agent to shop
    returnProductFromAgent: async (req, res) => {
        try {
            const { agentProductId, quantity } = req.body;

            if (!mongoose.Types.ObjectId.isValid(agentProductId) || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri ma'lumot kiritilgan"
                });
            }

            const agentProduct = await AgentProduct.findById(agentProductId);
            if (!agentProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Agent mahsuloti topilmadi"
                });
            }

            if (agentProduct.remainingQuantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Agentda yetarli mahsulot yo'q. Qolgan: ${agentProduct.remainingQuantity}`
                });
            }

            // Update agent product
            agentProduct.remainingQuantity -= quantity;
            
            // If all products are returned, mark as returned
            if (agentProduct.remainingQuantity === 0) {
                agentProduct.status = 'returned';
                agentProduct.returnedAt = Date.now();
            }
            
            await agentProduct.save();

            // Update main product quantity
            await Product.findByIdAndUpdate(
                agentProduct.product,
                { $inc: { quantity: quantity } }
            );

            res.status(200).json({
                success: true,
                message: `${quantity} ta mahsulot omborga qaytarildi`,
                data: agentProduct
            });

        } catch (error) {
            console.error('Error returning product from agent:', error);
            res.status(500).json({
                success: false,
                message: 'Xatolik yuz berdi',
                error: error.message
            });
        }
    },

    // Seller Login
    loginSeller: async (req, res) => {
        try {
            const { phone, password } = req.body;
            
            if (!phone || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Telefon raqam va parol kiritilishi shart"
                });
            }

            // Validate phone format
            if (!/^\+998[0-9]{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                });
            }

            // Find seller by phone
            const seller = await Seller.findOne({ phone });

            if (!seller) {
                return res.status(401).json({
                    success: false,
                    message: "Telefon raqam yoki parol noto'g'ri"
                });
            }

            // Check password
            const isMatch = await seller.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Telefon raqam yoki parol noto'g'ri"
                });
            }

            // Check if account is active
            if (seller.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: "Sizning hisobingiz faol emas. Iltimos, do'kon egasi bilan bog'laning."
                });
            }

            // Get shop information
            const shop = await Shop.findById(seller.shop);
            if (!shop || shop.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: "Do'kon faol emas. Iltimos, do'kon egasi bilan bog'laning."
                });
            }

            // Generate token
            const token = jwt.sign(
                { 
                    id: seller._id, 
                    role: 'seller',
                    shopId: seller.shop,
                    createdByType: seller.createdByType
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Muvaffaqiyatli kirish',
                token,
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    shop: {
                        id: shop._id,
                        name: shop.name
                    },
                    createdAt: seller.createdAt
                }
            });

        } catch (error) {
            console.error('Seller login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi',
                error: error.message
            });
        }
    },

    // Seller Management Functions
    createSeller: async (req, res) => {
        try {
            const { fullName, username, password, phone } = req.body;
            const shopOwner = req.shopOwner;

            // Majburiy maydonlarni tekshirish
            if (!fullName || !username || !password || !phone) {
                return res.status(400).json({
                    success: false,
                    message: "Barcha maydonlar to'ldirilishi shart"
                });
            }

            // Username uniqueligini tekshirish
            const existingUsername = await Seller.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Bu username band"
                });
            }

            // Telefon raqam uniqueligini tekshirish
            const existingPhone = await Seller.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam band"
                });
            }

            // Parol uzunligi
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchi yaratish
            const seller = new Seller({
                fullName,
                username,
                password,
                phone,
                shop: shop._id, // Shop Owner ning do'koni
                createdBy: shopOwner._id,
                createdByType: 'ShopOwner'
            });

            await seller.save();

            res.status(201).json({
                success: true,
                message: "Sotuvchi muvaffaqiyatli qo'shildi",
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    createdAt: seller.createdAt
                }
            });

        } catch (error) {
            console.error('Seller creation error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchi qo'shishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sotuvchilar ro'yxatini olish
    getAllSellers: async (req, res) => {
        try {
            const shopOwner = req.shopOwner;
            const { status, search } = req.query;
            
            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }
            
            const query = { shop: shop._id };

            // Status bo'yicha filtrlash
            if (status && ['active', 'inactive'].includes(status)) {
                query.status = status;
            }

            // Qidiruv
            if (search) {
                query.$or = [
                    { fullName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            // Sotuvchilarni olish
            const sellers = await Seller.find(query)
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: sellers.length,
                sellers: sellers.map(seller => ({
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    createdAt: seller.createdAt
                }))
            });

        } catch (error) {
            console.error('Get sellers error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchilar ro'yxatini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Bitta sotuvchini olish
    getSellerById: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const shopOwner = req.shopOwner;

            // sellerId validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri sotuvchi ID formati"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchini olish
            const seller = await Seller.findOne({ _id: sellerId, shop: shop._id });

            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi"
                });
            }

            res.status(200).json({
                success: true,
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    createdAt: seller.createdAt
                }
            });

        } catch (error) {
            console.error('Get seller error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchi ma'lumotlarini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sotuvchi statusini o'zgartirish
    updateSellerStatus: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { status } = req.body;
            const shopOwner = req.shopOwner;

            // Status validatsiyasi
            if (!status || !['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri status. Status 'active' yoki 'inactive' bo'lishi kerak"
                });
            }

            // sellerId validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri sotuvchi ID formati"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchini tekshirish
            const seller = await Seller.findOne({ _id: sellerId, shop: shop._id });
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi"
                });
            }

            // Statusni o'zgartirish
            seller.status = status;
            await seller.save();

            res.status(200).json({
                success: true,
                message: "Sotuvchi statusi muvaffaqiyatli o'zgartirildi",
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    createdAt: seller.createdAt
                }
            });

        } catch (error) {
            console.error('Seller status update error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchi statusini o'zgartirishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sotuvchini tahrirlash
    updateSeller: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { fullName, phone } = req.body;
            const shopOwner = req.shopOwner;

            // sellerId validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri sotuvchi ID formati"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchini tekshirish
            const seller = await Seller.findOne({ _id: sellerId, shop: shop._id });
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi"
                });
            }

            // Telefon raqam validatsiyasi
            if (phone) {
                if (!/^\+998[0-9]{9}$/.test(phone)) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                    });
                }

                // Telefon raqam uniqueligini tekshirish
                const existingPhone = await Seller.findOne({ phone, _id: { $ne: sellerId } });
                if (existingPhone) {
                    return res.status(400).json({
                        success: false,
                        message: "Bu telefon raqam band"
                    });
                }
            }

            // Ismni tekshirish
            if (fullName && fullName.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak"
                });
            }

            // Ma'lumotlarni yangilash
            if (fullName) seller.fullName = fullName;
            if (phone) seller.phone = phone;

            await seller.save();

            res.status(200).json({
                success: true,
                message: "Sotuvchi muvaffaqiyatli tahrirlandi",
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                    createdAt: seller.createdAt
                }
            });

        } catch (error) {
            console.error('Seller update error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchini tahrirlashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sotuvchi parolini o'zgartirish
    updateSellerPassword: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { password } = req.body;
            const shopOwner = req.shopOwner;

            // Password validatsiyasi
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                });
            }

            // sellerId validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri sotuvchi ID formati"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchini tekshirish
            const seller = await Seller.findOne({ _id: sellerId, shop: shop._id });
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi"
                });
            }

            // Parolni yangilash
            seller.password = password;
            await seller.save();

            res.status(200).json({
                success: true,
                message: "Sotuvchi paroli muvaffaqiyatli o'zgartirildi"
            });

        } catch (error) {
            console.error('Seller password update error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchi parolini o'zgartirishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sotuvchini o'chirish
    deleteSeller: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const shopOwner = req.shopOwner;

            // sellerId validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri sotuvchi ID formati"
                });
            }

            // Shop Owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Sotuvchini tekshirish
            const seller = await Seller.findOne({ _id: sellerId, shop: shop._id });
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi"
                });
            }

            // Sotuvchini o'chirish
            await Seller.findByIdAndDelete(sellerId);

            res.status(200).json({
                success: true,
                message: "Sotuvchi muvaffaqiyatli o'chirildi"
            });

        } catch (error) {
            console.error('Delete seller error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchini o'chirishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Seller Product Functions
    getSellerProducts: async (req, res) => {
        try {
            const { status, category, subcategory, search } = req.query;
            const seller = req.seller; // This will come from seller auth middleware
            
            // Use seller's shop directly from auth middleware
            const query = { shop: seller.shop };
            
            // Status filter
            if (status && ['active', 'inactive', 'archived'].includes(status)) {
                query.status = status;
            }

            // Category filter
            if (category) {
                query.category = category;
            }

            // Subcategory filter
            if (subcategory) {
                query.subcategory = subcategory;
            }

            // Search filter
            if (search && search.trim() !== '') {
                query.name = { $regex: search.trim(), $options: 'i' };
            }

            const products = await Product.find(query)
                .populate('category', 'name')
                .populate('subcategory', 'name')
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
                    unit: p.unit,
                    unitSize: p.unitSize,
                    status: p.status,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }))
            });
        } catch (error) {
            console.error('Get seller products error:', error);
            res.status(500).json({
                success: false,
                message: "Mahsulotlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getSellerProductById: async (req, res) => {
        try {
            const { productId } = req.params;
            const seller = req.seller; // This will come from seller auth middleware
            
            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri mahsulot ID formati"
                });
            }

            const product = await Product.findOne({
                _id: productId,
                shop: seller.shop
            })
            .populate('category', 'name')
            .populate('subcategory', 'name');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga ruxsat yo'q"
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
                    unit: product.unit,
                    unitSize: product.unitSize,
                    status: product.status,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }
            });
        } catch (error) {
            console.error('Get seller product error:', error);
            res.status(500).json({
                success: false,
                message: "Mahsulotni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Seller sell product function
    sellProduct: async (req, res) => {
        try {
            const { productId, quantity, customerInfo } = req.body;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(productId) || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri ma'lumot kiritilgan"
                });
            }

            // Check if product belongs to seller's shop
            const product = await Product.findOne({
                _id: productId,
                shop: seller.shop,
                status: 'active'
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Mahsulot topilmadi yoki sizga tegishli emas"
                });
            }

            if (product.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Yetarli mahsulot yo'q. Mavjud: ${product.quantity}`
                });
            }

            // Update product quantity
            product.quantity -= quantity;
            
            // If all products are sold, mark as inactive
            if (product.quantity === 0) {
                product.status = 'inactive';
            }
            
            await product.save();

            // Create order history record
            const orderHistory = new OrderHistory({
                product: productId,
                seller: seller._id,
                shop: seller.shop,
                quantity: quantity,
                customerInfo: customerInfo || {},
                status: 'completed',
                soldAt: new Date()
            });

            await orderHistory.save();

            res.status(200).json({
                success: true,
                message: `${quantity} ta mahsulot sotildi`,
                data: {
                    product: {
                        id: product._id,
                        name: product.name,
                        remainingQuantity: product.quantity,
                        status: product.status
                    },
                    order: {
                        id: orderHistory._id,
                        soldAt: orderHistory.soldAt
                    }
                }
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

    // Get current seller profile
    getSellerMe: async (req, res) => {
        try {
            const seller = req.seller;
            
            // Get shop information
            const shop = await Shop.findOne({ _id: seller.shop, status: 'active' });
            
            // Get statistics
            const productCount = await Product.countDocuments({ shop: seller.shop, status: 'active' });
            const totalSoldProducts = await OrderHistory.aggregate([
                { $match: { seller: seller._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$quantity' } } }
            ]);
            
            const totalRevenue = await OrderHistory.aggregate([
                { $match: { seller: seller._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalSum' } } }
            ]);
            
            res.json({
                success: true,
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    email: seller.email,
                    status: seller.status,
                    shop: seller.shop,
                    createdBy: seller.createdBy,
                    createdAt: seller.createdAt,
                    updatedAt: seller.updatedAt
                },
                shop: shop ? {
                    id: shop._id,
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    status: shop.status,
                    createdAt: shop.createdAt
                } : null,
                statistics: {
                    totalProducts: productCount,
                    totalSoldProducts: totalSoldProducts[0]?.total || 0,
                    totalRevenue: totalRevenue[0]?.total || 0
                }
            });
        } catch (error) {
            console.error('Get seller profile error:', error);
            res.status(500).json({
                success: false,
                message: "Profil ma'lumotlarini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Get current shop owner profile
    getMe: async (req, res) => {
        try {
            const shopOwner = req.shopOwner;
            
            // Get shop information
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            
            // Get statistics
            const productCount = await Product.countDocuments({ shop: shop?._id });
            const categoryCount = await Category.countDocuments({ createdBy: shopOwner._id, status: 'active' });
            const sellerCount = await Seller.countDocuments({ shop: shop?._id, status: 'active' });
            
            res.json({
                success: true,
                shopOwner: {
                    id: shopOwner._id,
                    name: shopOwner.name,
                    username: shopOwner.username,
                    phone: shopOwner.phone,
                    email: shopOwner.email,
                    status: shopOwner.status,
                    lastLogin: shopOwner.lastLogin,
                    createdAt: shopOwner.createdAt,
                    updatedAt: shopOwner.updatedAt
                },
                shop: shop ? {
                    id: shop._id,
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    status: shop.status,
                    createdAt: shop.createdAt
                } : null,
                statistics: {
                    totalProducts: productCount,
                    totalCategories: categoryCount,
                    totalSellers: sellerCount
                }
            });
        } catch (error) {
            console.error('Get shop owner profile error:', error);
            res.status(500).json({
                success: false,
                message: "Profil ma'lumotlarini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    }
};
