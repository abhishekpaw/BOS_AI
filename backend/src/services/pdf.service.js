
import pdf from "pdf-parse";

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractPdfText(buffer) {
  try {
    const result = await pdf(buffer);

    if (!result || !result.text) {
      return "";
    }

    // Clean whitespace and normalize text
    const cleanedText = result.text
      .replace(/\r/g, "")
      .replace(/\n+/g, "\n")
      .replace(/\s+/g, " ")
      .trim();

    return cleanedText;

  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}