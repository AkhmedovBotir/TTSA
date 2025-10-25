const AgentProduct = require('../models/AgentProduct');
const mongoose = require('mongoose');

/**
 * Update agent product quantities when they are added to or removed from a draft order
 * @param {Array} products - Array of product objects with productId, quantity, and agentId
 * @param {Boolean} isAdding - True if adding products, false if removing
 */
const updateAgentProductQuantities = async (products, isAdding = true) => {
    try {
        for (const item of products) {
            const { productId, quantity: requestedQty, agentId } = item;
            
            if (!productId || !agentId) {
                console.warn('Missing required fields in item:', item);
                continue;
            }

            await updateAgentProductQuantity({
                productId,
                agentId,
                changeQuantity: parseFloat(requestedQty) || 0,
                isAdding
            });
        }
    } catch (error) {
        console.error('Error updating agent product quantities:', error);
        throw error;
    }
};

/**
 * Update agent's product assignment
 */
async function updateAgentProductQuantity({ productId, agentId, changeQuantity, isAdding }) {
    console.log('Updating agent product quantity:', { productId, agentId, changeQuantity, isAdding });
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(agentId)) {
        console.error('Invalid ID format:', { productId, agentId });
        throw new Error(`Noto'g'ri ID formati`);
    }

    if (isNaN(changeQuantity) || changeQuantity <= 0) {
        console.error('Noto‘g‘ri miqdor:', changeQuantity);
        throw new Error(`Noto'g'ri miqdor: ${changeQuantity}`);
    }

    // First, check if the productId is actually an AgentProduct _id
    let agentProduct = await AgentProduct.findOne({
        _id: productId,
        agent: agentId
    });

    // If not found, try finding by product field
    if (!agentProduct) {
        console.log('Not found by _id, trying to find by product field');
        agentProduct = await AgentProduct.findOne({
            product: productId,
            agent: agentId,
            status: 'assigned'
        });
    }

    console.log('Found agent product:', agentProduct);

    if (!agentProduct) {
        const errorMsg = `Agent ${agentId} uchun ${productId} mahsuloti topilmadi`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Check if product is assigned
    if (agentProduct.status !== 'assigned') {
        const errorMsg = `Agent ${agentId} uchun ${productId} mahsuloti ${agentProduct.status} holatida`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const currentRemaining = parseFloat(agentProduct.remainingQuantity) || 0;
    
    if (isAdding) {
        // When adding to order, reduce remaining quantity
        if (currentRemaining < changeQuantity) {
            const errorMsg = `Agent ${agentId} da yetarli mahsulot yo'q. Mavjud: ${currentRemaining}, So'ralgan: ${changeQuantity}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        agentProduct.remainingQuantity = currentRemaining - changeQuantity;
    } else {
        // When removing from order, add back the quantity
        agentProduct.remainingQuantity = currentRemaining + changeQuantity;
    }

    // Update status if needed
    if (agentProduct.remainingQuantity <= 0) {
        agentProduct.status = 'sold';
    }

    await agentProduct.save();
    console.log('Successfully updated agent product:', {
        productId,
        agentId,
        newRemaining: agentProduct.remainingQuantity,
        status: agentProduct.status
    });
}

module.exports = {
    updateAgentProductQuantities
};
