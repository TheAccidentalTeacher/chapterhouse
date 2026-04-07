# Social Media Expansion Build Bible — Pressure Test

Date: April 2, 2026
Primary spec reviewed: [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md)

Implementation context checked against the spec:
- [src/app/api/social/generate/route.ts](src/app/api/social/generate/route.ts)
- [src/app/api/social/accounts/route.ts](src/app/api/social/accounts/route.ts)
- [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts)
- [src/app/api/social/posts/[id]/approve/route.ts](src/app/api/social/posts/[id]/approve/route.ts)
- [src/app/api/youtube/batch/route.ts](src/app/api/youtube/batch/route.ts)
- [src/components/social-review-queue.tsx](src/components/social-review-queue.tsx)
- [worker/src/jobs/router.ts](worker/src/jobs/router.ts)
- [supabase/migrations/20260314_010_create_social_accounts.sql](supabase/migrations/20260314_010_create_social_accounts.sql)
- [supabase/migrations/20260314_011_create_social_posts.sql](supabase/migrations/20260314_011_create_social_posts.sql)
- [supabase/migrations/20260323_023_create_brand_voices.sql](supabase/migrations/20260323_023_create_brand_voices.sql)

---

## Overall Judgment

The update materially improved the build bible.

The big internal prose contradictions from the prior version are mostly gone. The file now has a clearer operating theory, cleaner phase language, and a stronger attempt at technical grounding.

The remaining problems are different now.

This version does not mainly fail because it contradicts itself. It fails where it marks decisions as resolved even though the repo does not yet have the schema, job types, or queue surfaces that those decisions assume.

So the current state is:

- Strategically much better
- Structurally closer
- Still overclaiming readiness

It is close to a greenlight, but not yet a true fully locked build bible.

---

## Findings

### 1. Several newly locked Phase 1 decisions are described as if the underlying entities already exist, but they do not.

Severity: High

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L4) says D126-D129 are added and the file is ready for Phase 1 development.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L483) says newsletter drafts live in social_posts with a content_type='newsletter' column.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L484) says YouTube batch jobs use the existing jobs table with type: youtube_batch_playlist.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L488) says user_id NOT NULL is now locked for all social tables.

Evidence in the repo:
- [supabase/migrations/20260314_011_create_social_posts.sql](supabase/migrations/20260314_011_create_social_posts.sql#L4) through [supabase/migrations/20260314_011_create_social_posts.sql](supabase/migrations/20260314_011_create_social_posts.sql#L36) define no content_type column and no user_id column.
- [supabase/migrations/20260314_010_create_social_accounts.sql](supabase/migrations/20260314_010_create_social_accounts.sql#L5) through [supabase/migrations/20260314_010_create_social_accounts.sql](supabase/migrations/20260314_010_create_social_accounts.sql#L20) define no user_id column.
- [worker/src/jobs/router.ts](worker/src/jobs/router.ts#L40) and [worker/src/jobs/router.ts](worker/src/jobs/router.ts#L44) only know about social_batch and youtube_transcript in the social/video lane. There is no youtube_batch_playlist job type.

Why this matters:
- A build bible can absolutely introduce new migrations and new job types.
- But this file is currently speaking about those things as if they are already part of the existing system rather than explicit Phase 1 implementation work.
- That weakens the spec because it hides required migrations under the label of resolved architecture.

Recommendation:
- Reword Section 6.1a so it distinguishes existing tables from required Phase 1 additions.
- Add an explicit Phase 1 schema delta list:
  - social_posts: add user_id
  - social_posts: add content_type if newsletter drafts truly share the queue
  - social_accounts: add user_id
  - jobs: add youtube_batch_playlist if that is the real job type

### 2. The new YouTube Phase 1 promise is still underspecified and is not the same thing as the current YouTube batch system.

Severity: High

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L56) says YouTube batch playlist generation is a Phase 1 done condition.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L73) says YouTube batch is a HeyGen API path with 2–3 minute talking-head videos.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L567) locks D120 as YouTube batch playlists in Phase 1.

