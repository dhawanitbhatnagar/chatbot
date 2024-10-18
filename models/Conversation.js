// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  feedback: { type: String, default: null }
});

module.exports = mongoose.model('Conversation', conversationSchema);