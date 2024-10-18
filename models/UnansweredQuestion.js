const mongoose = require('mongoose');

const UnansweredQuestionSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Unique ID for each entry
    question: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    sessionId: { type: String, required: true }, // Store session ID
    imagePath: { type: String, default: null }, // Field for storing the image path
    hasImage: { type: Number, default: 0 }, // Flag for whether there is an image
    knowledgeBaseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeBase' } // Reference to KnowledgeBase
});

const UnansweredQuestion = mongoose.model('UnansweredQuestion', UnansweredQuestionSchema);
module.exports = UnansweredQuestion;
