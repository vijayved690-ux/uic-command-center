import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Render par chalne ke liye Env variable ka use
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [agentOutput, setAgentOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/activity-feed`);
      setActivityFeed(res.data);
    } catch (err) {
      console.error("Feed error:", err);
    }
  };

  const runAgent = async () => {
    setLoading(true);
    setAgentOutput('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/run-agent`, {
        agentName: 'SEO Agent',
        prompt: 'Give me 3 high intent keywords for CT Scan.'
      });
      setAgentOutput(response.data.response);
      fetchActivity();
    } catch (error) {
      setAgentOutput('❌ Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ color: '#00ffcc', padding: '20px', fontFamily: 'monospace' }}>
      <h2>UIC AI SEO Command Center ⚕️</h2>
      <button onClick={runAgent} disabled={loading} style={{ padding: '10px', background: '#00ffcc', color: '#000', cursor: 'pointer' }}>
        {loading ? 'Running Agent...' : 'Run Agent Test'}
      </button>
      <pre style={{ background: '#222', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
        {agentOutput || 'Agent output will appear here...'}
      </pre>

      <h3>Live Activity Feed</h3>
      <ul>
        {activityFeed.map(task => (
          <li key={task._id} style={{ color: '#aaa', margin: '5px 0' }}>
            [{new Date(task.timestamp).toLocaleTimeString()}] <b>{task.agentName}</b> - Cost: ₹{task.costINR}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;