Evidence in the repo:
- [src/app/api/youtube/batch/route.ts](src/app/api/youtube/batch/route.ts#L1) through [src/app/api/youtube/batch/route.ts](src/app/api/youtube/batch/route.ts#L220) generate curriculum outputs from transcripts, not playlist video generation.
- [worker/src/jobs/router.ts](worker/src/jobs/router.ts#L44) only routes youtube_transcript jobs. There is no HeyGen playlist batch job path.

Why this matters:
- This is not a naming nit. The spec is describing a completely different subsystem.
- The current YouTube batch feature is educational text synthesis across multiple transcripts.
- The build bible now assumes a video-generation pipeline with manual trigger, playlist semantics, and HeyGen integration.

Recommendation:
- Add one dedicated subsection for D120 with exact architecture:
  - trigger surface
  - input payload
  - job type name
  - output storage
  - whether it reuses jobs, documents, or a new table
- Right now D120 is positioned as resolved, but it is really only placed, not designed.

### 3. OI-10 is still marked resolved even though there is no migration evidence for a settings table or publishing_paused flag.

Severity: High

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L292) defines publishing_paused on a settings table as locked behavior.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L533) marks OI-10 resolved.

Evidence in the repo:
- No migration match exists at all for settings or publishing_paused in supabase/migrations.

Why this matters:
- This is another case where a future migration is being described as an already-resolved platform capability.
- If publishing pause is a hard operational control, it needs to be treated as a required implementation item, not just a declared preference.

Recommendation:
- Convert OI-10 from resolved to resolved architecturally, migration required, or add the explicit migration as part of the build brief.
- If the table already exists elsewhere outside migrations, point to the actual file and stop making it invisible.

### 4. D122 is still structurally risky: the spec acknowledges platform divergence, but still locks direct brand-level auto-writes as Phase 1 behavior.

Severity: Medium

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L299) through [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L314) define the edit-to-learn loop.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L307) says the loop auto-updates the brand_voices text box directly.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L311) acknowledges that brand_voices is keyed per brand, not per brand+platform.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L569) locks D122 anyway.

