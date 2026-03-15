import Tesseract from "tesseract.js";

export async function extractImageText(buffer) {
  const result = await Tesseract.recognize(buffer, "eng");
  return result?.data?.text?.trim() || "";
}