export async function classifyCategory(problemText: string, categories: string[]): Promise<string> {
  if (categories.length === 0) return "OTHER";

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

  try {
    const response = await fetch(`${apiBase}/api/v1/providers/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemText, categories }),
    });

    if (!response.ok) return categories[0];

    const data = (await response.json()) as { category?: string };
    return data.category && categories.includes(data.category) ? data.category : categories[0];
  } catch {
    return categories[0];
  }
}
