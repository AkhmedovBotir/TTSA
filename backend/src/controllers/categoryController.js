const Category = require('../models/Category');
const mongoose = require('mongoose');

// Kategoriya yaratish
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const user = req.admin || req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Avtorizatsiya talab qilinadi" });
        }
        // Kategoriya yaratish
        const category = new Category({
            name,
            parent: null,
            createdBy: user._id,
            createdByModel: user.role === 'shop-owner' ? 'ShopOwner' : 'Admin'
        });
        await category.save();
        // Kategoriya ma'lumotlarini qaytarish
        const populatedCategory = await Category.findById(category._id)
            .populate('createdBy', 'username fullname');
        res.status(201).json({
            success: true,
            message: "Kategoriya muvaffaqiyatli yaratildi",
            category: {
                id: populatedCategory._id,
                name: populatedCategory.name,
                slug: populatedCategory.slug,
                parent: null,
                status: populatedCategory.status,
                createdBy: populatedCategory.createdBy
                  ? {
                      id: populatedCategory.createdBy._id,
                      name: populatedCategory.createdBy.fullname
                    }
                  : null,
                createdAt: populatedCategory.createdAt
            }
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
            message: "Kategoriya yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Subkategoriya yaratish
const createSubcategory = async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const user = req.admin || req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Avtorizatsiya talab qilinadi" });
        }
        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: "Parent kategoriya ID ko'rsatilmagan"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri parent kategoriya ID formati"
            });
        }
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
            return res.status(404).json({
                success: false,
                message: "Parent kategoriya topilmadi"
            });
        }
        if (parentCategory.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Parent kategoriya faol emas"
            });
        }
        const subcategory = new Category({
            name,
            parent: parentId,
            createdBy: user._id,
            createdByModel: user.role === 'shop-owner' ? 'ShopOwner' : 'Admin'
        });
        await subcategory.save();
        const populatedSubcategory = await Category.findById(subcategory._id)
            .populate('parent', 'name')
            .populate('createdBy', 'username fullname');
        res.status(201).json({
            success: true,
            message: "Subkategoriya muvaffaqiyatli yaratildi",
            subcategory: {
                id: populatedSubcategory._id,
                name: populatedSubcategory.name,
                slug: populatedSubcategory.slug,
                parent: populatedSubcategory.parent
                  ? {
                      id: populatedSubcategory.parent._id,
                      name: populatedSubcategory.parent.name
                    }
                  : null,
                status: populatedSubcategory.status,
                createdBy: populatedSubcategory.createdBy
                  ? {
                      id: populatedSubcategory.createdBy._id,
                      name: populatedSubcategory.createdBy.fullname
                    }
                  : null,
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
            message: "Subkategoriya yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Kategoriya ma'lumotlarini o'zgartirish
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
                message: "Kategoriya topilmadi"
            });
        }

        if (category.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu subkategoriya, faqat kategoriyalarni yangilash mumkin"
            });
        }

        if (name) category.name = name;
        await category.save();

        const updatedCategory = await Category.findById(id)
            .populate('createdBy', 'username fullname');

        res.status(200).json({
            success: true,
            message: "Kategoriya muvaffaqiyatli yangilandi",
            category: {
                id: updatedCategory._id,
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                parent: null,
                status: updatedCategory.status,
                createdBy: {
                    id: updatedCategory.createdBy._id,
                    name: updatedCategory.createdBy.fullname
                },
                createdAt: updatedCategory.createdAt
            }
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
            message: "Kategoriyani yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Subkategoriya ma'lumotlarini o'zgartirish
const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri subkategoriya ID formati"
            });
        }

        const subcategory = await Category.findById(id);
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subkategoriya topilmadi"
            });
        }

        if (!subcategory.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu kategoriya, faqat subkategoriyalarni yangilash mumkin"
            });
        }

        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri parent kategoriya ID formati"
                });
            }

            if (id === parentId) {
                return res.status(400).json({
                    success: false,
                    message: "Subkategoriya o'zini o'ziga parent qilib qo'yish mumkin emas"
                });
            }

            const parentCategory = await Category.findById(parentId);
            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Parent kategoriya topilmadi"
                });
            }

            if (parentCategory.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: "Parent kategoriya faol emas"
                });
            }

            let currentParent = await Category.findById(parentId);
            while (currentParent && currentParent.parent) {
                if (currentParent.parent.toString() === id) {
                    return res.status(400).json({
                        success: false,
                        message: "Circular dependency yaratish mumkin emas"
                    });
                }
                currentParent = await Category.findById(currentParent.parent);
            }

            subcategory.parent = parentId;
        }

        if (name) subcategory.name = name;
        await subcategory.save();

        const updatedSubcategory = await Category.findById(id)
            .populate('parent', 'name')
            .populate('createdBy', 'username fullname');

        res.status(200).json({
            success: true,
            message: "Subkategoriya muvaffaqiyatli yangilandi",
            subcategory: {
                id: updatedSubcategory._id,
                name: updatedSubcategory.name,
                slug: updatedSubcategory.slug,
                parent: {
                    id: updatedSubcategory.parent._id,
                    name: updatedSubcategory.parent.name
                },
                status: updatedSubcategory.status,
                createdBy: {
                    id: updatedSubcategory.createdBy._id,
                    name: updatedSubcategory.createdBy.fullname
                },
                createdAt: updatedSubcategory.createdAt
            }
        });

    } catch (error) {
        console.error('Update subcategory error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Bu nomdagi subkategoriya allaqachon mavjud"
            });
        }

        res.status(500).json({
            success: false,
            message: "Subkategoriyani yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Kategoriya statusini o'zgartirish
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
                message: "Kategoriya topilmadi"
            });
        }

        if (status === 'inactive') {
            await Category.updateMany(
                { parent: id },
                { status: 'inactive' }
            );
        }

        category.status = status;
        await category.save();

        res.status(200).json({
            success: true,
            message: "Kategoriya statusi muvaffaqiyatli o'zgartirildi",
            category: {
                id: category._id,
                name: category.name,
                status: category.status
            }
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

// Kategoriyani o'chirish
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
                message: "Kategoriya topilmadi"
            });
        }
        if (category.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu subkategoriya, faqat kategoriyalarni o'chirish mumkin"
            });
        }
        // Avval barcha subkategoriyalarni o'chirish
        await Category.deleteMany({ parent: id });
        // Kategoriyani o'chirish
        await category.deleteOne();
        res.status(200).json({
            success: true,
            message: "Kategoriya va unga tegishli barcha subkategoriyalar muvaffaqiyatli o'chirildi"
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

// Subkategoriyani o'chirish
const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri subkategoriya ID formati"
            });
        }

        const subcategory = await Category.findById(id);
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subkategoriya topilmadi"
            });
        }

        if (!subcategory.parent) {
            return res.status(400).json({
                success: false,
                message: "Bu kategoriya, faqat subkategoriyalarni o'chirish mumkin"
            });
        }

        await subcategory.deleteOne();

        res.status(200).json({
            success: true,
            message: "Subkategoriya muvaffaqiyatli o'chirildi"
        });

    } catch (error) {
        console.error('Delete subcategory error:', error);
        res.status(500).json({
            success: false,
            message: "Subkategoriyani o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Kategoriyalar ro'yxatini olish
const getAllCategories = async (req, res) => {
    try {
        const { status } = req.query;

        let query = { parent: null };

        if (status && ['active', 'inactive'].includes(status)) {
            query.status = status;
        }

        const categories = await Category.find(query)
            .populate('createdBy', 'username fullname')
            .sort({ createdAt: -1 });

        const populatedCategories = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await Category.find({ parent: category._id })
                    .populate('createdBy', 'username fullname')
                    .sort({ createdAt: -1 });

                return {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    parent: null,
                    status: category.status,
                    createdBy: category.createdBy
                      ? {
                          id: category.createdBy._id,
                          name: category.createdBy.fullname
                        }
                      : null,
                    subcategories: subcategories.map(sub => ({
                        id: sub._id,
                        name: sub.name,
                        slug: sub.slug,
                        status: sub.status,
                        createdBy: sub.createdBy
                          ? {
                              id: sub.createdBy._id,
                              name: sub.createdBy.fullname
                            }
                          : null,
                        createdAt: sub.createdAt
                    })),
                    createdAt: category.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            count: categories.length,
            categories: populatedCategories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: "Kategoriyalar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Subkategoriyalar ro'yxatini olish
const getAllSubcategories = async (req, res) => {
    try {
        const { status, parentId } = req.query;

        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: "Parent kategoriya ID ko'rsatilmagan"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri parent kategoriya ID formati"
            });
        }

        let query = { parent: parentId };

        if (status && ['active', 'inactive'].includes(status)) {
            query.status = status;
        }

        const subcategories = await Category.find(query)
            .populate('parent', 'name')
            .populate('createdBy', 'username fullname')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: subcategories.length,
            subcategories: subcategories.map(sub => ({
                id: sub._id,
                name: sub.name,
                slug: sub.slug,
                parent: {
                    id: sub.parent._id,
                    name: sub.parent.name
                },
                status: sub.status,
                createdBy: {
                    id: sub.createdBy._id,
                    name: sub.createdBy.fullname
                },
                createdAt: sub.createdAt
            }))
        });

    } catch (error) {
        console.error('Get subcategories error:', error);
        res.status(500).json({
            success: false,
            message: "Subkategoriyalar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    createSubcategory,
    updateCategory,
    updateSubcategory,
    updateCategoryStatus,
    deleteCategory,
    deleteSubcategory,
    getAllCategories,
    getAllSubcategories
}; 