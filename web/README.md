# Chapterhouse Web App

This is the application shell for Chapterhouse.

It lives in `web/` so the repo can keep both:
- the strategic documentation at the root
- the actual app in a clean deployable folder

## Current State

The app currently includes:
- a real Next.js app shell
- the Chapterhouse navigation structure
- placeholder routes for all major screens
- a seeded Daily Brief screen
- a seeded Documents screen
- environment-status reporting without exposing secret values
- Supabase client stubs for the next build pass

## Local Setup

1. Install dependencies:
	- `npm install`
2. Create a local env file:
	- copy `.env.example` to `.env.local`
3. Start the app:
	- `npm run dev`

Then open <http://localhost:3000>.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run check`

## Immediate Next Build Targets

1. wire Supabase auth and storage
2. add checked-in migrations
3. move Daily Brief from seeded UI to stored records
4. ingest core documents into structured metadata
5. add retrieval and citations

## Related Docs

- [../chapterhouse-mvp-build-checklist.md](../chapterhouse-mvp-build-checklist.md)
- [../chapterhouse-coding-plan.md](../chapterhouse-coding-plan.md)
- [../chapterhouse-ui-spec.md](../chapterhouse-ui-spec.md)
- [../chapterhouse-technical-architecture-spec.md](../chapterhouse-technical-architecture-spec.md)
