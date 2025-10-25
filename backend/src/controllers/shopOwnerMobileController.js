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
const Order = require('../models/Order');
const Region = require('../models/Region');
const InterestRate = require('../models/InterestRate');
const UserNotification = require('../models/UserNotification');

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

// ==================== NOTIFICATIONS ====================

// Do'kon egasi xabarnomalarini olish
const getShopOwnerNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const userId = req.shopOwner._id;
        const userModel = 'ShopOwner';

        const filter = { user: userId, userModel };
        if (status) {
            filter.status = status;
        }

        const notifications = await UserNotification.find(filter)
            .populate({
                path: 'notification',
                select: 'title message type priority createdAt'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserNotification.countDocuments(filter);
        const unreadCount = await UserNotification.countDocuments({ 
            user: userId, 
            userModel, 
            status: { $in: ['sent', 'delivered'] }
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            unreadCount
        });

    } catch (error) {
        console.error('Get shop owner notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnomalarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi xabarnoma o'qilgan deb belgilash
const markShopOwnerNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.shopOwner._id;
        const userModel = 'ShopOwner';

        const userNotification = await UserNotification.markAsRead(
            notificationId, 
            userId, 
            userModel
        );

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        res.json({
            success: true,
            message: "Xabarnoma o'qilgan deb belgilandi",
            data: userNotification
        });

    } catch (error) {
        console.error('Mark shop owner notification as read error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma holatini yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi o'qilmagan xabarnomalar sonini olish
const getShopOwnerUnreadNotificationCount = async (req, res) => {
    try {
        const userId = req.shopOwner._id;
        const userModel = 'ShopOwner';

        const unreadCount = await UserNotification.getUnreadCount(userId, userModel);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });

    } catch (error) {
        console.error('Get shop owner unread notification count error:', error);
        res.status(500).json({
            success: false,
            message: "O'qilmagan xabarnomalar sonini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== SELLER NOTIFICATIONS ====================

// Agent/Sotuvchi xabarnomalarini olish
const getSellerNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const userId = req.seller._id || req.seller.id;
        const userModel = 'Seller';

        const filter = { user: userId, userModel };
        if (status) {
            filter.status = status;
        }

        const notifications = await UserNotification.find(filter)
            .populate({
                path: 'notification',
                select: 'title message type priority createdAt'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserNotification.countDocuments(filter);
        const unreadCount = await UserNotification.countDocuments({ 
            user: userId, 
            userModel, 
            status: { $in: ['sent', 'delivered'] }
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            unreadCount
        });

    } catch (error) {
        console.error('Get seller notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnomalarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Agent/Sotuvchi xabarnoma o'qilgan deb belgilash
const markSellerNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.seller._id || req.seller.id;
        const userModel = 'Seller';

        const userNotification = await UserNotification.markAsRead(
            notificationId, 
            userId, 
            userModel
        );

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        res.json({
            success: true,
            message: "Xabarnoma o'qilgan deb belgilandi",
            data: userNotification
        });

    } catch (error) {
        console.error('Mark seller notification as read error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma holatini yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Agent/Sotuvchi o'qilmagan xabarnomalar sonini olish
const getSellerUnreadNotificationCount = async (req, res) => {
    try {
        const userId = req.seller._id || req.seller.id;
        const userModel = 'Seller';

        const unreadCount = await UserNotification.getUnreadCount(userId, userModel);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });

    } catch (error) {
        console.error('Get seller unread notification count error:', error);
        res.status(500).json({
            success: false,
            message: "O'qilmagan xabarnomalar sonini olishda xatolik yuz berdi",
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
                status,
                deliveryRegions,
                installmentDays
            } = req.body;

            const shopOwner = req.shopOwner;
            
            // Debug: Log the received deliveryRegions
            console.log('Received deliveryRegions:', deliveryRegions, 'Type:', typeof deliveryRegions);
            
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

            // Validate delivery regions if provided
            let validatedDeliveryRegions = [];
            if (deliveryRegions) {
                // Handle both JSON array and form-data string formats
                let regionsArray = [];
                if (Array.isArray(deliveryRegions)) {
                    regionsArray = deliveryRegions;
                } else if (typeof deliveryRegions === 'string') {
                    // Parse JSON string if it's a string
                    try {
                        regionsArray = JSON.parse(deliveryRegions);
                    } catch (e) {
                        // If not JSON, treat as comma-separated values
                        regionsArray = deliveryRegions.split(',').map(id => id.trim()).filter(id => id);
                    }
                }
                
                console.log('Parsed regions array:', regionsArray);
                
                if (regionsArray.length > 0) {
                    // Validate ObjectId format first
                    const invalidIds = regionsArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
                    if (invalidIds.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Noto'g'ri region ID format: ${invalidIds.join(', ')}`
                        });
                    }
                    
                    // Validate that all regions exist
                    const regions = await Region.find({ 
                        _id: { $in: regionsArray },
                        status: 'active'
                    });
                    
                    console.log('Found regions:', regions.length, 'out of', regionsArray.length);
                    
                    if (regions.length !== regionsArray.length) {
                        const foundIds = regions.map(r => r._id.toString());
                        const missingIds = regionsArray.filter(id => !foundIds.includes(id));
                        return res.status(400).json({
                            success: false,
                            message: `Ba'zi regionlar topilmadi yoki faol emas. Topilmagan IDlar: ${missingIds.join(', ')}`
                        });
                    }
                    
                    validatedDeliveryRegions = regionsArray;
                }
            }
            
            // Debug: Log the final validated regions
            console.log('Final validatedDeliveryRegions:', validatedDeliveryRegions);

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
                deliveryRegions: validatedDeliveryRegions, // Add delivery regions
                installmentDays: installmentDays || 0, // Add installment days
                createdBy: shopOwner._id,
                createdByModel: 'ShopOwner',
                shop: shop._id
            });

            await product.save();
            
            // Populate delivery regions for response
            const populatedProduct = await Product.findById(product._id)
                .populate('deliveryRegions', 'name type');

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
                    deliveryRegions: populatedProduct.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })),
                    installmentDays: product.installmentDays,
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
                .populate('deliveryRegions', 'name type')
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
                    deliveryRegions: p.deliveryRegions ? p.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })) : [],
                    installmentDays: p.installmentDays || 0,
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
            .populate('subcategory', 'name')
            .populate('deliveryRegions', 'name type');

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
                    deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })) : [],
                    installmentDays: product.installmentDays || 0,
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
            
            // Debug: Log the received deliveryRegions
            console.log('Update - Received deliveryRegions:', updates.deliveryRegions, 'Type:', typeof updates.deliveryRegions);

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

            // Validate delivery regions if provided
            if (updates.deliveryRegions) {
                // Handle both JSON array and form-data string formats
                let regionsArray = [];
                if (Array.isArray(updates.deliveryRegions)) {
                    regionsArray = updates.deliveryRegions;
                } else if (typeof updates.deliveryRegions === 'string') {
                    // Parse JSON string if it's a string
                    try {
                        regionsArray = JSON.parse(updates.deliveryRegions);
                    } catch (e) {
                        // If not JSON, treat as comma-separated values
                        regionsArray = updates.deliveryRegions.split(',').map(id => id.trim()).filter(id => id);
                    }
                }
                
                console.log('Update - Parsed regions array:', regionsArray);
                
                if (regionsArray.length > 0) {
                    // Validate ObjectId format first
                    const invalidIds = regionsArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
                    if (invalidIds.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Noto'g'ri region ID format: ${invalidIds.join(', ')}`
                        });
                    }
                    
                    // Validate that all regions exist
                    const regions = await Region.find({ 
                        _id: { $in: regionsArray },
                        status: 'active'
                    });
                    
                    console.log('Update - Found regions:', regions.length, 'out of', regionsArray.length);
                    
                    if (regions.length !== regionsArray.length) {
                        const foundIds = regions.map(r => r._id.toString());
                        const missingIds = regionsArray.filter(id => !foundIds.includes(id));
                        return res.status(400).json({
                            success: false,
                            message: `Ba'zi regionlar topilmadi yoki faol emas. Topilmagan IDlar: ${missingIds.join(', ')}`
                        });
                    }
                    
                    // Update the deliveryRegions with parsed array
                    updates.deliveryRegions = regionsArray;
                }
            }
            
            // Debug: Log the final validated regions
            console.log('Update - Final validatedDeliveryRegions:', updates.deliveryRegions);

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

            // Populate category, subcategory and delivery regions for response
            const updatedProduct = await Product.findById(product._id)
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .populate('deliveryRegions', 'name type');

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
                    deliveryRegions: updatedProduct.deliveryRegions ? updatedProduct.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })) : [],
                    installmentDays: updatedProduct.installmentDays || 0,
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
            console.log('Seller login attempt:', {
                phone: phone,
                sellerFound: !!seller,
                seller: seller ? {
                    id: seller._id,
                    fullName: seller.fullName,
                    phone: seller.phone,
                    status: seller.status,
                    shop: seller.shop
                } : null
            });

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

            // Get shop information - Check both shops array and shopOwners array
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                // Get shop IDs from shopOwners (each shopOwner has their own shops)
                for (const shopOwner of seller.shopOwners) {
                    // Find shops owned by this shopOwner
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            const shops = await Shop.find({ _id: { $in: allShopIds } });
            console.log('Seller shops info:', {
                sellerId: seller._id,
                directShopIds: seller.shops || [],
                shopOwners: seller.shopOwners || [],
                allShopIds: allShopIds,
                shops: shops.map(shop => ({
                    id: shop._id,
                    name: shop.name,
                    status: shop.status,
                    owner: shop.owner
                }))
            });
            
            // Shop tekshiruvi ixtiyoriy - seller shop bo'lmasa ham login qila oladi
            let activeShops = [];
            if (shops && shops.length > 0) {
                activeShops = shops.filter(shop => shop.status === 'active');
            }

            // Generate token
            const token = jwt.sign(
                { 
                    id: seller._id, 
                    role: 'seller',
                    shopIds: allShopIds || [], // All shop IDs (from both sources) - ixtiyoriy
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
                    shops: activeShops.map(shop => ({
                        id: shop._id,
                        name: shop.name,
                        status: shop.status
                    })),
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
            
            // Sotuvchilarni topish - shop yoki shopOwner orqali
            const query = {
                $or: [
                    { shop: shop._id },
                    { shopOwner: shopOwner._id },
                    { 'shopOwners.shopOwner': shopOwner._id }
                ]
            };

            // Status bo'yicha filtrlash
            if (status && ['active', 'inactive'].includes(status)) {
                query.status = status;
            }

            // Qidiruv
            if (search) {
                query.$and = [
                    query,
                    {
                        $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                        ]
                    }
                ];
            }

            // Sotuvchilarni olish
            const sellers = await Seller.find(query)
                .populate('serviceAreas.region', 'name type')
                .populate('serviceAreas.districts', 'name type')
                .populate('serviceAreas.mfys', 'name type')
                .populate('shopOwners.shopOwner', 'name username phone')
                .populate('shopOwners.serviceAreas.region', 'name type')
                .populate('shopOwners.serviceAreas.districts', 'name type')
                .populate('shopOwners.serviceAreas.mfys', 'name type')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: sellers.length,
                sellers: sellers.map(seller => {
                    // Bu do'kon egasiga tegishli service areas'ni topish
                    const currentShopOwnerData = seller.shopOwners?.find(so => {
                        const shopOwnerId = so.shopOwner._id || so.shopOwner;
                        return shopOwnerId.toString() === shopOwner._id.toString();
                    });
                    
                    const finalServiceAreas = currentShopOwnerData?.serviceAreas || seller.serviceAreas || [];
                    
                    return {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    status: seller.status,
                        serviceAreas: finalServiceAreas,
                        assignedAt: currentShopOwnerData?.assignedAt || seller.assignedAt,
                    createdAt: seller.createdAt
                    };
                })
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
            const seller = req.seller;
            
            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            console.log('Seller products query:', {
                sellerId: seller._id,
                allShopIds: allShopIds,
                directShops: seller.shops || [],
                shopOwners: seller.shopOwners || []
            });
            
            if (allShopIds.length === 0) {
                return res.json({
                    success: true,
                    count: 0,
                    products: [],
                    message: "Sizga hech qanday do'kon tayinlanmagan"
                });
            }
            
            // Build query for all seller's shops
            const query = { shop: { $in: allShopIds } };
            
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
                .populate('shop', 'name address phone')
                .populate('deliveryRegions', 'name type')
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
                    shop: p.shop ? {
                        id: p.shop._id,
                        name: p.shop.name,
                        address: p.shop.address,
                        phone: p.shop.phone
                    } : null,
                    deliveryRegions: p.deliveryRegions ? p.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })) : [],
                    installmentDays: p.installmentDays || 0,
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
            const seller = req.seller;
            
            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri mahsulot ID formati"
                });
            }

            // Get all shop IDs for this seller
            let allShopIds = [...(seller.shops || [])];
            
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            const product = await Product.findOne({
                _id: productId,
                shop: { $in: allShopIds }
            })
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('shop', 'name address phone')
            .populate('deliveryRegions', 'name type');

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
                    shop: product.shop ? {
                        id: product.shop._id,
                        name: product.shop.name,
                        address: product.shop.address,
                        phone: product.shop.phone
                    } : null,
                    deliveryRegions: product.deliveryRegions ? product.deliveryRegions.map(region => ({
                        id: region._id,
                        name: region.name,
                        type: region.type
                    })) : [],
                    installmentDays: product.installmentDays || 0,
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

            // Get all shop IDs for this seller
            let allShopIds = [...(seller.shops || [])];
            
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Check if product belongs to seller's shops
            const product = await Product.findOne({
                _id: productId,
                shop: { $in: allShopIds },
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
            
            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            // Get shop information
            const shops = await Shop.find({ _id: { $in: allShopIds } });
            
            // Get statistics
            const productCount = await Product.countDocuments({ shop: { $in: allShopIds }, status: 'active' });
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
                    shops: allShopIds,
                    shopOwners: seller.shopOwners || [],
                    createdBy: seller.createdBy,
                    createdAt: seller.createdAt,
                    updatedAt: seller.updatedAt
                },
                shops: shops.map(shop => ({
                    id: shop._id,
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    status: shop.status,
                    createdAt: shop.createdAt
                })),
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

    // Get other sellers in the same shops (for seller mobile)
    getSellerColleagues: async (req, res) => {
        try {
            const seller = req.seller;
            const { status, search } = req.query;
            
            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            if (allShopIds.length === 0) {
                return res.json({
                    success: true,
                    count: 0,
                    sellers: [],
                    message: "Sizga hech qanday do'kon tayinlanmagan"
                });
            }
            
            const query = { 
                $or: [
                    { shops: { $in: allShopIds } },
                    { 'shopOwners.shopOwner': { $in: allShopIds } },
                    { shopOwner: { $in: allShopIds } }
                ],
                _id: { $ne: seller._id } // Exclude current seller
            };

            // Status bo'yicha filtrlash
            if (status && ['active', 'inactive'].includes(status)) {
                query.status = status;
            }

            // Qidiruv
            if (search) {
                query.$and = [
                    query,
                    {
                        $or: [
                            { fullName: { $regex: search, $options: 'i' } },
                            { username: { $regex: search, $options: 'i' } },
                            { phone: { $regex: search, $options: 'i' } }
                        ]
                    }
                ];
                delete query.$or;
            }

            // Sotuvchilarni olish
            const sellers = await Seller.find(query)
                .populate('shops', 'name')
                .populate('shopOwners.shopOwner', 'name username')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                count: sellers.length,
                sellers: sellers.map(seller => ({
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    email: seller.email,
                    status: seller.status,
                    shops: seller.shops,
                    shopOwners: seller.shopOwners,
                    createdAt: seller.createdAt
                }))
            });

        } catch (error) {
            console.error('Get seller colleagues error:', error);
            res.status(500).json({
                success: false,
                message: "Hamkasblarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Get seller profile for shop owner mobile (shop owner can view seller profile)
    getSellerProfileForShopOwner: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const shopOwner = req.shopOwner;

            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri seller ID formati"
                });
            }

            // Get shop owner's shop
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Find seller in this shop
            const seller = await Seller.findOne({
                _id: sellerId,
                $or: [
                    { shops: shop._id },
                    { 'shopOwners.shopOwner': shopOwner._id },
                    { shopOwner: shopOwner._id }
                ]
            });

            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Sotuvchi topilmadi yoki sizning do'koningizda ishlamaydi"
                });
            }

            // Get seller's statistics
            const productCount = await Product.countDocuments({ 
                shop: shop._id, 
                status: 'active' 
            });
            
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
                    shops: seller.shops,
                    shopOwners: seller.shopOwners,
                    createdBy: seller.createdBy,
                    createdAt: seller.createdAt,
                    updatedAt: seller.updatedAt
                },
                shop: {
                    id: shop._id,
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    status: shop.status
                },
                statistics: {
                    totalProducts: productCount,
                    totalSoldProducts: totalSoldProducts[0]?.total || 0,
                    totalRevenue: totalRevenue[0]?.total || 0
                }
            });

        } catch (error) {
            console.error('Get seller profile for shop owner error:', error);
            res.status(500).json({
                success: false,
                message: "Sotuvchi profilini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Get regions for mobile
    getRegions: async (req, res) => {
        try {
            const { type, parent, search, status = 'active' } = req.query;
            
            // Build query
            const query = { status };
            
            if (type) {
                query.type = type;
            }
            
            if (parent !== undefined && parent !== null && parent !== '') {
                if (parent === 'null' || parent === '') {
                    query.parent = null;
                } else {
                    if (mongoose.Types.ObjectId.isValid(parent)) {
                        query.parent = parent;
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: "Noto'g'ri parent ID formati"
                        });
                    }
                }
            }
            
            if (search && search.trim() !== '') {
                query.name = { $regex: search.trim(), $options: 'i' };
            }
            
            const regions = await Region.find(query)
                .populate('parent', 'name type')
                .sort({ name: 1 });
            
            res.json({
                success: true,
                count: regions.length,
                regions: regions.map(region => ({
                    id: region._id,
                    name: region.name,
                    type: region.type,
                    code: region.code,
                    parent: region.parent ? {
                        id: region.parent._id,
                        name: region.parent.name,
                        type: region.parent.type
                    } : null,
                    status: region.status,
                    createdAt: region.createdAt
                }))
            });
        } catch (error) {
            console.error('Get regions error:', error);
            res.status(500).json({
                success: false,
                message: 'Regionlarni olishda xatolik',
                error: error.message
            });
        }
    },

    // Get districts by region ID
    getDistricts: async (req, res) => {
        try {
            const { regionId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(regionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri hudud ID"
                });
            }

            const districts = await Region.find({ 
                type: 'district', 
                parent: regionId,
                status: 'active' 
            }).select('name code').sort({ name: 1 });

            res.json({
                success: true,
                data: districts
            });

        } catch (error) {
            console.error('Get districts error:', error);
            res.status(500).json({
                success: false,
                message: "Tumanlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Get MFYs by district ID
    getMfys: async (req, res) => {
        try {
            const { districtId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(districtId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri tuman ID"
                });
            }

            const mfys = await Region.find({ 
                type: 'mfy', 
                parent: districtId,
                status: 'active' 
            }).select('name code').sort({ name: 1 });

            res.json({
                success: true,
                data: mfys
            });

        } catch (error) {
            console.error('Get MFYs error:', error);
            res.status(500).json({
                success: false,
                message: "MFYlarni olishda xatolik yuz berdi",
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
    },

    // Seller Order Management Functions
    getSellerOrders: async (req, res) => {
        try {
            const seller = req.seller;
            const { 
                page = 1, 
                limit = 10,
                status,
                paymentStatus,
                regionId,
                districtId,
                mfyId
            } = req.query;

            console.log('=== SELLER ORDERS DEBUG ===');
            console.log('Seller ID:', seller._id);
            console.log('Seller shops:', seller.shops);
            console.log('Seller shopOwners:', seller.shopOwners);
            console.log('Seller shopOwner (old):', seller.shopOwner);

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];
            
            console.log('All shop IDs for seller:', allShopIds);

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());
            
            console.log('Products found in seller shops:', productIds.length);
            console.log('Product IDs:', productIds);

            if (productIds.length === 0) {
                console.log('No products found in seller shops');
                return res.json({
                    success: true,
                    data: {
                        orders: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: parseInt(limit),
                            hasNextPage: false,
                            hasPrevPage: false
                        }
                    }
                });
            }

            // Build query to find orders that contain products from seller's shops
            // Faqat qabul qilinmagan yoki o'zi qabul qilgan zakazlar
            const query = {
                $and: [
                    { 'items.product': { $in: shopProducts.map(p => p._id) } },
                    {
                        $or: [
                            { isAccepted: { $ne: true } },  // Qabul qilinmagan zakazlar
                            { acceptedBy: seller._id }       // O'zi qabul qilgan zakazlar
                        ]
                    }
                ]
            };

            // Add status filters
            if (status) query.status = status;
            if (paymentStatus) query.paymentStatus = paymentStatus;

            // Add location filters
            if (regionId) {
                if (!mongoose.Types.ObjectId.isValid(regionId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri hudud ID"
                    });
                }
                query['location.region'] = regionId;
            }

            if (districtId) {
                if (!mongoose.Types.ObjectId.isValid(districtId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri tuman ID"
                    });
                }
                query['location.district'] = districtId;
            }

            if (mfyId) {
                if (!mongoose.Types.ObjectId.isValid(mfyId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri MFY ID"
                    });
                }
                query['location.mfy'] = mfyId;
            }

            console.log('Query for orders:', JSON.stringify(query, null, 2));

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Get orders
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
                .populate('user', 'fullName phone')
                .populate({
                    path: 'location.region',
                    select: 'name code type'
                })
                .populate({
                    path: 'location.district',
                    select: 'name code type'
                })
                .populate({
                    path: 'location.mfy',
                    select: 'name code type'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            console.log('Orders found:', orders.length);
            console.log('Orders:', orders.map(o => ({ id: o._id, orderNumber: o.orderNumber, itemsCount: o.items.length })));

            // Filter items to only show products from seller's shop
            const filteredOrders = orders.map(order => {
                const filteredItems = order.items.filter(item => 
                    productIds.includes(item.product._id.toString())
                );
                
                return {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    items: filteredItems.map(item => ({
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
                    totalPrice: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    itemCount: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    deliveryAddress: order.deliveryAddress,
                    deliveryNotes: order.deliveryNotes,
                    estimatedDelivery: order.estimatedDelivery,
                    actualDelivery: order.actualDelivery,
                    location: order.location,
                    user: order.user,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                };
            });

            // Get total count
            const total = await Order.countDocuments(query);

            res.json({
                success: true,
                data: {
                    orders: filteredOrders,
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
            console.error('Get seller orders error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmalarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getSellerOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            })
            .populate({
                path: 'items.product',
                select: 'name image category subcategory unit unitSize shop',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' },
                    { path: 'shop', select: 'name title address phone' }
                ]
            })
            .populate('user', 'fullName phone email')
            .populate({
                path: 'location.region',
                select: 'name code type'
            })
            .populate({
                path: 'location.district',
                select: 'name code type'
            })
            .populate({
                path: 'location.mfy',
                select: 'name code type'
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Filter items to only show products from seller's shop
            const filteredItems = order.items.filter(item => 
                productIds.includes(item.product._id.toString())
            );

            const formattedOrder = {
                id: order._id,
                orderNumber: order.orderNumber,
                items: filteredItems.map(item => ({
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
                totalPrice: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                totalOriginalPrice: filteredItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0),
                totalDiscount: filteredItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0) - 
                              filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                itemCount: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                deliveryAddress: order.deliveryAddress,
                deliveryNotes: order.deliveryNotes,
                estimatedDelivery: order.estimatedDelivery,
                actualDelivery: order.actualDelivery,
                location: order.location,
                user: order.user,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            };

            res.json({
                success: true,
                data: formattedOrder
            });

        } catch (error) {
            console.error('Get seller order error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmani olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    acceptOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Check if order can be accepted
            if (order.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtmani qabul qilish mumkin emas. Holat: " + order.status
                });
            }

            // Check if order is already accepted by someone else
            if (order.isAccepted && order.acceptedBy && order.acceptedBy.toString() !== seller._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtma allaqachon boshqa agent tomonidan qabul qilingan"
                });
            }

            // Update order status and acceptance info
            order.status = 'confirmed';
            order.isAccepted = true;
            order.acceptedBy = seller._id;
            order.acceptedAt = new Date();
            await order.save();

            res.json({
                success: true,
                message: "Buyurtma qabul qilindi",
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status
                }
            });

        } catch (error) {
            console.error('Accept order error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmani qabul qilishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    markOrderAsDelivered: async (req, res) => {
        try {
            const { orderId } = req.params;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Check if order can be marked as delivered
            if (!['confirmed', 'processing', 'shipped'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtmani yetkazildi deb belgilash mumkin emas. Holat: " + order.status
                });
            }

            // Update order status and delivery time
            order.status = 'delivered';
            order.actualDelivery = new Date();
            await order.save();

            res.json({
                success: true,
                message: "Buyurtma yetkazildi deb belgilandi",
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    actualDelivery: order.actualDelivery
                }
            });

        } catch (error) {
            console.error('Mark order as delivered error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmani yetkazildi deb belgilashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    cancelSellerOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Check if order can be cancelled
            if (['delivered', 'cancelled'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtmani bekor qilish mumkin emas. Holat: " + order.status
                });
            }

            // Update order status
            order.status = 'cancelled';
            await order.save();

            // Return product quantities for items from seller's shop
            const sellerItems = order.items.filter(item => 
                productIds.includes(item.product.toString())
            );

            for (let item of sellerItems) {
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
                    orderNumber: order.orderNumber,
                    status: order.status,
                    reason: reason || "Sotuvchi tomonidan bekor qilindi"
                }
            });

        } catch (error) {
            console.error('Cancel seller order error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmani bekor qilishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    confirmPayment: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { paymentMethod, notes } = req.body;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Check if payment can be confirmed
            if (order.paymentStatus === 'paid') {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtma uchun to'lov allaqachon tasdiqlangan"
                });
            }

            if (order.paymentStatus === 'failed') {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtma uchun to'lov muvaffaqiyatsiz bo'lgan"
                });
            }

            // Update payment status
            order.paymentStatus = 'paid';
            if (paymentMethod) {
                order.paymentMethod = paymentMethod;
            }
            
            // If order is still pending, move it to confirmed
            if (order.status === 'pending') {
                order.status = 'confirmed';
            }

            await order.save();

            res.json({
                success: true,
                message: "To'lov muvaffaqiyatli tasdiqlandi",
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    paymentStatus: order.paymentStatus,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    confirmedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Confirm payment error:', error);
            res.status(500).json({
                success: false,
                message: "To'lovni tasdiqlashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    rejectPayment: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const seller = req.seller;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID"
                });
            }

            // Get all shop IDs for this seller (both direct shops and shopOwners)
            let allShopIds = [...(seller.shops || [])];
            
            // Add shops from shopOwners array
            if (seller.shopOwners && seller.shopOwners.length > 0) {
                for (const shopOwner of seller.shopOwners) {
                    const shopOwnerShops = await Shop.find({ owner: shopOwner.shopOwner });
                    allShopIds = allShopIds.concat(shopOwnerShops.map(shop => shop._id));
                }
            }
            
            // Also check old shopOwner field for backward compatibility
            if (seller.shopOwner && !allShopIds.includes(seller.shopOwner.toString())) {
                const oldShopOwnerShops = await Shop.find({ owner: seller.shopOwner });
                allShopIds = allShopIds.concat(oldShopOwnerShops.map(shop => shop._id));
            }
            
            // Remove duplicates
            allShopIds = [...new Set(allShopIds.map(id => id.toString()))];

            // Get all products from seller's shops
            const shopProducts = await Product.find({ shop: { $in: allShopIds } }).select('_id');
            const productIds = shopProducts.map(p => p._id.toString());

            if (productIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                'items.product': { $in: shopProducts.map(p => p._id) }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi"
                });
            }

            // Check if payment can be rejected
            if (order.paymentStatus === 'paid') {
                return res.status(400).json({
                    success: false,
                    message: "Bu buyurtma uchun to'lov allaqachon tasdiqlangan"
                });
            }

            // Update payment status
            order.paymentStatus = 'failed';
            await order.save();

            res.json({
                success: true,
                message: "To'lov rad etildi",
                data: {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    paymentStatus: order.paymentStatus,
                    reason: reason || "To'lov rad etildi",
                    rejectedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Reject payment error:', error);
            res.status(500).json({
                success: false,
                message: "To'lovni rad etishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Mavjud sellerlarni ko'rish (admin tomonidan yaratilgan barcha sellerlar)
    getAvailableSellers: async (req, res) => {
        try {
            const shopOwner = req.shopOwner;

            // Admin tomonidan yaratilgan barcha sellerlarni olish (tayinlangan va tayinlanmagan)
            const sellers = await Seller.find({
                createdByType: 'Admin',
                status: 'active'
            })
            .select('fullName username phone createdAt shopOwner assignedAt')
            .sort({ createdAt: -1 });

            res.json({
                success: true,
                count: sellers.length,
                sellers: sellers.map(seller => ({
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    createdAt: seller.createdAt,
                    isAssigned: !!seller.shopOwner,
                    assignedAt: seller.assignedAt
                }))
            });
        } catch (error) {
            console.error('Get available sellers error:', error);
            res.status(500).json({
                success: false,
                message: "Mavjud sellerlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sellerni tayinlash
    assignSeller: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const shopOwner = req.shopOwner;

            // ID validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri seller ID formati"
                });
            }

            // Sellerni tekshirish
            const seller = await Seller.findById(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Seller topilmadi"
                });
            }

            // Seller allaqachon bu do'kon egasiga tayinlanganmi tekshirish
            const alreadyAssigned = seller.shopOwners && 
                seller.shopOwners.some(so => so.shopOwner.toString() === shopOwner._id.toString());

            if (alreadyAssigned) {
                return res.status(400).json({
                    success: false,
                    message: "Bu seller allaqachon sizga tayinlangan"
                });
            }

            // Yangi shopOwners array'ini yaratish yoki mavjud array'ga qo'shish
            if (!seller.shopOwners) {
                seller.shopOwners = [];
            }

            // Yangi tayinlash qo'shish
            seller.shopOwners.push({
                shopOwner: shopOwner._id,
                assignedBy: shopOwner._id,
                assignedAt: new Date(),
                serviceAreas: []
            });

            // Eski usulni ham saqlash (backward compatibility)
            if (!seller.shopOwner) {
                seller.shopOwner = shopOwner._id;
                seller.assignedBy = shopOwner._id;
                seller.assignedAt = new Date();
            }

            await seller.save();

            res.json({
                success: true,
                message: "Seller muvaffaqiyatli tayinlandi",
                seller: {
                    id: seller._id,
                    fullName: seller.fullName,
                    username: seller.username,
                    phone: seller.phone,
                    shopOwner: seller.shopOwner,
                    assignedAt: seller.assignedAt,
                    totalShopOwners: seller.shopOwners.length
                }
            });
        } catch (error) {
            console.error('Assign seller error:', error);
            res.status(500).json({
                success: false,
                message: "Sellerni tayinlashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sellerga xizmat hududlarini belgilash
    setSellerServiceAreas: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { serviceAreas } = req.body;
            const shopOwner = req.shopOwner;

            console.log('=== SET SELLER SERVICE AREAS DEBUG ===');
            console.log('Seller ID:', sellerId);
            console.log('Shop Owner ID:', shopOwner._id);
            console.log('Service Areas received:', JSON.stringify(serviceAreas, null, 2));

            // ID validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri seller ID formati"
                });
            }

            // Sellerni tekshirish
            const seller = await Seller.findById(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Seller topilmadi"
                });
            }

            // Seller bu do'kon egasiga tegishlimi tekshirish
            const isAssignedToThisShopOwner = seller.shopOwners && 
                seller.shopOwners.some(so => so.shopOwner.toString() === shopOwner._id.toString());
            
            const isAssignedToOldWay = seller.shopOwner && 
                seller.shopOwner.toString() === shopOwner._id.toString();
            
            if (!isAssignedToThisShopOwner && !isAssignedToOldWay) {
                return res.status(403).json({
                    success: false,
                    message: "Bu seller sizga tegishli emas"
                });
            }

            // Service areas validatsiyasi
            if (!Array.isArray(serviceAreas)) {
                return res.status(400).json({
                    success: false,
                    message: "Service areas array bo'lishi kerak"
                });
            }

            // Region ID larni tekshirish
            for (const area of serviceAreas) {
                // Frontend format: { regions: [...], districts: [...], mfys: [...] }
                // Backend format: { region: "...", districts: [...], mfys: [...] }
                
                if (area.regions && Array.isArray(area.regions)) {
                    // Frontend format - convert to backend format
                    for (const regionId of area.regions) {
                        if (!mongoose.Types.ObjectId.isValid(regionId)) {
                            return res.status(400).json({
                                success: false,
                                message: "Noto'g'ri region ID formati"
                            });
                        }

                        const region = await Region.findById(regionId);
                        if (!region || region.type !== 'region') {
                            return res.status(400).json({
                                success: false,
                                message: "Region topilmadi yoki noto'g'ri type"
                            });
                        }
                    }
                } else if (area.region) {
                    // Backend format - direct region field
                    if (!mongoose.Types.ObjectId.isValid(area.region)) {
                        return res.status(400).json({
                            success: false,
                            message: "Noto'g'ri region ID formati"
                        });
                    }

                    const region = await Region.findById(area.region);
                    if (!region || region.type !== 'region') {
                        return res.status(400).json({
                            success: false,
                            message: "Region topilmadi yoki noto'g'ri type"
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Region ID talab qilinadi"
                    });
                }

                // Districts tekshirish
                if (area.districts && Array.isArray(area.districts)) {
                    for (const districtId of area.districts) {
                        if (!mongoose.Types.ObjectId.isValid(districtId)) {
                            return res.status(400).json({
                                success: false,
                                message: "Noto'g'ri district ID formati"
                            });
                        }
                        const district = await Region.findById(districtId);
                        if (!district || district.type !== 'district') {
                            return res.status(400).json({
                                success: false,
                                message: "District topilmadi yoki noto'g'ri type"
                            });
                        }
                    }
                }

                // MFYs tekshirish
                if (area.mfys && Array.isArray(area.mfys)) {
                    for (const mfyId of area.mfys) {
                        if (!mongoose.Types.ObjectId.isValid(mfyId)) {
                            return res.status(400).json({
                                success: false,
                                message: "Noto'g'ri MFY ID formati"
                            });
                        }
                        const mfy = await Region.findById(mfyId);
                        if (!mfy || mfy.type !== 'mfy') {
                            return res.status(400).json({
                                success: false,
                                message: "MFY topilmadi yoki noto'g'ri type"
                            });
                        }
                    }
                }
            }

            // Service areas ni belgilash
            console.log('Is assigned to this shop owner (new way):', isAssignedToThisShopOwner);
            console.log('Is assigned to this shop owner (old way):', isAssignedToOldWay);
            
            // Transform frontend format to database format
            const transformedServiceAreas = [];
            for (const area of serviceAreas) {
                if (area.regions && Array.isArray(area.regions)) {
                    // Frontend format: { regions: [...], districts: [...], mfys: [...] }
                    // Convert to database format: separate service area for each region
                    for (const regionId of area.regions) {
                        transformedServiceAreas.push({
                            region: regionId,
                            districts: area.districts || [],
                            mfys: area.mfys || []
                        });
                    }
                } else if (area.region) {
                    // Already in database format
                    transformedServiceAreas.push({
                        region: area.region,
                        districts: area.districts || [],
                        mfys: area.mfys || []
                    });
                }
            }
            
            console.log('Transformed service areas:', JSON.stringify(transformedServiceAreas, null, 2));
            
            if (isAssignedToThisShopOwner) {
                const shopOwnerIndex = seller.shopOwners.findIndex(so => 
                    so.shopOwner.toString() === shopOwner._id.toString()
                );
                console.log('Shop owner index:', shopOwnerIndex);
                if (shopOwnerIndex !== -1) {
                    seller.shopOwners[shopOwnerIndex].serviceAreas = transformedServiceAreas;
                    console.log('Set service areas in shopOwners array');
                }
                    } else {
                seller.serviceAreas = transformedServiceAreas;
                console.log('Set service areas in main serviceAreas field');
            }
            
            console.log('Seller before save:', {
                serviceAreas: seller.serviceAreas,
                shopOwners: seller.shopOwners?.map(so => ({
                    shopOwner: so.shopOwner,
                    serviceAreas: so.serviceAreas
                }))
            });
            
            await seller.save();

            // Yangilangan sellerni qaytarish
            const updatedSeller = await Seller.findById(sellerId)
                .populate('serviceAreas.region', 'name')
                .populate('serviceAreas.districts', 'name')
                .populate('serviceAreas.mfys', 'name')
                .populate('shopOwners.shopOwner', 'name username phone')
                .populate('shopOwners.serviceAreas.region', 'name')
                .populate('shopOwners.serviceAreas.districts', 'name')
                .populate('shopOwners.serviceAreas.mfys', 'name');

            res.json({
                success: true,
                message: "Xizmat hududlari muvaffaqiyatli belgilandi",
                seller: {
                    id: updatedSeller._id,
                    fullName: updatedSeller.fullName,
                    username: updatedSeller.username,
                    phone: updatedSeller.phone,
                    serviceAreas: updatedSeller.serviceAreas,
                    shopOwners: updatedSeller.shopOwners
                }
            });
        } catch (error) {
            console.error('Set seller service areas error:', error);
            res.status(500).json({
                success: false,
                message: "Xizmat hududlarini belgilashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Sellerni olib tashlash
    removeSeller: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const shopOwner = req.shopOwner;

            // ID validatsiyasi
            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                        return res.status(400).json({
                            success: false,
                    message: "Noto'g'ri seller ID formati"
                });
            }

            // Sellerni tekshirish
            const seller = await Seller.findById(sellerId);
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    message: "Seller topilmadi"
                });
            }

            // Seller bu do'kon egasiga tegishlimi tekshirish
            const isAssignedToThisShopOwner = seller.shopOwners && 
                seller.shopOwners.some(so => so.shopOwner.toString() === shopOwner._id.toString());
            
            const isAssignedToOldWay = seller.shopOwner && 
                seller.shopOwner.toString() === shopOwner._id.toString();

            if (!isAssignedToThisShopOwner && !isAssignedToOldWay) {
                return res.status(403).json({
                    success: false,
                    message: "Bu seller sizga tegishli emas"
                });
            }

            // Yangi usul: shopOwners array'idan olib tashlash
            if (isAssignedToThisShopOwner) {
                seller.shopOwners = seller.shopOwners.filter(so => 
                    so.shopOwner.toString() !== shopOwner._id.toString()
                );
            }

            // Eski usul: shopOwner field'larini null qilish
            if (isAssignedToOldWay) {
                seller.shopOwner = null;
                seller.assignedBy = null;
                seller.assignedAt = null;
                seller.serviceAreas = [];
            }

            await seller.save();
            
            res.json({
                success: true,
                message: "Seller muvaffaqiyatli olib tashlandi"
            });
        } catch (error) {
            console.error('Remove seller error:', error);
            res.status(500).json({
                success: false,
                message: "Sellerni olib tashlashda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Shop owner uchun buyurtmalarni olish
    getOrders: async (req, res) => {
        try {
            const shopOwner = req.shopOwner;
            const { 
                page = 1, 
                limit = 10,
                status,
                paymentStatus
            } = req.query;

            console.log('=== GET ORDERS DEBUG ===');
            console.log('Shop Owner ID:', shopOwner._id);
            console.log('Query params:', { page, limit, status, paymentStatus });

            // Shop owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Query yaratish - shop owner ning do'konidagi mahsulotlar bilan bog'liq buyurtmalar
            const shopProducts = await Product.find({ shop: shop._id }).distinct('_id');
            console.log('Shop products count:', shopProducts.length);
            console.log('Shop products:', shopProducts);
            
            const query = {
                'items.product': { $in: shopProducts }
            };
            
            if (status) query.status = status;
            if (paymentStatus) query.paymentStatus = paymentStatus;
            
            console.log('Final query:', JSON.stringify(query, null, 2));

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Buyurtmalarni olish
            const orders = await Order.find(query)
                .populate({
                    path: 'items.product',
                    select: 'name price originalPrice quantity unit unitSize shop',
                    populate: {
                        path: 'shop',
                        select: 'name address phone'
                    }
                })
                .populate('user', 'firstName lastName phoneNumber')
                .populate('deliveryAddress')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Jami buyurtmalar soni
            const total = await Order.countDocuments(query);
            
            console.log('Orders found:', orders.length);
            console.log('Total orders:', total);
            console.log('Orders:', orders.map(o => ({ id: o._id, orderNumber: o.orderNumber, user: o.user?.fullName })));

            res.json({
                success: true,
                count: orders.length,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
                orders: orders.map(order => ({
                    id: order._id,
                    orderNumber: order.orderNumber,
                    user: {
                        id: order.user._id,
                        fullName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown User',
                        phone: order.user?.phoneNumber || 'Unknown Phone'
                    },
                    items: order.items.map(item => ({
                        id: item._id,
                        product: {
                            id: item.product._id,
                            name: item.product.name,
                            price: item.product.price,
                            originalPrice: item.product.originalPrice,
                            unit: item.product.unit,
                            unitSize: item.product.unitSize,
                            shop: item.product.shop
                        },
                        quantity: item.quantity,
                        price: item.price
                    })),
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    deliveryAddress: order.deliveryAddress,
                    deliveryNotes: order.deliveryNotes,
                    estimatedDelivery: order.estimatedDelivery,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                }))
            });

        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmalarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    // Bitta buyurtmani olish
    getOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            const shopOwner = req.shopOwner;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri buyurtma ID formati"
                });
            }

            // Shop owner ning do'konini topish
            const shop = await Shop.findOne({ owner: shopOwner._id, status: 'active' });
            if (!shop) {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon topilmadi yoki faol emas"
                });
            }

            // Shop owner ning do'konidagi mahsulotlar bilan bog'liq buyurtmani topish
            const shopProducts = await Product.find({ shop: shop._id }).distinct('_id');
            
            const order = await Order.findOne({ 
                _id: orderId,
                'items.product': { $in: shopProducts }
            })
            .populate({
                path: 'items.product',
                select: 'name image category subcategory unit unitSize shop',
                populate: [
                    { path: 'category', select: 'name' },
                    { path: 'subcategory', select: 'name' },
                    { path: 'shop', select: 'name address phone' }
                ]
            })
            .populate('user', 'firstName lastName phoneNumber')
            .populate('deliveryAddress');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Buyurtma topilmadi yoki sizning do'koningizga tegishli emas"
                });
            }

            const formattedOrder = {
                id: order._id,
                orderNumber: order.orderNumber,
                user: {
                    id: order.user._id,
                    fullName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown User',
                    phone: order.user?.phoneNumber || 'Unknown Phone'
                },
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
            console.error('Get order by ID error:', error);
            res.status(500).json({
                success: false,
                message: "Buyurtmani olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },
    // Interest rates for calculation
    getActiveInterestRates: async (req, res) => {
        try {
            const rates = await InterestRate.getAllActiveRates();

            res.json({
                success: true,
                count: rates.length,
                interestRates: rates.map(rate => ({
                    id: rate._id,
                    duration: rate.duration,
                    interestRate: rate.interestRate,
                    isActive: rate.isActive
                }))
            });
        } catch (error) {
            console.error('Get active interest rates error:', error);
            res.status(500).json({
                success: false,
                message: "Faol foiz stavkalarini olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },
    // Shop Owner Notifications
    getShopOwnerNotifications,
    markShopOwnerNotificationAsRead,
    getShopOwnerUnreadNotificationCount,
    // Seller Notifications
    getSellerNotifications,
    markSellerNotificationAsRead,
    getSellerUnreadNotificationCount,
    // Region functions for seller mobile
    getRegions: async (req, res) => {
        try {
            const regions = await Region.find({ 
                type: 'region', 
                status: 'active' 
            }).select('name code').sort({ name: 1 });

            res.json({
                success: true,
                data: regions
            });

        } catch (error) {
            console.error('Get regions error:', error);
            res.status(500).json({
                success: false,
                message: "Hududlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getDistricts: async (req, res) => {
        try {
            const { regionId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(regionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri hudud ID"
                });
            }

            const districts = await Region.find({ 
                type: 'district', 
                parent: regionId,
                status: 'active' 
            }).select('name code').sort({ name: 1 });

            res.json({
                success: true,
                data: districts
            });

        } catch (error) {
            console.error('Get districts error:', error);
            res.status(500).json({
                success: false,
                message: "Tumanlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    },

    getMfys: async (req, res) => {
        try {
            const { districtId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(districtId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri tuman ID"
                });
            }

            const mfys = await Region.find({ 
                type: 'mfy', 
                parent: districtId,
                status: 'active' 
            }).select('name code').sort({ name: 1 });

            res.json({
                success: true,
                data: mfys
            });

        } catch (error) {
            console.error('Get MFYs error:', error);
            res.status(500).json({
                success: false,
                message: "MFYlarni olishda xatolik yuz berdi",
                error: error.message
            });
        }
    }
};
