const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
    name: String,
    cuisine: String,
    location: String,
    rating: Number,
    image: String
});

// Restaurant Model
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Get all restaurants
router.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (error) {
        res.status(500).send('Error fetching restaurants');
    }
});

module.exports = router;
