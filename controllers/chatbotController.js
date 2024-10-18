const axios = require('axios');
const KnowledgeBase = require('../models/KnowledgeBase');
const UnansweredQuestion = require('../models/UnansweredQuestion'); // Import the model
const { v4: uuidv4 } = require('uuid'); 

// Handle chatbot query
const handleQuery = async (req, res) => {
    const { query, sessionId } = req.body; // Get sessionId from request body

    try {
        const existingAnswer = await KnowledgeBase.findOne({ query: query.toLowerCase() });

        if (existingAnswer) {
            return res.json({ response: `${existingAnswer.response} from my knowledge base` });
        } else {
            // Save the unanswered question to the database
            const unansweredQuestion = new UnansweredQuestion({
                id: uuidv4(),
                question: query,
                sessionId: sessionId, // Store the session ID
                hasImage: 0 // Assuming no image for this text query
            });
            await unansweredQuestion.save();

            // Call the Gemini API for an answer
            const apiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                contents: [{ parts: [{ text: query }] }]
            });

            const geminiAnswer = apiResponse.data.candidates[0].content.parts[0].text;

            // Save new entry to the knowledge base
            const newEntry = new KnowledgeBase({
                id: uuidv4(),
                query: query.toLowerCase(),
                response: geminiAnswer,
                sessionId: sessionId,
                imagePath: null // No image path for text-only queries
            });
            const savedEntry = await newEntry.save();

            // Update the unanswered question with the knowledge base reference
            unansweredQuestion.knowledgeBaseRef = savedEntry._id; // Set the reference
            await unansweredQuestion.save(); // Save the updated unanswered question

            return res.json({ response: `${geminiAnswer} from API` });
        }
    } catch (error) {
        console.error('Error querying chatbot:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle image upload and processing
const handleUpload = async (req, res) => {
    const { query, sessionId } = req.body; // Get sessionId from request body

    try {
        // Check for image upload
        const hasImage = req.file !== undefined;

        const unansweredQuestion = new UnansweredQuestion({
            id: uuidv4(), // Generate a unique ID
            question: query, // Save the question asked by the user
            sessionId: sessionId, // Store the session ID
            imagePath: hasImage ? req.file.path : null, // Store image path if present
            hasImage: hasImage ? 1 : 0 // Set hasImage flag
        });

        await unansweredQuestion.save(); // Save the unanswered question

        // Proceed with the Gemini API call
        const apiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: query }] }]
        });

        const geminiAnswer = apiResponse.data.candidates[0].content.parts[0].text;

        // Save new entry to the knowledge base
        const newEntry = new KnowledgeBase({
            id: uuidv4(), // Generate a unique ID for the knowledge base entry
            query: query.toLowerCase(),
            response: geminiAnswer,
            sessionId: sessionId,
            imagePath: hasImage ? req.file.path : null // Save the image path if present
        });
        const savedEntry = await newEntry.save();

        // Update the unanswered question with the knowledge base reference
        unansweredQuestion.knowledgeBaseRef = savedEntry._id; // Set the reference
        await unansweredQuestion.save(); // Save the updated unanswered question

        return res.json({ response: `${geminiAnswer} from API` });
    } catch (error) {
        console.error('Error handling upload and generating content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Fetch queries by session ID
const getQueriesBySessionId = async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Fetch queries from the KnowledgeBase associated with this sessionId
        const queries = await KnowledgeBase.find({ sessionId });

        // Return the queries in the response
        return res.json(queries);
    } catch (error) {
        console.error('Error fetching queries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    handleQuery,
    handleUpload,
    getQueriesBySessionId
};
