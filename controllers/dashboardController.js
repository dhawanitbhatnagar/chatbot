const KnowledgeBase = require('../models/KnowledgeBase');
const UnansweredQuestion = require('../models/UnansweredQuestion'); // Import the model



const getUnanswerQuestions = async (req, res) => {
  const params = { ...req.query }; 
  
  const data = await UnansweredQuestion.find();
  console.log(data);

  res.status(200).send({
            msg: 'Question list',
            data: data
        });

};

const unanswerQuestionsUpdate = async (req, res) => {
    const { knowledgeBaseRef, response } = req.body; // Destructure necessary fields from the request body

    try {
        // Validate that knowledgeBaseRef is provided
        if (!knowledgeBaseRef) {
            return res.status(400).send({
                success: false,
                message: 'knowledgeBaseRef is required.',
            });
        }

        // Validate that response is provided
        if (typeof response !== 'string' || response.trim() === '') {
            return res.status(400).send({
                success: false,
                message: 'response is required and should be a non-empty string.',
            });
        }

        // Fetch unanswered questions based on knowledgeBaseRef
        const unansweredQuestions = await UnansweredQuestion.find({ knowledgeBaseRef });

        // Check if any questions were found
        if (unansweredQuestions.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No unanswered questions found for the given knowledge base reference.',
            });
        }

        // Update the knowledge base entry
        const updatedEntry = await KnowledgeBase.findOneAndUpdate(
            { _id:knowledgeBaseRef }, // Search criteria
            { $set: { response } }, // Update operation: setting the response field
            { new: true, runValidators: true } // Options
        );

        // Check if the entry was found and updated
        if (!updatedEntry) {
            return res.status(404).send({
                success: false,
                message: 'No knowledge base entry found to update for the given reference.',
            });
        }else{
            await UnansweredQuestion.deleteMany({ _id:unansweredQuestions.id });
        }

        // Respond with the updated entry and the list of unanswered questions
        res.status(200).send({
            success: true,
            msg: 'Updated successfully.',
            updatedEntry, // Send the updated knowledge base entry
            
        });
    } catch (error) {
        console.error('Error updating knowledge base entry:', error); // Log the error for debugging

        // Respond with an error status and message
        res.status(500).send({
            success: false,
            message: 'An error occurred while updating the knowledge base entry.',
        });
    }
};



module.exports = {
    getUnanswerQuestions,
    unanswerQuestionsUpdate
};

