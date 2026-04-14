// src/lib/route-helpers.ts
// Shared error handling for all new API routes (Phases 20+)
// Do NOT retrofit into existing routes — apply to new routes only.

import { ZodError } from 'zod';

export function handleRouteError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      { error: 'Validation failed', details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    console.error(`[API Error] ${error.message}`, error.stack);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
  console.error('[API Error] Unknown error', error);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
