"""Read knowledge from Supabase — briefs, research notes, classroom context."""
import os
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from lib.progress import get_supabase


class SupabaseReadInput(BaseModel):
    table: str = Field(description="Table name to query (briefs, research, notes)")
    limit: int = Field(default=5, description="Number of rows to return (max 20)")
    filter_column: str = Field(default="", description="Optional column to filter on")
    filter_value: str = Field(default="", description="Optional value to filter by")


class SupabaseReadTool(BaseTool):
    name: str = "supabase_read"
    description: str = (
        "Read records from Chapterhouse's Supabase database. "
        "Use to pull in existing briefs, research notes, or classroom context "
        "that Scott has already ingested into the system."
    )
    args_schema: type[BaseModel] = SupabaseReadInput

    def _run(
        self,
        table: str,
        limit: int = 5,
        filter_column: str = "",
        filter_value: str = "",
    ) -> str:
        client = get_supabase()
        if client is None:
            return "[Supabase unavailable — credentials not set]"

        # Whitelist allowed tables to prevent arbitrary reads
        allowed_tables = {"briefs", "research", "notes", "jobs"}
        if table not in allowed_tables:
            return f"[Table '{table}' is not accessible. Allowed: {', '.join(allowed_tables)}]"

        try:
            query = client.table(table).select("*").limit(min(limit, 20))
            if filter_column and filter_value:
                query = query.eq(filter_column, filter_value)
            result = query.execute()
            rows = result.data or []
            if not rows:
                return f"No records found in {table}."
            return "\n\n".join(
                f"[{i+1}] " + ", ".join(f"{k}: {v}" for k, v in row.items() if v is not None)
                for i, row in enumerate(rows)
            )
        except Exception as exc:
            return f"[Supabase read error: {exc}]"
