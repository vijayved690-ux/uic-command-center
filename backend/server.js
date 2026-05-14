require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ Naya add kiya hai
const Anthropic = require('@anthropic-ai/sdk');
const AgentTask = require('./models/AgentTask');

const app = express();

// ✅ CORS ko simple kar diya hai kyunki ab sab ek hi server par hai
app.use(cors());
app.use(express.json());

// Claude Setup
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

// MongoDB Setup
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// Agent Run API
app.post('/api/run-agent', async (req, res) => {
    const { agentName, prompt } = req.body;

    try {
        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
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
        console.error("Agent Error:", error);
        res.status(500).json({ success: false, error: "API Error. Check console." });
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

// ✅ --- YAHAN CHANGE HUA HAI: Frontend ko serve karne ka logic ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
// -----------------------------------------------------------------

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));