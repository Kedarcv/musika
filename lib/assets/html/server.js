const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory user storage (for demonstration purposes)
let users = [];

// Create a super account for testing
users.push({ email: "cvlised360@gmail.com", password: "Cvlised@360" });

// User registration endpoint
app.post('/api/signup', (req, res) => {
    const { email, password } = req.body;
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    // Create new user
    users.push({ email, password });
    console.log(`User registered: ${email}`);
    res.status(201).json({ message: 'User created successfully' });
});

// User login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    // Check if user exists
    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`User logged in: ${email}`);
    res.status(200).json({ message: 'Login successful' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
