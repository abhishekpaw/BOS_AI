"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://bos-ai-p1c4.onrender.com/api" || "http://localhost:5000/api";

export default function ChatClient() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeWeb, setIncludeWeb] = useState(true);
  const [includeVectors, setIncludeVectors] = useState(true);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setResponse("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          includeWeb,
          includeVectors
        })
      });

      if (!res.ok) {
        const text = await res.text();
        setResponse(`Error ${res.status}: ${text}`);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;

          const payload = JSON.parse(part.replace("data: ", ""));

          if (payload.token) {
            setResponse((prev) => prev + payload.token);
          }
        }
      }
    } catch (error) {
      setResponse(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <h1>Production AI Chat</h1>

        <div className="chat-box">
          {response || "Response will appear here..."}
        </div>

        <div className="controls">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "Generating..." : "Send"}
          </button>
        </div>

        <div className="toggles">
          <label>
            <input
              type="checkbox"
              checked={includeWeb}
              onChange={(e) => setIncludeWeb(e.target.checked)}
            />
            Include live web search
          </label>

          <label>
            <input
              type="checkbox"
              checked={includeVectors}
              onChange={(e) => setIncludeVectors(e.target.checked)}
            />
            Include Pinecone context
          </label>
        </div>
      </section>
    </main>
  );
}