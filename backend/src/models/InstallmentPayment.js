const mongoose = require('mongoose');

const installmentPaymentSchema = new mongoose.Schema({
    orderId: { 
        type: Number, 
        required: true, 
        index: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller', 
        required: true 
    },
    storeOwner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ShopOwner', 
        required: true 
    },
    products: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        name: { 
            type: String, 
            required: true 
        },
        quantity: { 
            type: mongoose.Types.Decimal128, 
            required: true, 
            min: 0.01 
        },
        price: { 
            type: mongoose.Types.Decimal128, 
            required: true, 
            min: 0 
        },
        unit: { 
            type: String, 
            required: true 
        },
        unitSize: { 
            type: Number, 
            required: true 
        }
    }],
    totalSum: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    
    // Customer Information
    customer: {
        fullName: {
            type: String,
            required: [true, "Mijoz to'liq ismi kiritilishi shart"],
            trim: true
        },
        birthDate: {
            type: Date,
            required: [true, "Tug'ilgan sana kiritilishi shart"]
        },
        passportSeries: {
            type: String,
            required: [true, "Pasport seriyasi kiritilishi shart"],
            match: [/^[A-Z]{2}[0-9]{7}$/, "Pasport seriyasi noto'g'ri formatda. Masalan: AA1234567"]
        },
        primaryPhone: {
            type: String,
            required: [true, "Asosiy telefon raqam kiritilishi shart"],
            match: [/^\+998[0-9]{9}$/, "Telefon raqam noto'g'ri formatda. Format: +998901234567"]
        },
        secondaryPhone: {
            type: String,
            match: [/^\+998[0-9]{9}$/, "Telefon raqam noto'g'ri formatda. Format: +998901234567"]
        },
        image: {
            type: String,
            required: false,
            default: null
        }
    },
    
    // Installment Details
    installment: {
        duration: {
            type: Number,
            required: [true, "Muddatli to'lov muddati tanlanishi shart"],
            enum: [2, 3, 4, 5, 6, 10, 12],
            message: "Muddatli to'lov muddati 2, 3, 4, 5, 6, 10 yoki 12 oy bo'lishi mumkin"
        },
        monthlyPayment: {
            type: Number,
            required: true,
            min: 0
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        interestRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        totalWithInterest: {
            type: Number,
            required: true,
            min: 0
        },
        interestAmount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    
    // Payment Status
    status: { 
        type: String, 
        enum: ['active', 'completed', 'overdue', 'cancelled'], 
        default: 'active' 
    },
    
    // Payment History
    payments: [{
        month: {
            type: Number,
            required: true,
            min: 1
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        dueDate: {
            type: Date,
            required: true
        },
        paidAt: {
            type: Date
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'transfer'],
            default: 'cash'
        },
        notes: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending'
        }
    }],
    
    completedAt: { 
        type: Date 
    },
    cancelledAt: { 
        type: Date 
    },
    cancelledBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller' 
    },
    cancelReason: { 
        type: String 
    }
}, { 
    timestamps: true 
});

// Pre-save hook to set startDate and calculate endDate and monthlyPayment
installmentPaymentSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Set start date to current date
            this.installment.startDate = new Date();
            
            // Calculate end date based on duration
            const endDate = new Date(this.installment.startDate);
            endDate.setMonth(endDate.getMonth() + this.installment.duration);
            this.installment.endDate = endDate;
            
            // Get interest rate for this duration
            const InterestRate = require('./InterestRate');
            const interestRateDoc = await InterestRate.getActiveRate(this.installment.duration);
            
            if (interestRateDoc) {
                this.installment.interestRate = interestRateDoc.interestRate;
                
                // Calculate interest amount
                this.installment.interestAmount = Math.round((this.totalSum * this.installment.interestRate) / 100);
                
                // Calculate total with interest
                this.installment.totalWithInterest = this.totalSum + this.installment.interestAmount;
                
                // Calculate monthly payment with interest
                this.installment.monthlyPayment = Math.ceil(this.installment.totalWithInterest / this.installment.duration);
            } else {
                // No interest rate found, use original calculation
                this.installment.interestRate = 0;
                this.installment.interestAmount = 0;
                this.installment.totalWithInterest = this.totalSum;
                this.installment.monthlyPayment = Math.ceil(this.totalSum / this.installment.duration);
            }
            
            // Generate payment schedule
            this.payments = [];
            for (let i = 1; i <= this.installment.duration; i++) {
                const dueDate = new Date(this.installment.startDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                
                this.payments.push({
                    month: i,
                    amount: this.installment.monthlyPayment,
                    dueDate: dueDate,
                    status: 'pending'
                });
            }
            
            // Adjust last payment to account for rounding
            if (this.payments.length > 0) {
                const totalScheduled = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const difference = this.installment.totalWithInterest - totalScheduled;
                if (difference !== 0) {
                    this.payments[this.payments.length - 1].amount += difference;
                }
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Method to check if payment is overdue
installmentPaymentSchema.methods.checkOverdue = function() {
    const now = new Date();
    const overduePayments = this.payments.filter(payment => 
        payment.status === 'pending' && payment.dueDate < now
    );
    
    if (overduePayments.length > 0) {
        this.status = 'overdue';
    } else if (this.payments.every(payment => payment.status === 'paid')) {
        this.status = 'completed';
        this.completedAt = new Date();
    }
    
    return this.status;
};

// Method to record a payment
installmentPaymentSchema.methods.recordPayment = function(month, amount) {
    const payment = this.payments.find(p => p.month === month);
    if (payment && payment.status === 'pending') {
        payment.status = 'paid';
        payment.paidAt = new Date();
        this.checkOverdue();
        return true;
    }
    return false;
};

module.exports = mongoose.model('InstallmentPayment', installmentPaymentSchema);
