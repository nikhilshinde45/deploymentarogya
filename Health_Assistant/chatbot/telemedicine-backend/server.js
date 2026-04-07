const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors'); // Required for cross-origin requests from your frontend
require('dotenv').config();

const app = express();
const port = 3000; // Or any other port
// Replace with your actual Google Gemini API Key
const API_KEY = process.env.GEMINI_API_KEY; 
if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

app.use(cors()); // Enable CORS for your frontend
app.use(express.json()); // To parse JSON request bodies

// Serve static files from your frontend directory
app.use(express.static(__dirname));

app.post('/api/gemini-chat', async (req, res) => {
    try {
        const { model, contents, systemInstruction, generationConfig } = req.body;

        if (!model || !contents || !systemInstruction) {
            return res.status(400).json({ error: 'Missing required fields: model, contents, systemInstruction' });
        }

        const aiModel = genAI.getGenerativeModel({ model, systemInstruction });

        const result = await aiModel.generateContent({
            contents,
            generationConfig
        });
        const response = await result.response;
        const text = response.text();
        res.json({ text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
    console.log('Ensure GEMINI_API_KEY environment variable is set.');
});