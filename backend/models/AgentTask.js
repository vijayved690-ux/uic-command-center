const mongoose = require('mongoose');

const agentTaskSchema = new mongoose.Schema({
    agentName: { type: String, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    status: { type: String, default: 'Success' },
    costINR: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgentTask', agentTaskSchema);