const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: String,
    restaurantId: String,
    items: Array,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

// Order Model
const Order = mongoose.model('Order', orderSchema);

// Get order status by ID
router.get('/api/order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            res.json(order);
        } else {
            res.status(404).send('Order not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching order status');
    }
});

module.exports = router;
