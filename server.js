const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the CORS package

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON body
app.use(bodyParser.json());

// Path for storing user data
const usersFilePath = path.join(__dirname, 'users.json');

// Check if the users.json file exists and create it if it doesn't
function initializeUsersFile() {
    if (!fs.existsSync(usersFilePath)) {
        // If the file doesn't exist, create an empty array inside the JSON file
        fs.writeFileSync(usersFilePath, JSON.stringify([]), 'utf8');
    }
}

// Initialize the users.json file
initializeUsersFile();

// POST endpoint to login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users data');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            res.status(200).send('Login successful!');
        } else {
            res.status(400).send('Invalid email or password');
        }
    });
});

// POST endpoint to signup (create new user)
app.post('/signup', (req, res) => {
    const { email, password } = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading users data');
        }

        const users = JSON.parse(data);

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return res.status(400).send('Email already exists!');
        }

        // Add new user to the array
        users.push({ email, password });

        // Write updated users array to file
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving user data');
            }

            res.status(200).send('Signup successful!');
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
