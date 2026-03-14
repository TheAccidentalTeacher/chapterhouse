# council-worker

FastAPI + CrewAI multi-agent Council service. Deployed to Railway as a separate Python service.

## Setup

```bash
pip install -r requirements.txt
```

## Run locally

```bash
uvicorn main:app --reload --port 8000
```

## Environment variables

| Var | Required | Description |
|-----|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `QSTASH_CURRENT_SIGNING_KEY` | Yes (prod) | QStash webhook signature key |
| `QSTASH_NEXT_SIGNING_KEY` | No | For key rotation |
| `TAVILY_API_KEY` | Recommended | Web search for agents. Falls back to no-op if not set. |

## Routes

- `GET /health` — Railway health check
- `POST /council-session` — QStash webhook endpoint; runs a full 5-agent Council session

## Deploy to Railway

1. Create a new Railway service
2. Point it at the `council-worker/` directory (set the root directory in Railway)
3. Railway will detect the Dockerfile automatically
4. Add all env vars in Railway dashboard
5. Copy the Railway public URL → set as `COUNCIL_WORKER_URL` in Vercel + TypeScript worker
