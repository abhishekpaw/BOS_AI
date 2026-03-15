import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.routes.js";
import ingestRouter from "./routes/ingest.routes.js";
import healthRouter from "./routes/health.routes.js";
import searchRouter from "./routes/search.routes.js";

console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" || "https://bos-ai-p1c4.onrender.com"}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/health", healthRouter);
app.use("/api/chat", chatRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/search", searchRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});