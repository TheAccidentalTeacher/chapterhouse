"""Tavily web search tool for Council agents."""
import os
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

try:
    from tavily import TavilyClient
    _tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", "")) if os.getenv("TAVILY_API_KEY") else None
except ImportError:
    _tavily = None


class SearchInput(BaseModel):
    query: str = Field(description="Search query to look up")


class SearchTool(BaseTool):
    name: str = "web_search"
    description: str = (
        "Search the web for current information. Use for standards lookups, "
        "pedagogical research, and fact-checking curriculum claims."
    )
    args_schema: type[BaseModel] = SearchInput

    def _run(self, query: str) -> str:
        if _tavily is None:
            return f"[Search unavailable — TAVILY_API_KEY not set. Query was: {query}]"
        try:
            result = _tavily.search(query=query, max_results=5)
            snippets = [
                f"- {r.get('title', '')}: {r.get('content', '')[:300]}"
                for r in result.get("results", [])
            ]
            return "\n".join(snippets) if snippets else "No results found."
        except Exception as exc:
            return f"[Search error: {exc}]"
