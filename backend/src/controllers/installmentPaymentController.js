const InstallmentPayment = require('../models/InstallmentPayment');
const DraftOrder = require('../models/DraftOrder');
const OrderHistory = require('../models/OrderHistory');
const Product = require('../models/Product');

// Create installment payment order
const createInstallmentOrder = async (req, res) => {
    try {
        console.log('=== INSTALLMENT CREATE REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.seller ? req.seller._id : 'No seller found');
        console.log('================================');
        
        const { 
            products, 
            customer, 
            installmentDuration,
            startDate 
        } = req.body;

        const seller = req.seller;
        
        // Get shop owner from seller's shop
        const Shop = require('../models/Shop');
        const shop = await Shop.findById(seller.shop).populate('owner');
        if (!shop || !shop.owner) {
            return res.status(400).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }
        const storeOwner = shop.owner;

        // Validate required fields
        console.log('Validating products:', products);
        if (!products || !Array.isArray(products) || products.length === 0) {
            console.log('Products validation failed');
            return res.status(400).json({
                success: false,
                message: "Mahsulotlar kiritilishi shart"
            });
        }

        console.log('Validating customer:', customer);
        if (!customer || !customer.fullName || !customer.birthDate || 
            !customer.passportSeries || !customer.primaryPhone) {
            console.log('Customer validation failed');
            console.log('Missing fields:', {
                hasCustomer: !!customer,
                hasFullName: !!(customer && customer.fullName),
                hasBirthDate: !!(customer && customer.birthDate),
                hasPassportSeries: !!(customer && customer.passportSeries),
                hasPrimaryPhone: !!(customer && customer.primaryPhone),
                hasImage: !!(customer && customer.image)
            });
            return res.status(400).json({
                success: false,
                message: "Mijoz ma'lumotlari to'liq kiritilmagan"
            });
        }

        console.log('Validating installmentDuration:', installmentDuration);
        if (!installmentDuration || ![2, 3, 4, 5, 6, 10, 12].includes(installmentDuration)) {
            console.log('Installment duration validation failed');
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri muddatli to'lov muddati"
            });
        }

        console.log('Validating startDate:', startDate);
        if (!startDate) {
            console.log('Start date validation failed');
            return res.status(400).json({
                success: false,
                message: "Muddatli to'lov boshlanish sanasi kiritilishi shart"
            });
        }

        // Validate start date format and ensure it's not in the past
        const startDateObj = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
        
        if (isNaN(startDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sana formati"
            });
        }

        if (startDateObj < today) {
            return res.status(400).json({
                success: false,
                message: "Boshlanish sanasi bugundan oldin bo'lishi mumkin emas"
            });
        }

        // Calculate total sum
        let totalSum = 0;
        const validatedProducts = [];

        for (const product of products) {
            const dbProduct = await Product.findById(product.productId);
            if (!dbProduct) {
                return res.status(404).json({
                    success: false,
                    message: `Mahsulot topilmadi: ${product.name}`
                });
            }

            if (dbProduct.quantity < product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Mahsulot yetarli emas: ${product.name}. Mavjud: ${dbProduct.quantity}`
                });
            }

            const productTotal = parseFloat(product.price) * parseFloat(product.quantity);
            totalSum += productTotal;

            validatedProducts.push({
                productId: product.productId,
                name: product.name,
                quantity: product.quantity,
                price: product.price,
                unit: product.unit,
                unitSize: product.unitSize
            });
        }

        // Generate order ID
        const lastOrder = await InstallmentPayment.findOne({}, {}, { sort: { 'orderId': -1 } });
        const orderId = lastOrder ? lastOrder.orderId + 1 : 1001;

        // Handle image upload
        let imagePath = null;
        if (req.file) {
            // Save uploaded file
            const fileName = `customer-${Date.now()}-${req.file.originalname}`;
            const uploadPath = `uploads/customers/${fileName}`;
            
            // Create directory if not exists
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/customers');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Move file to uploads directory
            fs.renameSync(req.file.path, path.join(__dirname, '../../', uploadPath));
            imagePath = uploadPath;
        }

        // Create installment payment
        const installmentPayment = new InstallmentPayment({
            orderId,
            seller: seller._id,
            storeOwner: storeOwner._id,
            products: validatedProducts,
            totalSum,
            customer: {
                fullName: customer.fullName,
                birthDate: new Date(customer.birthDate),
                passportSeries: customer.passportSeries.toUpperCase(),
                primaryPhone: customer.primaryPhone,
                secondaryPhone: customer.secondaryPhone || null,
                ...(imagePath && { image: imagePath })
            },
            installment: {
                duration: installmentDuration,
                startDate: startDateObj,
                endDate: new Date(startDateObj.getTime() + installmentDuration * 30 * 24 * 60 * 60 * 1000),
                monthlyPayment: Math.ceil(totalSum / installmentDuration)
            }
        });

        await installmentPayment.save();

        // Update product quantities
        for (const product of validatedProducts) {
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { quantity: -parseFloat(product.quantity) }
            });
        }

        res.status(201).json({
            success: true,
            message: "Muddatli to'lov buyurtmasi muvaffaqiyatli yaratildi",
            installmentPayment: {
                orderId: installmentPayment.orderId,
                totalSum: installmentPayment.totalSum,
                customer: installmentPayment.customer,
                installment: installmentPayment.installment,
                status: installmentPayment.status,
                payments: installmentPayment.payments
            }
        });

    } catch (error) {
        console.error('Installment order creation error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lov buyurtmasi yaratishda xatolik",
            error: error.message
        });
    }
};

// Get all installment payments for a seller
const getSellerInstallments = async (req, res) => {
    try {
        const seller = req.seller;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { seller: seller._id };
        if (status && ['active', 'completed', 'overdue', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const installments = await InstallmentPayment.find(filter)
            .populate('customer', 'fullName primaryPhone')
            .populate('products.productId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await InstallmentPayment.countDocuments(filter);

        res.json({
            success: true,
            installments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get seller installments error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovlarni olishda xatolik",
            error: error.message
        });
    }
};

// Get installment payment by ID
const getInstallmentById = async (req, res) => {
    try {
        const { installmentId } = req.params;
        const seller = req.seller;

        const installment = await InstallmentPayment.findOne({
            _id: installmentId,
            seller: seller._id
        }).populate('products.productId', 'name image');

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Muddatli to'lov topilmadi"
            });
        }

        res.json({
            success: true,
            installment
        });

    } catch (error) {
        console.error('Get installment by ID error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovni olishda xatolik",
            error: error.message
        });
    }
};

// Record a payment for an installment
const recordPayment = async (req, res) => {
    try {
        const { installmentId } = req.params;
        const { month, amount } = req.body;
        const seller = req.seller;

        const installment = await InstallmentPayment.findOne({
            _id: installmentId,
            seller: seller._id
        });

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Muddatli to'lov topilmadi"
            });
        }

        if (installment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Bekor qilingan muddatli to'lov uchun to'lov qabul qilinmaydi"
            });
        }

        const success = installment.recordPayment(month, amount);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: "To'lovni qayd etishda xatolik. Oylik to'lov mavjud emas yoki allaqachon to'langan"
            });
        }

        await installment.save();

        res.json({
            success: true,
            message: "To'lov muvaffaqiyatli qayd etildi",
            installment: {
                status: installment.status,
                payments: installment.payments
            }
        });

    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({
            success: false,
            message: "To'lovni qayd etishda xatolik",
            error: error.message
        });
    }
};

// Cancel installment payment
const cancelInstallment = async (req, res) => {
    try {
        const { installmentId } = req.params;
        const { reason } = req.body;
        const seller = req.seller;

        const installment = await InstallmentPayment.findOne({
            _id: installmentId,
            seller: seller._id
        });

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Muddatli to'lov topilmadi"
            });
        }

        if (installment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Muddatli to'lov allaqachon bekor qilingan"
            });
        }

        if (installment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: "To'liq to'langan muddatli to'lovni bekor qilib bo'lmaydi"
            });
        }

        installment.status = 'cancelled';
        installment.cancelledAt = new Date();
        installment.cancelledBy = seller._id;
        installment.cancelReason = reason;

        // Return products to inventory
        for (const product of installment.products) {
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { quantity: parseFloat(product.quantity) }
            });
        }

        await installment.save();

        res.json({
            success: true,
            message: "Muddatli to'lov muvaffaqiyatli bekor qilindi",
            installment: {
                status: installment.status,
                cancelledAt: installment.cancelledAt,
                cancelReason: installment.cancelReason
            }
        });

    } catch (error) {
        console.error('Cancel installment error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovni bekor qilishda xatolik",
            error: error.message
        });
    }
};

// Get installment statistics for seller
const getInstallmentStats = async (req, res) => {
    try {
        const seller = req.seller;

        const stats = await InstallmentPayment.aggregate([
            { $match: { seller: seller._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalSum' }
                }
            }
        ]);

        const totalInstallments = await InstallmentPayment.countDocuments({ seller: seller._id });
        const activeInstallments = await InstallmentPayment.countDocuments({ 
            seller: seller._id, 
            status: 'active' 
        });
        const overdueInstallments = await InstallmentPayment.countDocuments({ 
            seller: seller._id, 
            status: 'overdue' 
        });

        res.json({
            success: true,
            stats: {
                total: totalInstallments,
                active: activeInstallments,
                overdue: overdueInstallments,
                breakdown: stats
            }
        });

    } catch (error) {
        console.error('Get installment stats error:', error);
        res.status(500).json({
            success: false,
            message: "Statistikani olishda xatolik",
            error: error.message
        });
    }
};

module.exports = {
    createInstallmentOrder,
    getSellerInstallments,
    getInstallmentById,
    recordPayment,
    cancelInstallment,
    getInstallmentStats
};
