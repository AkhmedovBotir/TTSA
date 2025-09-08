const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Agent = require('../models/Agent');
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

module.exports = {
    getDashboardStatistics
};

module.exports = {
    getDashboardStatistics
};
