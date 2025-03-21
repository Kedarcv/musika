// Restaurant API endpoints

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const Driver = require('../models/Driver');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/restaurants');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Get restaurant dashboard stats
router.get('/stats', auth, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get today's orders
        const todayOrders = await Order.find({
            restaurant: restaurantId,
            createdAt: { $gte: today, $lt: tomorrow }
        });
        
        // Calculate today's revenue
        const todayRevenue = todayOrders.reduce((total, order) => total + order.total, 0);
        
        // Get pending orders
        const pendingOrders = await Order.find({
            restaurant: restaurantId,
            status: 'pending'
        });
        
        // Get average rating
        const restaurant = await Restaurant.findById(restaurantId);
        const averageRating = restaurant.rating || 0;
        
        // Get recent orders
        const recentOrders = await Order.find({ restaurant: restaurantId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name');
        
        // Get monthly revenue data for chart
        const monthlyRevenueData = await getMonthlyRevenueData(restaurantId);
        
        // Get popular items data
        const popularItems = await getPopularItems(restaurantId);
        
        res.json({
            success: true,
            stats: {
                todayOrders: todayOrders.length,
                todayRevenue,
                pendingOrders: pendingOrders.length,
                averageRating,
                recentOrders,
                monthlyRevenueData,
                popularItems
            }
        });
    } catch (error) {
        console.error('Error fetching restaurant stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch restaurant stats' });
    }
});

// Helper function to get monthly revenue data
async function getMonthlyRevenueData(restaurantId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({
        restaurant: restaurantId,
        status: 'delivered',
        createdAt: { $gte: sixMonthsAgo }
    });
    
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
        const month = months[order.createdAt.getMonth()];
        const year = order.createdAt.getFullYear();
        const key = `${month} ${year}`;
