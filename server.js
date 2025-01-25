const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');  // Import cors package

const app = express();
const port = 3000;

// Secret key for JWT
const JWT_SECRET = 'your-secret-key';

// Middleware to parse JSON body and cookies
app.use(bodyParser.json());
app.use(cookieParser());

// Enable CORS for specific origin (or you can use '*')
app.use(cors({ origin: 'http://127.0.0.1:5500', credentials: true })); // Add this line to allow CORS

// Path for storing user data
const usersFilePath = path.join(__dirname, 'users.json');

// Initialize users file
function initializeUsersFile() {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([]), 'utf8');
    }
}
initializeUsersFile();

// POST endpoint for login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users data');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Create a JWT token
            const token = jwt.sign({ email: user.email, uid: user.uid }, JWT_SECRET, { expiresIn: '1h' });
            
            // Set the token in a cookie
            res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour expiration
            res.status(200).send('Login successful!');
        } else {
            res.status(400).send('Invalid email or password');
        }
    });
});

// POST endpoint for signup
app.post('/signup', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users data');
        }

        const users = JSON.parse(data);
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return res.status(400).send('Email already exists!');
        }

        const uid = Date.now(); // Just a simple unique ID based on time
        users.push({ email, password, uid });

        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving user data');
            }

            res.status(200).send('Signup successful!');
        });
    });
});

// Middleware to verify the token for protected routes
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).send('Access denied');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid or expired token');
        }
        req.user = user; // Attach the decoded user to the request
        next();
    });
}

// Protected route to fetch user-specific data
app.get('/profile', verifyToken, (req, res) => {
    res.status(200).send({ email: req.user.email, uid: req.user.uid });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
