const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Kategoriya nomi kiritilishi shart"],
        trim: true,
        minlength: [2, "Kategoriya nomi kamida 2 ta belgidan iborat bo'lishi kerak"]
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'createdByModel',
        required: true
    },
    createdByModel: {
        type: String,
        enum: ['Admin', 'ShopOwner'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Subkategoriyalarni olish uchun virtual field
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Slug yaratish (unikal qilish)
categorySchema.pre('save', async function(next) {
    if (this.isModified('name')) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let count = 1;
        // Unikal slug topilmaguncha raqam qo'sh
        while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${count++}`;
        }
        this.slug = slug;
    }
    next();
});

// Kategoriya nomini va parent ID sini unique qilish
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 