Evidence in the repo:
- [supabase/migrations/20260323_023_create_brand_voices.sql](supabase/migrations/20260323_023_create_brand_voices.sql#L8) through [supabase/migrations/20260323_023_create_brand_voices.sql](supabase/migrations/20260323_023_create_brand_voices.sql#L22) define one row per brand.
- [src/app/api/social/generate/route.ts](src/app/api/social/generate/route.ts#L88) and [src/app/api/social/generate/route.ts](src/app/api/social/generate/route.ts#L94) assemble generation from brand-level full_voice_prompt values.

Why this matters:
- The spec itself says Facebook, Instagram, and LinkedIn should behave differently by brand.
- If Scott edits LinkedIn tone, and that edit writes straight back to the brand-wide source of truth, Instagram and Facebook can get polluted by LinkedIn-only changes.

Recommendation:
- Do not directly mutate full_voice_prompt as the first Phase 1 implementation.
- Store learned refinements separately with brand and optional platform scope, then compose them at generation time.
- The note about future divergence is good, but the locked behavior is still too aggressive for the actual schema.

### 5. The Phase 1 migration plan correctly identifies deprecated brands/platforms, but it still understates the blast radius in the live app.

Severity: Medium

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L492) through [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L501) define the cleanup plan.

Evidence in the repo:
- [src/app/api/social/generate/route.ts](src/app/api/social/generate/route.ts#L6) still accepts alana_terry.
- [src/app/api/social/generate/route.ts](src/app/api/social/generate/route.ts#L39) still contains Alana Terry fallback prompt rules.
- [src/app/api/social/accounts/route.ts](src/app/api/social/accounts/route.ts#L5) and [src/app/api/social/accounts/route.ts](src/app/api/social/accounts/route.ts#L6) still accept alana_terry, threads, tiktok, youtube, and pinterest.
- [supabase/migrations/20260314_010_create_social_accounts.sql](supabase/migrations/20260314_010_create_social_accounts.sql#L10) and [supabase/migrations/20260314_010_create_social_accounts.sql](supabase/migrations/20260314_010_create_social_accounts.sql#L11) still allow the legacy matrix.
- [supabase/migrations/20260314_011_create_social_posts.sql](supabase/migrations/20260314_011_create_social_posts.sql#L13) and [supabase/migrations/20260314_011_create_social_posts.sql](supabase/migrations/20260314_011_create_social_posts.sql#L14) still allow the legacy matrix.
- [src/components/social-review-queue.tsx](src/components/social-review-queue.tsx#L23) and [src/components/social-review-queue.tsx](src/components/social-review-queue.tsx#L37) still contain Alana Terry labels and ordering assumptions.

Why this matters:
- The spec treats this like a thin cleanup.
- In reality it spans route validation, fallback prompts, labels, brand ordering, schema constraints, possibly seeded brand_voices rows, and any help/debug text that still assumes the old brand set.

Recommendation:
- Rename Section 6.3 from a cleanup note to a proper de-legacy checklist.
- Include:
  - API validation updates
  - schema constraint migrations
  - brand voice seed cleanup
  - UI label/order cleanup
  - navigation/help copy cleanup where relevant

### 6. The blog-first pipeline is now conceptually coherent, but still not operationally specified enough to deserve resolved status.

Severity: Medium

Evidence in the spec:
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L54) defines blog-first pipeline behavior.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L272) says newsletter drafts appear in the queue.
- [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L574) and [social-media-expansion-build-bible.md](social-media-expansion-build-bible.md#L575) lock D127 and D128.

Evidence in the repo:
- There is no visible blog publishing pipeline under the social feature area.
- Newsletter generation exists in Content Studio, but not as a queue-backed content type linked to the social pipeline.

Why this matters:
- The idea is fine.
- The unresolved part is the state machine:
  - where blog drafts are created
  - what counts as published in Shopify
  - what exact event triggers newsletter draft creation
  - whether queue entries for newsletter drafts share social_posts or require a separate table

Recommendation:
- Add one explicit event chain for D127-D128:
  - editorial topic locked
  - blog draft generated
  - human review and publish to Shopify
  - publish success webhook or callback
  - create social variants
  - create newsletter draft
  - queue entries created
- Until that exists, D127-D128 are good direction, not fully locked implementation.

---

## What This Update Fixed

Compared to the previous version, the update did improve several things:

- The old all blockers resolved but still full of SCOTT DECIDES problem is mostly fixed.
- The Threads contradiction is resolved. It is now consistently dropped in the platform matrix.
- The build bible now admits Phase 1 is broader than pure social and stops pretending the extra work is somewhere else.
- Section 6.3 is a real attempt to address legacy drift, which the prior version lacked.
- The D115 reference bug on podcast talking points is fixed by using D112.

So this is not a cosmetic update. It is materially better.

---

## Recommended Next Moves

1. Convert the newly assumed entities into an explicit migration checklist.
   - content_type on social_posts if newsletter drafts really share the queue
   - user_id on social tables
   - publishing_paused storage
   - youtube_batch_playlist job type if D120 remains Phase 1

2. Split resolved in principle from exists in repo.
   - Right now those are getting blurred.
   - The build bible should make required implementation deltas impossible to miss.

3. Soften D122 or redesign it.
   - Direct write-back to brand-level source-of-truth is too blunt for a platform-divergent voice system.

4. Expand Section 6.3 into a proper de-legacy plan.
   - The current repo still carries old values in more places than the table suggests.

5. Add one event-flow diagram for the blog-first pipeline.
   - That is the main architectural promise that still reads more like intent than executable design.

---

## Final Judgment

This version is stronger than the previous one.

It is no longer mainly failing at the strategy layer.

It is now failing at the boundary between declared truth and actual implementation surfaces.

That is progress.

But it still means the file slightly overclaims when it says it is the greenlight to begin Phase 1. The better wording would be:

Phase 1 architecture is largely locked. A short implementation-normalization pass is still required before the spec is truly execution-ready.
