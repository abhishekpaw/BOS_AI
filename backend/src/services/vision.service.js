import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeImage(buffer, prompt) {
  const base64 = buffer.toString("base64");

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64}`
            }
          }
        ]
      }
    ]
  });

  return {
    content: response.choices?.[0]?.message?.content || ""
  };
}