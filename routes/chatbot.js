// routes/chatbot.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const { handleQuery, handleUpload, getQueriesBySessionId } = require('../controllers/chatbotController');

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads')); // Save to the uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    }
});

// Middleware for handling multipart/form-data
const upload = multer({ storage: storage });

// Route to handle chatbot query
router.post('/query', handleQuery);

// Route to handle image upload
router.post('/upload', upload.single('image'), handleUpload);

// Route to fetch queries made by user in a single session
router.get('/queries/:sessionId', getQueriesBySessionId);

module.exports = router;
