export function chunkText(text, chunkSize = 1200, overlap = 200) {
  if (!text) return [];

  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks.filter(Boolean);
}