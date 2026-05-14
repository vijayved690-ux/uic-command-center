import { useState, useRef } from "react";

const ACCENT = {
  keyword:    { color: "#00c2ff", bg: "rgba(0,194,255,0.10)", border: "rgba(0,194,255,0.28)" },
  content:    { color: "#ffaa00", bg: "rgba(255,170,0,0.10)",  border: "rgba(255,170,0,0.28)"  },
  technical:  { color: "#ff4757", bg: "rgba(255,71,87,0.10)",  border: "rgba(255,71,87,0.28)"  },
  gbp:        { color: "#9b6dff", bg: "rgba(155,109,255,0.10)",border: "rgba(155,109,255,0.28)"},
  competitor: { color: "#00e5c8", bg: "rgba(0,229,200,0.10)",  border: "rgba(0,229,200,0.28)"  },
  aisearch:   { color: "#00e5a0", bg: "rgba(0,229,160,0.10)",  border: "rgba(0,229,160,0.28)"  },
};

const AGENTS = [
  {
    id: "keyword", initials: "KR", label: "Keyword Researcher", role: "COO · Research · Long-tail", icon: "🔍",
    desc: "Finds high-intent, long-tail keywords for radiology & imaging services in Ahmedabad.",
    prompt: `You are an expert SEO keyword researcher for Usmanpura Imaging Centre (UIC), a radiology chain with 15 branches in Ahmedabad. Website: usmanpuraimaging.com. Generate a structured report in plain text only.

SECTION 1 - PRIORITY KEYWORDS (Top 10)
For each: keyword | est. monthly searches | intent | difficulty. Focus on CT scan, MRI, X-Ray, Ultrasound, DEXA, PET scan in Ahmedabad.

SECTION 2 - LONG-TAIL CLUSTERS
5 clusters of 4 keywords: CT Scan, MRI Brain, Ultrasound, Bone Density, Cardiac Imaging.

SECTION 3 - QUICK WIN KEYWORDS
8 low-difficulty question-based keywords UIC can rank for in 30 days.

SECTION 4 - LOCATION MODIFIERS
10 Ahmedabad neighbourhood modifiers for radiology searches.`
  },
  {
    id: "content", initials: "CO", label: "Content Optimizer", role: "Content Director · Meta & Blog", icon: "✍️",
    desc: "Generates SEO-optimised meta titles, descriptions, and blog intros for key service pages.",
    prompt: `You are Content Director for Usmanpura Imaging Centre (UIC), usmanpuraimaging.com, Ahmedabad, 15 branches. Write in plain text only.

For each of 5 services (CT Scan, MRI, Ultrasound, X-Ray, DEXA Bone Density) write:
Meta Title (55-60 chars, include Ahmedabad)
Meta Description (150-160 chars, include CTA like Book Now or Same-Day Reports)
H1 Tag (keyword-rich)
Blog Intro (80-100 words, warm tone addressing patient anxiety)

Format each as:
[SERVICE NAME]
Meta Title: ...
Meta Description: ...
H1: ...
Blog Intro: ...`
  },
  {
    id: "technical", initials: "TS", label: "Technical SEO", role: "Dev · Crawl · Schema", icon: "⚙️",
    desc: "Audits technical SEO issues and produces JSON-LD schema markup for medical service pages.",
    prompt: `You are Technical SEO lead for Usmanpura Imaging Centre (UIC), usmanpuraimaging.com, Ahmedabad, 15 branches. Plain text output only.

SECTION 1 - TOP 10 TECHNICAL ISSUES
For each: issue | priority P1/P2/P3 | fix action | expected impact.

SECTION 2 - JSON-LD SCHEMA
Valid JSON-LD for UIC main Usmanpura location: MedicalBusiness type, address, geo, openingHours, phone, priceRange, 3 MedicalSpecialty entries.

SECTION 3 - BREADCRUMB SCHEMA
JSON-LD BreadcrumbList: Home > Services > CT Scan > CT KUB Ahmedabad.

SECTION 4 - CORE WEB VITALS
5 specific fixes for LCP, CLS, FID on a medical imaging website.`
  },
  {
    id: "gbp", initials: "GB", label: "GBP Manager", role: "Local SEO · 15 Branches", icon: "📍",
    desc: "Writes Google Business Profile content for each of UIC's 15 branch locations.",
    prompt: `You are Local SEO manager for Usmanpura Imaging Centre (UIC), usmanpuraimaging.com, 15 branches in Ahmedabad. Plain text only.

For 3 branches (USMANPURA main, SATELLITE, BOPAL) provide:
1. GBP Description (750 chars max, include same-day reports, NABL accredited, 15 branches)
2. Google Post (300 chars with CTA)
3. Q&A pair (patient question + expert answer 2-3 sentences)
4. Review Response (warm professional reply to 5-star review mentioning fast reports)

Format with branch headers.`
  },
  {
    id: "competitor", initials: "CI", label: "Competitor Intel", role: "Analytics · Market Watch", icon: "🎯",
    desc: "Analyses Ahmedabad diagnostic imaging market and identifies gaps UIC can capitalise on.",
    prompt: `You are Competitor Intelligence analyst for Usmanpura Imaging Centre (UIC), usmanpuraimaging.com, Ahmedabad, 15 branches. Plain text only.

SECTION 1 - MARKET LANDSCAPE
5 main Ahmedabad diagnostic imaging competitors: positioning | SEO strength | weakness UIC can exploit.

SECTION 2 - CONTENT GAP OPPORTUNITIES
8 topics competitors lack but patients search for. Include keyword and reason.

SECTION 3 - PRICING PAGE STRATEGY
3 headline options + 60-word intro for "CT Scan Cost in Ahmedabad" page.

SECTION 4 - POSITIONING STATEMENTS
2 USP statements (1 sentence each) for ads and meta descriptions.`
  },
  {
    id: "aisearch", initials: "AI", label: "AI Search Agent", role: "ChatGPT · Perplexity · LLMs", icon: "🤖",
    desc: "Crafts content to get UIC cited by ChatGPT, Perplexity, and LLM-based search engines.",
    prompt: `You are AI Search Optimization specialist for Usmanpura Imaging Centre (UIC), usmanpuraimaging.com, Ahmedabad. Plain text only.

SECTION 1 - FAQ BLOCK FOR LLM CITATION
6 FAQ pairs for patient queries about radiology in Ahmedabad. Answers: 2-3 sentences mentioning UIC naturally.

SECTION 2 - AUTHORITATIVE SNIPPET
100-word paragraph for LLM citation: 15 branches, NABL, services, same-day reports, website.

SECTION 3 - FACT SHEET
10 factual bullet points about UIC formatted like a Wikipedia source.

SECTION 4 - TARGET ANSWERS
3 example patient prompts to ChatGPT/Perplexity + ideal answer UIC wants cited.`
  }
];

