const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Middleware
app.use(express.json());
app.use(cors());
dotenv.config();

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    //database: 'expense_tracker' // Specify the database here
});

// Connect to MySQL
db.connect((err) => {
    if (err) return console.log("Error connecting to MYSQL");

    console.log("Connected to MYSQL: ", db.threadId);

    // Create a database (if not exists)
    db.query('CREATE DATABASE IF NOT EXISTS expense_tracker', (err, result) => {
        if (err) return console.log(err);

        console.log("Database expense_tracker created/checked");

        //select our database
        db.changeUser({ database: 'expense_tracker' }, (err) => {
            if (err) return console.log(err);

            console.log("Changed to expense_tracker");

            // Create user's table
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    username VARCHAR(50) NOT NULL,
                    password VARCHAR(255) NOT NULL
                );
            `;

            db.query(createUsersTable, (err, result) => {
                if (err) return console.log(err);

                console.log("User's table created/checked");
            });
        });
    });
});

// User registration route
app.post('/api/register', async (req, res) => { 
    try {
        const users = `SELECT * FROM users WHERE email = ?`;

        db.query(users, [req.body.email], (err, data) => {
            if (data.length) return res.status(409).json("User already exists");

            const salt = bcrypt.genSaltSync(10); // type error: corrected 'alt' to 'salt'

            const hashedPassword = bcrypt.hashSync(req.body.password, salt) // type error: corrected 'alt' to 'salt'

            const newUser = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`; // type error: corrected the VALUES clause by separating placeholders with commas
            const value = [
                req.body.email,
                req.body.username,
                hashedPassword // type error: used 'hashedPassword' instead of 'req.body.password'
            ];

            // insert user db
            db.query(newUser, value, (err, data) => { // type error: corrected to pass 'value' directly instead of an array containing 'value'
                if (err) res.status(500).json("Something went wrong");

                return res.status(200).json("User created successfully");
            }); 
        }); 
    } catch (err) {
        res.status(500).json("Internal Server Error");
    }
});


// User log in route
app.post('/api/login', async (req, res) => {
    try {
        const users = `SELECT * FROM users WHERE email = ?`

        db.query(users, [req.body.email], (err, data) => {
            if (data.length === 0) return res.status(404).json("User not found")

            // check if password is valid
            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

            if(! isPasswordValid) return res.status(400).json("Invalid email or password")

            return res.status(200).json("Login successful")
        })
    } catch (err) {
        res.status(500).json("Internal Server Error");
    }
})

// Start Server
app.listen(3000, () => {
    console.log("Server is running on port 3000. Are you OK?");
});
