require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const AgentTask = require('./models/AgentTask');

const app = express();

// CORS aur JSON parsing setup
app.use(cors());
app.use(express.json());

// Claude Setup (API Key environment variable se lega)
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

/**
 * AGENT RUN API
 * Anthropic Claude API ko call karta hai aur result DB mein save karta hai
 */
app.post('/api/run-agent', async (req, res) => {
    const { agentName, prompt } = req.body;

    try {
        // Claude 3 Haiku Model Call
        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        });

        const claudeResponse = msg.content[0].text;
        
        // Cost calculations (Haiku rates in INR estimate)
        const estimatedCostINR = (msg.usage.input_tokens * 0.0001) + (msg.usage.output_tokens * 0.0005);

        // Save to Database
        const newTask = new AgentTask({
            agentName,
            prompt,
            response: claudeResponse,
            costINR: estimatedCostINR.toFixed(4)
        });
        await newTask.save();

        res.json({ success: true, response: claudeResponse, taskData: newTask });
    } catch (error) {
        // Detailed error log for Render console
        console.error("Detailed Agent Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Claude API Error. Check API Key or Model access." 
        });
    }
});

/**
 * ACTIVITY FEED API
 * Last 10 tasks ko history dikhane ke liye fetch karta hai
 */
app.get('/api/activity-feed', async (req, res) => {
    try {
        const history = await AgentTask.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Feed load failed" });
    }
});

/**
 * STATIC FRONTEND SERVING
 * Frontend ke build (dist folder) ko backend se hi chalane ke liye
 */
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Baaki saari routes ko frontend ki index.html par redirect karein
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 UIC Dashboard Server running on port ${PORT}`);
});