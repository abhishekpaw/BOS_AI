import { Router } from "express";
import { searchWeb } from "../services/webSearch.service.js";
import { embedQuery, streamAnswer } from "../services/openai.service.js";
import { queryVectors } from "../services/pinecone.service.js";

const router = Router();

router.post("/stream", async (req, res, next) => {
  try {
    const { message, includeWeb = true, includeVectors = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    let webResults = [];
    let vectorMatches = [];

    if (includeWeb) {
      try {
        webResults = await searchWeb(message);
      } catch (err) {
        console.error("Tavily error:", err.response?.data || err.message);
      }
    }

    if (includeVectors) {
      try {
        const queryEmbedding = await embedQuery(message);
        vectorMatches = await queryVectors(queryEmbedding);
      } catch (err) {
        console.error("Pinecone/OpenAI embedding error:", err.response?.data || err.message);
      }
    }

    const context = [
      ...webResults.map((item, index) => {
        const title = item.title || `Web Result ${index + 1}`;
        const url = item.url || "";
        const content = item.content || "";
        return `[WEB]\nTitle: ${title}\nURL: ${url}\nContent: ${content}`;
      }),
      ...vectorMatches.map((match) => {
        const text = match?.metadata?.text || "";
        const sourceType = match?.metadata?.sourceType || "vector";
        return `[VECTOR]\nSource: ${sourceType}\nContent: ${text}`;
      })
    ].join("\n\n");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await streamAnswer({
      message,
      context,
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      onEnd: () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error("Chat stream error:", error.response?.data || error.message);

    if (!res.headersSent) {
      return res.status(error.status || error.response?.status || 500).json({
        error: error.message || "Chat stream failed"
      });
    }

    res.end();
  }
});

export default router;