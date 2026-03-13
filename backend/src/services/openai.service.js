import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedTexts(texts) {
  if (!texts.length) return [];
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts
  });
  return response.data.map((item) => item.embedding);
}

export async function embedQuery(query) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query
  });
  return response.data[0].embedding;
}

export async function streamAnswer({ message, context, onToken, onEnd }) {
  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. Use the provided context when relevant. If context is insufficient, say so clearly."
      },
      {
        role: "user",
        content: `Context:\n${context || "No additional context"}\n\nQuestion:\n${message}`
      }
    ]
  });

  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content || "";
    if (token) onToken(token);
  }

  onEnd();
}