function AgentCard({ agent, onLog }) {
  const ac = ACCENT[agent.id];
  const [status, setStatus] = useState("idle"); 
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);

  const statusLabel = { idle: "Idle", running: "Running...", done: "Done", error: "Error" };
  const statusColor = { idle: "#3a5570", running: ac.color, done: "#00e5a0", error: "#ff4757" };

  async function run() {
    setStatus("running");
    setOutput("");
    setError("");
    setProgress(10);
    onLog(agent.icon, "Started", agent.label);

    const progTimer = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 7, 88));
    }, 700);

    try {
      // Yahan hum apne Render Backend ko call kar rahe hain
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE_URL}/api/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          agentName: agent.label, 
          prompt: agent.prompt 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP Error ${response.status}`);
      }

      clearInterval(progTimer);
      setProgress(100);
      setOutput(data.response);
      setStatus("done");
      onLog("✅", `Done — Cost: ₹${data.taskData?.costINR || 0}`, agent.label);
      setTimeout(() => setProgress(0), 1000);

    } catch (err) {
      clearInterval(progTimer);
      setProgress(0);
      setStatus("error");
      setError(err.message || String(err));
      onLog("❌", err.message || String(err), agent.label);
    }
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isRunning = status === "running";

  return (
    <div style={{
      background: "#0d1117",
      border: `1px solid ${status === "running" ? ac.color : status === "error" ? "rgba(255,71,87,0.4)" : "#1e2d3d"}`,
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: isRunning ? `0 0 0 1px ${ac.border}, 0 8px 32px rgba(0,0,0,0.3)` : "none",
      transition: "border-color 0.3s, box-shadow 0.3s"
    }}>
      <div style={{ height: 2, background: ac.color, opacity: isRunning ? 1 : 0.4, transition: "opacity 0.3s" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: ac.bg, border: `1px solid ${ac.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontWeight: 800, fontSize: 11, color: ac.color, flexShrink: 0
          }}>{agent.initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#e8f4f8", lineHeight: 1 }}>{agent.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#3a5570", letterSpacing: 1, marginTop: 3 }}>{agent.role}</div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 20,
          background: `${statusColor[status]}18`,
          border: `1px solid ${statusColor[status]}44`,
          fontFamily: "monospace", fontSize: 9, color: statusColor[status], letterSpacing: 1
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%", background: statusColor[status],
            animation: isRunning ? "blink 1s ease-in-out infinite" : "none"
          }} />
          {statusLabel[status]}
        </div>
      </div>

      <div style={{ padding: "10px 16px 0", fontSize: 11.5, color: "#6b8fa8", lineHeight: 1.5 }}>{agent.desc}</div>

      {progress > 0 && (
        <div style={{ margin: "10px 16px 0", height: 2, background: "#111820", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`, background: ac.color,
            borderRadius: 2, transition: "width 0.5s ease"
          }} />
        </div>
      )}

      <div style={{ padding: "12px 16px" }}>
        <button
          onClick={run}
          disabled={isRunning}
          style={{
            width: "100%", padding: "9px 0",
            background: "#111820", border: `1px solid ${isRunning ? ac.color : "#1e2d3d"}`,
            borderRadius: 8, color: ac.color,
            fontFamily: "monospace", fontSize: 10, letterSpacing: 0.5,
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.6 : 1, transition: "all 0.2s"
          }}
        >
          {isRunning ? "⟳ Generating..." : status === "done" ? "↺ Re-run" : status === "error" ? "↺ Retry" : `▶ Run ${agent.label}`}
        </button>
      </div>

      {(output || status === "running") && (
        <div style={{
          margin: "0 12px 12px",
          background: "#111820", border: "1px solid #1e2d3d",
          borderRadius: 10, overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderBottom: "1px solid #1e2d3d", background: "#0d1117"
          }}>
            <div style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 1.5, color: "#3a5570" }}>
              <span style={{ color: ac.color }}>●</span> OUTPUT
            </div>
            {output && (
              <button onClick={copy} style={{
                padding: "3px 10px", background: "transparent",
                border: `1px solid ${copied ? ac.color : "#1e2d3d"}`,
                borderRadius: 4, color: copied ? ac.color : "#3a5570",
                fontFamily: "monospace", fontSize: 8, cursor: "pointer", transition: "all 0.15s"
              }}>
                {copied ? "✓ Copied!" : "⧉ Copy"}
              </button>
            )}
          </div>
          <div ref={outputRef} style={{
            padding: 12, fontSize: 11.5, color: "#7a9cb8", lineHeight: 1.7,
            maxHeight: 280, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: status === "running" ? "monospace" : "inherit"
          }}>
            {isRunning && !output ? (
              <span style={{ color: "#3a5570", fontFamily: "monospace" }}>Calling Claude via UIC Backend...</span>
            ) : output}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          margin: "0 12px 12px", padding: "8px 12px",
          background: "rgba(255,71,87,0.07)", border: "1px solid rgba(255,71,87,0.2)",
          borderRadius: 8, fontSize: 11, color: "#ff4757", wordBreak: "break-all"
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [logs, setLogs] = useState([]);
  const [runningAll, setRunningAll] = useState(false);

  function addLog(icon, text, label) {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, { icon, text, label, time, id: Date.now() + Math.random() }]);
  }

  return (
    <div style={{
      background: "#060910", minHeight: "100vh", color: "#e8f4f8",
      fontFamily: "'DM Sans', sans-serif",
      backgroundImage: "linear-gradient(rgba(0,194,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,194,255,0.025) 1px,transparent 1px)",
      backgroundSize: "40px 40px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e2d3d;border-radius:2px}
      `}</style>

      <div style={{
        borderBottom: "1px solid #1e2d3d", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56, background: "rgba(6,9,16,0.92)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg,#00c2ff,#0057ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 10, color: "#fff", fontFamily: "monospace"
          }}>UIC</div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 14 }}>Usmanpura Imaging Centre</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: "#3a5570", letterSpacing: 2 }}>AI SEO AGENTS · LIVE</div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.18)",
          fontFamily: "monospace", fontSize: 9, color: "#00e5a0", letterSpacing: 1
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e5a0", animation: "blink 1.8s ease-in-out infinite" }} />
          UIC BACKEND CONNECTED
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>
              SEO <span style={{ color: "#00c2ff" }}>Agent</span> Console
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#3a5570", letterSpacing: 2, marginTop: 5 }}>
              USMANPURAIMAGING.COM · 6 AGENTS · REAL OUTPUT
            </div>
          </div>
          <button
            disabled={runningAll}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 18px",
              background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.3)",
              borderRadius: 8, color: "#00c2ff", fontFamily: "monospace", fontSize: 11,
              cursor: runningAll ? "not-allowed" : "pointer", opacity: runningAll ? 0.5 : 1
            }}
          >
            ▶ Run All 6 Agents
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16, marginBottom: 20
        }}>
          {AGENTS.map(agent => (
            <AgentCard key={agent.id} agent={agent} onLog={addLog} />
          ))}
        </div>

        <div style={{
          background: "#0d1117", border: "1px solid #1e2d3d",
          borderRadius: 12, overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #1e2d3d", background: "#111820"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 12 }}>
              Activity Log
              <span style={{
                fontFamily: "monospace", fontSize: 9, color: "#3a5570",
                padding: "2px 8px", background: "#0d1117", borderRadius: 20, border: "1px solid #1e2d3d"
              }}>{logs.length} event{logs.length !== 1 ? "s" : ""}</span>
            </div>
            <button onClick={() => setLogs([])} style={{
              padding: "3px 10px", background: "transparent", border: "1px solid #1e2d3d",
              borderRadius: 5, color: "#3a5570", fontFamily: "monospace", fontSize: 9, cursor: "pointer"
            }}>Clear</button>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", padding: "4px 0" }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, fontFamily: "monospace", fontSize: 10, color: "#3a5570" }}>
                No activity yet — run an agent to begin
              </div>
            ) : (
              [...logs].reverse().map(log => (
                <div key={log.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "7px 16px", borderBottom: "1px solid rgba(30,45,61,0.5)",
                  fontSize: 11
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#3a5570", whiteSpace: "nowrap", marginTop: 1, flexShrink: 0 }}>{log.time}</span>
                  <span style={{ flexShrink: 0 }}>{log.icon}</span>
                  <div style={{ color: "#6b8fa8", lineHeight: 1.4 }}>
                    <strong style={{ color: "#e8f4f8", fontWeight: 500 }}>{log.label}</strong> — {log.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}