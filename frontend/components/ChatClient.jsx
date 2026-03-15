"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  ScanText,
  Camera,
  Upload,
  Search
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function ChatClient() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [includeWeb, setIncludeWeb] = useState(true);
  const [includeVectors, setIncludeVectors] = useState(true);

  const [uploadStatus, setUploadStatus] = useState("");

  const [activeTool, setActiveTool] = useState("upload");

  const [previewURL, setPreviewURL] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  const [cameraOpen, setCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const authHeaders = {
    "x-user-id": "demo-user-1"
  };

  /* ---------------- CHAT ---------------- */

  const sendMessage = async () => {
    if (!message.trim()) return;

    setResponse("");
    setCitations([]);
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

          if (payload.citations) setCitations(payload.citations);

          if (payload.token) {
            setResponse((prev) => prev + payload.token);
          }
        }
      }
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  /* ---------------- FILE UPLOAD ---------------- */

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.type === "application/pdf") {
      setPreviewURL(URL.createObjectURL(file));
      setPreviewType("pdf");
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("Uploading file...");

    try {
      const res = await fetch(`${API_BASE}/upload/file`, {
        method: "POST",
        headers: authHeaders,
        body: formData
      });

      const data = await res.json();

      setUploadStatus(data.message || "File uploaded");
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  /* ---------------- IMAGE ---------------- */

  const uploadImage = async (file) => {
    if (!file) return;

    setPreviewURL(URL.createObjectURL(file));
    setPreviewType("image");

    const formData = new FormData();
    formData.append("image", file);

    setUploadStatus("Analyzing image...");

    try {
      const res = await fetch(`${API_BASE}/vision/analyze`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      setUploadStatus(data.content || "Image processed");
    } catch (err) {
      setUploadStatus(`Image failed: ${err.message}`);
    }
  };

  /* ---------------- OCR ---------------- */

  const uploadImageForOCR = async (file) => {
    if (!file) return;

    setPreviewURL(URL.createObjectURL(file));
    setPreviewType("image");

    const formData = new FormData();
    formData.append("image", file);

    setUploadStatus("Extracting text...");

    try {
      const res = await fetch(`${API_BASE}/vision/ocr`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      setUploadStatus(data.text || "No text found");
    } catch (err) {
      setUploadStatus(`OCR failed: ${err.message}`);
    }
  };

  /* ---------------- CAMERA ---------------- */

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      streamRef.current = stream;
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setUploadStatus(`Camera error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "camera.png", {
        type: "image/png"
      });

      await uploadImage(file);
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <main className="app-shell">
      <section className="card">
        <div className="hero">
          <div>
            <span className="eyebrow">BOS AI Workspace</span>
            <h1>BOS AI</h1>

            <p className="hero-text">
              Search the web, upload documents, analyze images, run OCR and use
              your camera.
            </p>
          </div>

          <div className="status-pill">
            {loading ? "Generating…" : "Ready"}
          </div>
        </div>

        {/* CHAT BOX */}

        <div className="chat-box">
          <div className="chat-placeholder">
            {response || "Response will appear here"}
          </div>
        </div>

        {/* CITATIONS */}

        {citations.length > 0 && (
          <div className="citations-box">
            <div className="section-head">
              <h3>Sources</h3>
              <span>{citations.length}</span>
            </div>

            <ul>
              {citations.map((c) => (
                <li key={c.id}>
                  <span className="citation-id">{c.id}</span>
                  <div>
                    <strong>{c.title || "Source"}</strong>
                    {c.url && (
                      <a href={c.url} target="_blank">
                        Open
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SEARCH */}

        <div className="search-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask BOS AI..."
          />

          <button onClick={sendMessage}>
            <Search size={16} /> Search
          </button>
        </div>

        {/* TOOL NAV */}

        <div className="tool-nav">
          <button
            className={activeTool === "upload" ? "tool-btn active" : "tool-btn"}
            onClick={() => setActiveTool("upload")}
          >
            <FileText size={16} /> Upload
          </button>

          <button
            className={activeTool === "image" ? "tool-btn active" : "tool-btn"}
            onClick={() => setActiveTool("image")}
          >
            <ImageIcon size={16} /> Image
          </button>

          <button
            className={activeTool === "ocr" ? "tool-btn active" : "tool-btn"}
            onClick={() => setActiveTool("ocr")}
          >
            <ScanText size={16} /> OCR
          </button>

          <button
            className={activeTool === "camera" ? "tool-btn active" : "tool-btn"}
            onClick={() => setActiveTool("camera")}
          >
            <Camera size={16} /> Camera
          </button>
        </div>

        {/* TOOL PANEL */}

        <div className="tool-panel">
          {activeTool === "upload" && (
            <label className="upload-card">
              <span className="upload-title">
                <Upload size={18} /> Upload File
              </span>

              <span className="upload-subtitle">
                PDF or text for vector indexing
              </span>

              <input
                type="file"
                onChange={(e) => uploadFile(e.target.files?.[0])}
              />
            </label>
          )}

          {activeTool === "image" && (
            <label className="upload-card">
              <span className="upload-title">
                <ImageIcon size={18} /> Image Understanding
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadImage(e.target.files?.[0])}
              />
            </label>
          )}

          {activeTool === "ocr" && (
            <label className="upload-card">
              <span className="upload-title">
                <ScanText size={18} /> OCR
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadImageForOCR(e.target.files?.[0])}
              />
            </label>
          )}

          {activeTool === "camera" && (
            <div className="camera-card">
              <div className="camera-actions">
                {!cameraOpen ? (
                  <button onClick={startCamera}>Open Camera</button>
                ) : (
                  <>
                    <button onClick={capturePhoto}>Capture</button>
                    <button className="secondary-btn" onClick={stopCamera}>
                      Close
                    </button>
                  </>
                )}
              </div>

              {cameraOpen && (
                <video
                  ref={videoRef}
                  className="camera-preview"
                  autoPlay
                  muted
                />
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          )}
        </div>

        {/* PREVIEW */}

        {previewURL && (
          <div className="preview-box">
            {previewType === "image" && (
              <img src={previewURL} className="camera-preview" />
            )}

            {previewType === "pdf" && (
              <iframe
                src={previewURL}
                height="400"
                className="camera-preview"
              />
            )}
          </div>
        )}

        {/* STATUS */}

        {uploadStatus && (
          <div className="status-banner">{uploadStatus}</div>
        )}
      </section>
    </main>
  );
}
