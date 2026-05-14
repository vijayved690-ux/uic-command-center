require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const AgentTask = require('./models/AgentTask');

const app = express();

// UIC Dashboard Standard Middlewares
app.use(cors());
app.use(express.json());

// Claude Setup (Latest Model from your Workbench)
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

// MongoDB Setup for UIC Activities
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// --- API: RUN AGENT (UIC AI SEO Logic) ---
app.post('/api/run-agent', async (req, res) => {
    const { agentName, prompt } = req.body;
    try {
        const msg = await anthropic.messages.create({
            // ✅ EXACT Model ID jo aapke workbench par active hai
            model: "claude-haiku-4-5-20251001", 
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        });

        const claudeResponse = msg.content[0].text;
        
        // UIC Cost Calculation Logic (Haiku Rates)
        const estimatedCostINR = (msg.usage.input_tokens * 0.0001) + (msg.usage.output_tokens * 0.0005);

        const newTask = new AgentTask({
            agentName,
            prompt,
            response: claudeResponse,
            costINR: estimatedCostINR.toFixed(4)
        });
        await newTask.save();

        res.json({ success: true, response: claudeResponse, taskData: newTask });
    } catch (error) {
        // Detailed error for UIC Troubleshooting
        console.error("Agent Error Details:", error);
        res.status(500).json({ 
            success: false, 
            error: "Claude API Error: " + error.message 
        });
    }
});

// --- API: ACTIVITY FEED ---
app.get('/api/activity-feed', async (req, res) => {
    try {
        const history = await AgentTask.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Feed load failed" });
    }
});

// --- SERVE FRONTEND (UIC UI Logic) ---
// Frontend ke final build ko serve karne ke liye
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route taaki React/Vite routing sahi chale
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 UIC Dashboard Live on Port ${PORT}`);
});