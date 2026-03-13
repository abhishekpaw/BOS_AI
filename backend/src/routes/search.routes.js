import { Router } from "express";
import { searchWeb } from "../services/webSearch.service.js";

const router = Router();

router.post("/web", async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    const results = await searchWeb(query);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;