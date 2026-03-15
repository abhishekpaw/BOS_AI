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
      webResults = await searchWeb(message);
    }

    if (includeVectors) {
      const queryEmbedding = await embedQuery(message);
      vectorMatches = await queryVectors(queryEmbedding);
    }

    // Create citations
    const citations = [
      ...webResults.map((item, index) => ({
        id: `W${index + 1}`,
        title: item.title,
        url: item.url,
        type: "web"
      })),
      ...vectorMatches.map((match, index) => ({
        id: `V${index + 1}`,
        title:
          match?.metadata?.filename ||
          match?.metadata?.url ||
          `Vector ${index + 1}`,
        type: "vector"
      }))
    ];

    // Build context for the LLM
    const context = [
      ...webResults.map(
        (item, index) =>
          `[W${index + 1}][WEB]\nTitle: ${item.title || ""}\nURL: ${
            item.url || ""
          }\nContent: ${item.content || ""}`
      ),
      ...vectorMatches.map(
        (match, index) =>
          `[V${index + 1}][VECTOR]\nContent: ${
            match?.metadata?.text || ""
          }`
      )
    ].join("\n\n");

    // Setup SSE streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send citations first
    res.write(`data: ${JSON.stringify({ citations })}\n\n`);

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
    console.error("Chat error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || "Chat failed"
      });
    } else {
      res.end();
    }
  }
});

export default router;