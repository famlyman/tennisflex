<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Next.js 16 Key Breaking Changes (v15 → v16)

| Change | Details |
|---|---|
| **Async Request APIs** | `params`, `searchParams`, `cookies()`, `headers()` are Promises — sync access removed |
| **`middleware` → `proxy`** | File renamed, export renamed to `proxy`, uses `NextProxy` type |
| **Turbopack default** | No `--turbopack` flag needed; use `--webpack` to opt out |
| **`experimental.turbopack`** → `turbopack` | Config promoted to top-level |
| **`experimental.dynamicIO`** → `cacheComponents` | `cacheComponents: true` enables PPR + `'use cache'` |
| **`cacheLife`/`cacheTag` stable** | Remove `unstable_` prefix from imports |
| **`revalidateTag` requires 2nd arg** | Must pass `cacheLife` profile (e.g. `'max'`) |
| **`updateTag` (new)** | Read-your-writes cache invalidation (Server Actions only) |
| **`next lint` removed** | Use ESLint CLI directly |
| **ESLint flat config default** | `eslint.config.*` instead of `.eslintrc` |
| **`next/legacy/image` deprecated** | Use `next/image` |
| **`images.domains` deprecated** | Use `images.remotePatterns` |
| **Parallel routes need `default.js`** | Build fails without it |
| **Image metadata params/id async** | `opengraph-image`, `icon`, `sitemap` params are Promises |
| **React Compiler stable** | `reactCompiler: true` in config (not default) |
| **`unstable_instant`** | New route segment config for instant navigation validation (requires `cacheComponents`) |
| **Concurrent dev/build** | Separate output dirs (`.next/dev`) |
<!-- END:nextjs-agent-rules -->

## Spring 2025 Session Progress

### Goals
- Strengthen coordinator authorization on season-level API routes, place affiliate links, fix doubles partner notification flow, and seed/test doubles match generation.

### Constraints & Preferences
- Affiliate links should open in a new tab (`target="_blank"`).
- External links auto-detect via `link.startsWith('http')` in PromoCard.
- Doubles partner selection is auto-confirmed for now (no accept/decline flow).
- Match generator uses `partner_id` + `partner_status = 'confirmed'` on `season_registrations`.
- Player registration should check both `profile_id` AND `partner_id` to prevent duplicate registration.

### Progress
#### Done
- Created `src/utils/auth.ts` — shared `checkCoordinator(userId, organizationId)` helper querying `coordinators` table.
- **POST /api/seasons** — added `checkCoordinator(user.id, organization_id)` before creating season.
- **POST /api/divisions** — added coordinator checks for `create_division`, `delete_division`, `create_skill_level`, `delete_skill_level` (each resolves parent org via season chain).
- **PATCH /api/flags/[id]** — added full auth (`cookies()` + `getUser()`) and coordinator check via target player's `organization_id`.
- **Affiliate links placed**:
  - Penn balls → Landing page slot 1 (`https://amzn.to/3Pcg58x`)
  - Wilson balls → Landing page slot 2 (`https://amzn.to/49tdk9E`)
  - Get A Grip overgrip → Dashboard sidebar (`https://amzn.to/3P3wkoq`)
- **PromoCard** — auto-detects external links and adds `target="_blank" rel="noopener noreferrer"`.
- **Partner notification** — when player registers for doubles with an existing partner (`partner_status = 'confirmed'`), a notification is sent to the partner (`type: 'partner_added'`).
- **Registration page blocked for partners** — `src/app/seasons/[id]/register/page.tsx` now also queries registrations by `partner_id` in `playerIds`, merging them into `existingRegistrations` so the partner sees the division as already registered.
- **Created** `supabase/seed_doubles_pairings.sql` — dynamic SQL that pairs existing players by gender into doubles teams (updated for org `tennis-flex-foothills`, season `Summer Flex 2026`).
- **Match generation ran** — 176 matches created across Men's, Women's, and Mixed Doubles.
- **Skill level API** — added `home_partner` and `away_partner` joins.
- **Skill level page** — updated `Match` interface with `home_partner`/`away_partner`; match cards show team names for doubles with both TFR-D ratings.
- **Season detail page** — added `home_partner_id`/`away_partner_id` to query, resolved partner names, match rows show team names.
- **Dashboard** — added partner joins to match query; `opponent_name` includes partner name for doubles matches; match filter now includes `home_partner_id`/`away_partner_id` so partners see their matches; added `player_team_name` for full "Player & Partner vs Opponent & Partner" display in `YourMatchesCard` and `NextMatchHero`.
- **TFR display** — fixed display to show `tfr_doubles` alongside partner names; created `supabase/fix_tfr_doubles.sql` to fix seed data with `tfr_doubles = 0`.
- **Created** `supabase/complete_matches.sql` — completes 95% of matches with realistic scores for season-end simulation.

### In Progress
- *(none)*

### Blocked
- Build fails during static generation of `/profile` — Supabase env vars not set in this environment (pre-existing, production works).

### Key Decisions
- Doubles partner confirmation is auto-confirmed on registration; no accept/decline flow needed yet.
- Match data is correct (`home_partner_id`/`away_partner_id` in DB) — frontend was the gap.
- Seed SQL uses dynamic player lookups (by gender + organization) instead of hardcoded profile UUIDs from `seed.sql`.
- TFR starts at NTRP × 10 at registration, then updates dynamically via `updatePlayerRatings()` after each completed match.

### Relevant Files
- `src/utils/auth.ts`: shared `checkCoordinator` helper
- `src/app/api/seasons/route.ts`: POST coordinator check
- `src/app/api/divisions/route.ts`: POST coordinator checks for all division/skill-level mutations
- `src/app/api/flags/[id]/route.ts`: PATCH auth + coordinator check
- `src/components/PromoCard.tsx`: external link detection + `target="_blank"`
- `src/app/api/seasons/[id]/register/route.ts`: partner notification logic
- `src/app/seasons/[id]/register/page.tsx`: partner registration blocking
- `src/app/seasons/[id]/skill-level/[skillLevelId]/page.tsx`: team display for doubles
- `src/app/seasons/[id]/page.tsx`: partner names in match rows
- `src/app/dashboard/page.tsx`: partner joins + team names for both sides
- `src/app/api/skill-levels/[id]/route.ts`: partner joins in API response
- `src/components/YourMatchesCard.tsx`: full "Player & Partner vs Opponent & Partner" display
- `src/components/NextMatchHero.tsx`: full team display in hero section
- `supabase/seed_doubles_pairings.sql`: dynamic doubles pairings seed
- `supabase/fix_tfr_doubles.sql`: fix `tfr_doubles = 0` seed values
- `supabase/complete_matches.sql`: 95% match completion for simulation
- `src/types/database.ts`: Database type definitions
- `src/utils/supabase.ts`: `createAdminClient()` function
