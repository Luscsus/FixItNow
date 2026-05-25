import { GoogleGenAI } from "@google/genai";

export async function classifyCategory(problemText: string, categories: string[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || categories.length === 0) {
    return categories[0] ?? "OTHER";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a home/office service category classifier. Given a problem description, pick the single best matching category from this exact list:
${categories.join(", ")}

Problem: "${problemText}"

Respond with ONLY the category key from the list above. No explanation, no punctuation, just the key.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = (response.text ?? "").trim().toUpperCase().replace(/[^A-Z_]/g, "");
  return categories.includes(text) ? text : categories[0];
}
