const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Agent = require('../models/Agent');
const Seller = require('../models/Seller');
const AgentProduct = require('../models/AgentProduct');

// Check if Order model exists
let Order;
try {
    Order = require('../models/Order');
} catch (error) {
    console.log('Order model not found, order-related statistics will be skipped');
}

const getDashboardStatistics = async (req, res) => {
    try {
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: req.shopOwner._id, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }
        const shopId = shop._id;
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // 1. Product Statistics
        const [
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalAgents,
            totalSellers,
            activeAgents,
            totalAssignedProducts,
            totalSoldByAgents,
            totalReturnedProducts,
            todaySales,
            monthlySales,
            yearlySales,
            topSellingProducts,
            agentPerformance
        ] = await Promise.all([
            // Total products count
            Product.countDocuments({ shop: shopId }),
            
            // Low stock products (less than 10 in stock)
            Product.countDocuments({ 
                shop: shopId,
                quantity: { $gt: 0, $lt: 10 }
            }),
            
            // Out of stock products
            Product.countDocuments({ 
                shop: shopId,
                quantity: { $lte: 0 }
            }),
            
            // Total agents
            Agent.countDocuments({ shop: shopId }),
            
            // Total sellers assigned to this shop owner
            Seller.countDocuments({
                $or: [
                    { shopOwner: req.shopOwner._id },
                    { 'shopOwners.shopOwner': req.shopOwner._id }
                ]
            }),
            
            // Active agents (with assigned products)
            AgentProduct.distinct('agent', { 
                'product': { $in: await Product.find({ shop: shopId }).distinct('_id') },
                'status': 'assigned'
            }),
            
            // Total products assigned to agents
            AgentProduct.aggregate([
                { 
                    $match: { 
                        'product': { $in: await Product.find({ shop: shopId }).distinct('_id') },
                        'status': 'assigned' 
                    } 
                },
                { $group: { _id: null, total: { $sum: '$assignedQuantity' } } }
            ]),
            
            // Total products sold by agents
            AgentProduct.aggregate([
                { 
                    $match: { 
                        'product': { $in: await Product.find({ shop: shopId }).distinct('_id') },
                        'status': 'sold' 
                    } 
                },
                { $group: { _id: null, total: { $sum: '$assignedQuantity' } } }
            ]),
            
            // Total returned products
            AgentProduct.aggregate([
                { 
                    $match: { 
                        'product': { $in: await Product.find({ shop: shopId }).distinct('_id') },
                        'status': 'returned' 
                    } 
                },
                { $group: { _id: null, total: { $sum: '$assignedQuantity' } } }
            ]),
            
            // Today's sales
            Order ? Order.aggregate([
                { 
                    $match: { 
                        shop: shopId,
                        status: 'completed',
                        createdAt: { $gte: startOfDay }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]) : Promise.resolve([{ total: 0, count: 0 }]),
            
            // Monthly sales
            Order ? Order.aggregate([
                { 
                    $match: { 
                        shop: shopId,
                        status: 'completed',
                        createdAt: { $gte: startOfMonth }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]) : Promise.resolve([{ total: 0, count: 0 }]),
            
            // Yearly sales
            Order ? Order.aggregate([
                { 
                    $match: { 
                        shop: shopId,
                        status: 'completed',
                        createdAt: { $gte: startOfYear }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]) : Promise.resolve([{ total: 0, count: 0 }]),
            
            // Top selling products (last 30 days)
            Order ? Order.aggregate([
                { 
                    $match: { 
                        shop: shopId,
                        status: 'completed',
                        createdAt: { $gte: new Date(new Date().setDate(today.getDate() - 30)) }
                    } 
                },
                { $unwind: '$items' },
                { 
                    $group: { 
                        _id: '$items.product',
                        name: { $first: '$items.name' },
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                    } 
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ]) : Promise.resolve([]),
            
            // Agent performance (top 5)
            AgentProduct.aggregate([
                { 
                    $match: { 
                        'product': { $in: await Product.find({ shop: shopId }).distinct('_id') },
                        'status': { $in: ['sold', 'assigned'] } 
                    } 
                },
                {
                    $group: {
                        _id: '$agent',
                        agentName: { $first: '$agentName' },
                        totalAssigned: { $sum: '$assignedQuantity' },
                        totalSold: { 
                            $sum: { 
                                $cond: [
                                    { $eq: ['$status', 'sold'] }, 
                                    '$assignedQuantity', 
                                    0 
                                ] 
                            } 
                        }
                    }
                },
                { 
                    $project: {
                        agentName: 1,
                        totalAssigned: 1,
                        totalSold: 1,
                        salesPercentage: { 
                            $multiply: [
                                { $divide: ['$totalSold', { $ifNull: ['$totalAssigned', 1] }] },
                                100
                            ]
                        }
                    }
                },
                { $sort: { salesPercentage: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.json({
            success: true,
            data: {
                // Product Statistics
                products: {
                    total: totalProducts,
                    lowStock: lowStockProducts,
                    outOfStock: outOfStockProducts,
                    inStock: totalProducts - outOfStockProducts
                },
                
                // Agent Statistics
                agents: {
                    total: totalAgents,
                    active: activeAgents.length,
                    totalAssigned: totalAssignedProducts[0]?.total || 0,
                    totalSold: totalSoldByAgents[0]?.total || 0,
                    totalReturned: totalReturnedProducts[0]?.total || 0
                },
                
                // Seller Statistics
                sellers: {
                    total: totalSellers,
                    active: totalSellers, // All assigned sellers are considered active
                    withServiceAreas: 0 // Will be calculated separately
                },
                
                // Sales Statistics
                sales: {
                    today: {
                        amount: todaySales[0]?.total || 0,
                        orders: todaySales[0]?.count || 0
                    },
                    monthly: {
                        amount: monthlySales[0]?.total || 0,
                        orders: monthlySales[0]?.count || 0
                    },
                    yearly: {
                        amount: yearlySales[0]?.total || 0,
                        orders: yearlySales[0]?.count || 0
                    }
                },
                
                // Top Performers
                topSellingProducts: topSellingProducts.map(item => ({
                    productId: item._id,
                    name: item.name,
                    totalSold: item.totalSold,
                    totalRevenue: item.totalRevenue
                })),
                
                agentPerformance: agentPerformance.map(agent => ({
                    agentId: agent._id,
                    name: agent.agentName,
                    totalAssigned: agent.totalAssigned,
                    totalSold: agent.totalSold,
                    salesPercentage: Math.min(100, Math.round(agent.salesPercentage || 0))
                }))
            }
        });
    } catch (error) {
        console.error('Error getting dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

// Shop Owner uchun sellerlar statistikasi
const getSellerStatistics = async (req, res) => {
    try {
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Bu do'kon egasiga tayinlangan sellerlarni olish
        const sellers = await Seller.find({
            $or: [
                { shopOwner: currentUserId },
                { 'shopOwners.shopOwner': currentUserId }
            ]
        })
        .populate('serviceAreas.region', 'name')
        .populate('serviceAreas.districts', 'name')
        .populate('serviceAreas.mfys', 'name')
        .populate('shopOwners.shopOwner', 'name username phone')
        .populate('shopOwners.serviceAreas.region', 'name')
        .populate('shopOwners.serviceAreas.districts', 'name')
        .populate('shopOwners.serviceAreas.mfys', 'name');

        // Statistika hisoblash
        const totalSellers = sellers.length;
        const sellersWithServiceAreas = sellers.filter(seller => {
            const currentShopOwnerData = seller.shopOwners?.find(so => 
                so.shopOwner.toString() === currentUserId.toString()
            );
            const serviceAreas = currentShopOwnerData?.serviceAreas || seller.serviceAreas || [];
            return serviceAreas.length > 0;
        }).length;

        // Hududlar bo'yicha taqsimlash
        const regionStats = {};
        const districtStats = {};
        const mfyStats = {};

        sellers.forEach(seller => {
            const currentShopOwnerData = seller.shopOwners?.find(so => 
                so.shopOwner.toString() === currentUserId.toString()
            );
            const serviceAreas = currentShopOwnerData?.serviceAreas || seller.serviceAreas || [];

            serviceAreas.forEach(area => {
                // Region statistika
                if (area.region) {
                    const regionName = area.region.name || 'Noma\'lum';
                    regionStats[regionName] = (regionStats[regionName] || 0) + 1;
                }

                // District statistika
                if (area.districts && area.districts.length > 0) {
                    area.districts.forEach(district => {
                        const districtName = district.name || 'Noma\'lum';
                        districtStats[districtName] = (districtStats[districtName] || 0) + 1;
                    });
                }

                // MFY statistika
                if (area.mfys && area.mfys.length > 0) {
                    area.mfys.forEach(mfy => {
                        const mfyName = mfy.name || 'Noma\'lum';
                        mfyStats[mfyName] = (mfyStats[mfyName] || 0) + 1;
                    });
                }
            });
        });

        // Top 5 hududlar
        const topRegions = Object.entries(regionStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topDistricts = Object.entries(districtStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topMfys = Object.entries(mfyStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Sellerlar ro'yxati (batafsil ma'lumotlar bilan)
        const sellerDetails = sellers.map(seller => {
            const currentShopOwnerData = seller.shopOwners?.find(so => 
                so.shopOwner.toString() === currentUserId.toString()
            );
            const serviceAreas = currentShopOwnerData?.serviceAreas || seller.serviceAreas || [];
            
            return {
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                status: seller.status,
                assignedAt: currentShopOwnerData?.assignedAt || seller.assignedAt,
                serviceAreasCount: serviceAreas.length,
                totalRegions: serviceAreas.length,
                totalDistricts: serviceAreas.reduce((sum, area) => sum + (area.districts?.length || 0), 0),
                totalMfys: serviceAreas.reduce((sum, area) => sum + (area.mfys?.length || 0), 0),
                serviceAreas: serviceAreas.map(area => ({
                    region: area.region?.name || 'Noma\'lum',
                    districts: area.districts?.map(d => d.name) || [],
                    mfys: area.mfys?.map(m => m.name) || []
                }))
            };
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalSellers,
                    sellersWithServiceAreas,
                    sellersWithoutServiceAreas: totalSellers - sellersWithServiceAreas,
                    coveragePercentage: totalSellers > 0 ? Math.round((sellersWithServiceAreas / totalSellers) * 100) : 0
                },
                topRegions,
                topDistricts,
                topMfys,
                sellers: sellerDetails
            }
        });
    } catch (error) {
        console.error('Error getting seller statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller statistics',
            error: error.message
        });
    }
};

// Qo'shimcha statistika funksiyalari
const getWarehouseStatistics = async (req, res) => {
    try {
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: currentUserId, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }

        const products = await Product.find({ shop: shop._id });
        
        const warehouseStats = {
            totalProducts: products.length,
            inStock: products.filter(p => p.quantity > 0).length,
            lowStock: products.filter(p => p.quantity > 0 && p.quantity < 10).length,
            outOfStock: products.filter(p => p.quantity <= 0).length,
            totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
            categories: {}
        };

        // Kategoriyalar bo'yicha taqsimlash
        products.forEach(product => {
            const category = product.category?.name || 'Kategoriya yo\'q';
            if (!warehouseStats.categories[category]) {
                warehouseStats.categories[category] = {
                    count: 0,
                    value: 0,
                    lowStock: 0,
                    outOfStock: 0
                };
            }
            warehouseStats.categories[category].count++;
            warehouseStats.categories[category].value += product.price * product.quantity;
            if (product.quantity > 0 && product.quantity < 10) {
                warehouseStats.categories[category].lowStock++;
            }
            if (product.quantity <= 0) {
                warehouseStats.categories[category].outOfStock++;
            }
        });

        res.json({
            success: true,
            data: warehouseStats
        });
    } catch (error) {
        console.error('Error getting warehouse statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching warehouse statistics',
            error: error.message
        });
    }
};

const getSalesStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: currentUserId, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }

        if (!Order) {
            return res.json({
                success: true,
                data: {
                    totalSales: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    dailySales: [],
                    topProducts: []
                }
            });
        }

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const salesData = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$totalAmount' }
                }
            }
        ]);

        const dailySales = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const topProducts = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Get recent orders with user information
        const recentOrders = await Order.find({
            shop: shop._id,
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
        })
        .populate('user', 'firstName lastName phoneNumber')
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({
            success: true,
            data: {
                totalSales: salesData[0]?.totalSales || 0,
                totalOrders: salesData[0]?.totalOrders || 0,
                averageOrderValue: salesData[0]?.averageOrderValue || 0,
                dailySales,
                topProducts,
                recentOrders: recentOrders.map(order => ({
                    id: order._id,
                    orderNumber: order.orderNumber,
                    user: {
                        id: order.user._id,
                        fullName: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown User',
                        phone: order.user?.phoneNumber || 'Unknown Phone'
                    },
                    totalAmount: order.totalAmount,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    createdAt: order.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Error getting sales statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales statistics',
            error: error.message
        });
    }
};

const getDailyStatistics = async (req, res) => {
    try {
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: currentUserId, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        if (!Order) {
            return res.json({
                success: true,
                data: {
                    sales: 0,
                    orders: 0,
                    averageOrderValue: 0,
                    hourlySales: []
                }
            });
        }

        const dailyData = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    averageOrderValue: { $avg: '$totalAmount' }
                }
            }
        ]);

        const hourlySales = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                sales: dailyData[0]?.sales || 0,
                orders: dailyData[0]?.orders || 0,
                averageOrderValue: dailyData[0]?.averageOrderValue || 0,
                hourlySales
            }
        });
    } catch (error) {
        console.error('Error getting daily statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching daily statistics',
            error: error.message
        });
    }
};

const getWeeklyStatistics = async (req, res) => {
    try {
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: currentUserId, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        endOfWeek.setHours(23, 59, 59, 999);

        if (!Order) {
            return res.json({
                success: true,
                data: {
                    sales: 0,
                    orders: 0,
                    dailyBreakdown: []
                }
            });
        }

        const weeklyData = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        const dailyBreakdown = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                sales: weeklyData[0]?.sales || 0,
                orders: weeklyData[0]?.orders || 0,
                dailyBreakdown
            }
        });
    } catch (error) {
        console.error('Error getting weekly statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching weekly statistics',
            error: error.message
        });
    }
};

const getMonthlyStatistics = async (req, res) => {
    try {
        const currentUserId = req.shopOwner?._id || req.user?.id || req.user?._id;
        
        // Shop Owner ning do'konini topish
        const shop = await Shop.findOne({ owner: currentUserId, status: 'active' });
        if (!shop) {
            return res.status(400).json({
                success: false,
                message: "Do'kon topilmadi yoki faol emas"
            });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (!Order) {
            return res.json({
                success: true,
                data: {
                    sales: 0,
                    orders: 0,
                    dailyBreakdown: []
                }
            });
        }

        const monthlyData = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        const dailyBreakdown = await Order.aggregate([
            {
                $match: {
                    shop: shop._id,
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$createdAt' },
                    sales: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                sales: monthlyData[0]?.sales || 0,
                orders: monthlyData[0]?.orders || 0,
                dailyBreakdown
            }
        });
    } catch (error) {
        console.error('Error getting monthly statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly statistics',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStatistics,
    getSellerStatistics,
    getWarehouseStatistics,
    getSalesStatistics,
    getDailyStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics
};
