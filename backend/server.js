require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const AgentTask = require('./models/AgentTask');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

app.post('/api/run-agent', async (req, res) => {
    const { agentName, prompt } = req.body;
    try {
        const msg = await anthropic.messages.create({
            // ✅ Hum model ka sabse simple version use kar rahe hain
            model: "claude-3-haiku-20240307", 
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }]
        });

        const claudeResponse = msg.content[0].text;
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
        console.error("API Error:", error.message);
        res.status(500).json({ success: false, error: "Claude API Error: " + error.message });
    }
});

app.get('/api/activity-feed', async (req, res) => {
    try {
        const history = await AgentTask.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Feed load failed" });
    }
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 UIC Dashboard Live on Port ${PORT}`));