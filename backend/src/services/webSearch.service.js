import axios from "axios";

export async function searchWeb(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const response = await axios.post("https://api.tavily.com/search", {
    api_key: apiKey,
    query,
    search_depth: "advanced",
    include_answer: false,
    max_results: 5
  });

  return (response.data?.results || []).map((item) => ({
    title: item.title,
    url: item.url,
    content: item.content
  }));
}