const express = require('express');
const orderRouter = require('./order-tracking'); // Import order tracking router
const restaurantRouter = require('./restaurants'); // Import restaurant router
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const stripe = new Stripe('your_stripe_secret_key'); // Replace with your actual Stripe secret key

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost/musika', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

// User Model
const User = mongoose.model('User', userSchema);

// User Registration
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    try {
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(400).send('Error registering user');
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Payment Endpoint
app.post('/api/payment', async (req, res) => {
    const { amount, currency, source } = req.body;

    try {
        const charge = await stripe.charges.create({
            amount,
            currency,
            source,
            description: 'Payment for Musika order'
        });
        res.status(200).json(charge);
    } catch (error) {
        res.status(500).send('Payment failed');
    }
});


app.use(orderRouter); // Use order tracking routes
app.use(restaurantRouter); // Use restaurant routes

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
