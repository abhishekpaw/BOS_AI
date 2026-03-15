import { Router } from "express";
import multer from "multer";
import { extractPdfText } from "../services/pdf.service.js";
import { chunkText } from "../utils/chunkText.js";
import { embedTexts } from "../services/openai.service.js";
import { upsertVectors } from "../services/pinecone.service.js";
import { saveUserFile } from "../services/storage.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/file", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const saved = await saveUserFile({
      userId: req.user.id,
      filename: req.file.originalname,
      buffer: req.file.buffer
    });

    let text = "";
    if (req.file.mimetype === "application/pdf") {
      text = await extractPdfText(req.file.buffer);
    } else {
      text = req.file.buffer.toString("utf-8");
    }

    const chunks = chunkText(text, 1200, 200);
    const embeddings = await embedTexts(chunks);

    await upsertVectors(chunks, embeddings, {
      sourceType: "file",
      filename: req.file.originalname,
      userId: req.user.id,
      storedFilename: saved.filename
    });

    res.json({
      message: "File uploaded and indexed successfully",
      filename: req.file.originalname,
      storedFilename: saved.filename,
      chunks: chunks.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;