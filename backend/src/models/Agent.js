const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\+998[0-9]{9}$/.test(v);
            },
            message: props => `${props.value} - noto'g'ri telefon raqam formati. Format: +998901234567`
        }
    },
    passport: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Parolni hash qilish
agentSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Parolni tekshirish metodi
agentSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent; 