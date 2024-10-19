const mongoose = require('mongoose');

const UnansweredQuestionSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Unique ID for each entry
    question: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    sessionId: { type: String, required: true }, // Store session ID
    imagePath: { type: String, default: null }, // Field for storing the image path
    hasImage: { type: String, default: 0 }, // Field for storing the image flag
    videoPath: { type: String, default: null }, // Field for storing the image path
    hasVideo: { type: String, default: 0 }, // Field for storing the image path
    knowledgeBaseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeBase' } // Reference to KnowledgeBase
});

const UnansweredQuestion = mongoose.model('UnansweredQuestion', UnansweredQuestionSchema);
module.exports = UnansweredQuestion;
