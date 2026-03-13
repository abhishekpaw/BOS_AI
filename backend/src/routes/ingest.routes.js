import { Router } from "express";
import multer from "multer";
import { extractPdfText } from "../services/pdf.service.js";
import { scrapeWebsiteText } from "../services/scrape.service.js";
import { chunkText } from "../utils/chunkText.js";
import { embedTexts } from "../services/openai.service.js";
import { upsertVectors } from "../services/pinecone.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/pdf", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required" });

    const text = await extractPdfText(req.file.buffer);
    const chunks = chunkText(text, 1200, 200);
    const embeddings = await embedTexts(chunks);

    await upsertVectors(chunks, embeddings, {
      sourceType: "pdf",
      filename: req.file.originalname
    });

    res.json({ message: "PDF ingested successfully", chunks: chunks.length });
  } catch (error) {
    next(error);
  }
});

router.post("/web", async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    const text = await scrapeWebsiteText(url);
    const chunks = chunkText(text, 1200, 200);
    const embeddings = await embedTexts(chunks);

    await upsertVectors(chunks, embeddings, {
      sourceType: "web",
      url
    });

    res.json({ message: "Website ingested successfully", chunks: chunks.length });
  } catch (error) {
    next(error);
  }
});

export default router;