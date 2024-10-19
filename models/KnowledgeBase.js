const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Unique ID for each entry
    query: { type: String, required: true },
    response: { type: String, required: true },
    imagePath: { type: String, default: null }, // Field for storing the image path
    hasImage: { type: String, default: 0 }, // Field for storing the image flag
    videoPath: { type: String, default: null }, // Field for storing the image path
    hasVideo: { type: String, default: 0 }, // Field for storing the image path
    docPath: { type: String, default: null }, // Field for storing the image path
    hasdoc: { type: String, default: 0 }, // Field for storing the image path
    videoPath: { type: String, default: null }, // Field for storing the image path
    hasVideo: { type: String, default: 0 }, // Field for storing the image path
    sessionId: { type: String, required: true } // Required session ID field
});

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
module.exports = KnowledgeBase;