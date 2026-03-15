import { Router } from "express";
import multer from "multer";
import { extractImageText } from "../services/ocr.service.js";
import { analyzeImage } from "../services/vision.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/ocr", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "image is required" });
    }

    const text = await extractImageText(req.file.buffer);
    res.json({ text });
  } catch (error) {
    next(error);
  }
});

router.post("/analyze", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "image is required" });
    }

    const result = await analyzeImage(req.file.buffer, req.body.prompt || "Describe this image in detail.");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;