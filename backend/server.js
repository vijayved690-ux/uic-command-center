require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const AgentTask = require('./models/AgentTask');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Claude Setup (Latest Stable Sonnet Model)
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// Agent Run API
app.post('/api/run-agent', async (req, res) => {
    const { agentName, prompt } = req.body;
    try {
        // Calling Claude 3.5 Sonnet (Most Stable & Powerful)
        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620", 
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        });

        const claudeResponse = msg.content[0].text;
        
        // Cost estimation for Sonnet
        const estimatedCostINR = (msg.usage.input_tokens * 0.0003) + (msg.usage.output_tokens * 0.0012);

        const newTask = new AgentTask({
            agentName,
            prompt,
            response: claudeResponse,
            costINR: estimatedCostINR.toFixed(4)
        });
        await newTask.save();

        res.json({ success: true, response: claudeResponse, taskData: newTask });
    } catch (error) {
        console.error("Claude API Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Claude API Error: " + error.message 
        });
    }
});

// Activity Feed API
app.get('/api/activity-feed', async (req, res) => {
    try {
        const history = await AgentTask.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Feed load failed" });
    }
});

// Serving Static Frontend Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 UIC Dashboard Live on Port ${PORT}`);
});