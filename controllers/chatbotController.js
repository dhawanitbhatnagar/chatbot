const axios = require('axios');
const KnowledgeBase = require('../models/KnowledgeBase');
const UnansweredQuestion = require('../models/UnansweredQuestion'); // Import the model
const { v4: uuidv4 } = require('uuid'); 
const path = require('path'); 
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const file = req.file; // Get the uploaded file (if any)

    try {
        const existingAnswer = await KnowledgeBase.findOne({ query: query.toLowerCase() });

        // If an answer exists in the knowledge base
        if (existingAnswer) {
            return res.json({ response: `${existingAnswer.response} from my knowledge base` });
        } else {
            // Save the unanswered question to the database
            const unansweredQuestion = new UnansweredQuestion({
                id: uuidv4(),
                question: query,
                sessionId: sessionId, // Store the session ID
                hasImage: file && file.mimetype.startsWith('image/') ? 1 : 0,
                hasVideo: file && file.mimetype.startsWith('video/') ? 1 : 0
            });
            await unansweredQuestion.save();

            // Prepare parameters for the API call
            let apiParams = {
                contents: [{ parts: [{ text: query }] }]
            };

            if (file) {
                const mediaPath = path.join(__dirname, '../uploads');
                const filePath = path.join(mediaPath, file.filename);
                
                // Upload the image or video file to GoogleAIFileManager
                const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
                const uploadResult = await fileManager.uploadFile(filePath, {
                    mimeType: file.mimetype,
                    displayName: file.originalname,
                });

                // Use the GoogleGenerativeAI to generate content
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                // Call Gemini API to generate content
                const result = await model.generateContent([
                    `${query}`, // Use user input query
                    {
                        fileData: {
                            fileUri: uploadResult.file.uri,
                            mimeType: uploadResult.file.mimeType,
                        },
                    },
                ]);

                const geminiAnswer = result.response.text(); // Get the generated answer

                // Save new entry to the knowledge base
                const newEntry = new KnowledgeBase({
                    id: uuidv4(), // Generate a unique ID for the knowledge base entry
                    query: query.toLowerCase(),
                    response: geminiAnswer,
                    sessionId: sessionId,
                    imagePath: file && file.mimetype.startsWith('image/') ? filePath : null,
                    videoPath: file && file.mimetype.startsWith('video/') ? filePath : null,
                    hasImage: file && file.mimetype.startsWith('image/') ? 1 : 0,
                    hasVideo: file && file.mimetype.startsWith('video/') ? 1 : 0
                });
                const savedEntry = await newEntry.save();

                // Update the unanswered question with the knowledge base reference
                unansweredQuestion.knowledgeBaseRef = savedEntry._id; // Set the reference
                await unansweredQuestion.save(); // Save the updated unanswered question

                return res.json({ response: `${geminiAnswer} from API` });
            } else {
                // Handle case where there is no file uploaded
                return res.status(400).json({ error: 'No image or video uploaded' });
            }
        }
    } catch (error) {
        console.error('Error querying chatbot:', error);
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
