# GEMINI.md

## Project Overview
**Tennis-Flex** is a multi-tenant mobile-first application designed for coordinators to create flexible tennis "seasons." Players can register by skill level, get matched, and compete on their own schedules. The project features a custom rating system (TFR - Tennis-Flex Rating) and a robust anti-sandbagging mechanism.

### Core Concepts
- **Multi-tenancy:** Organizations (tenants) can host their own seasons, divisions, and player bases.
- **Tennis-Flex Rating (TFR):** A proprietary rating algorithm inspired by Glicko-2, tracking both Singles (TFR-S) and Doubles (TFR-D) independently.
- **Anti-Sandbagging System:** A three-layer approach combining auto-adjustment rules, peer reporting (flags), and coordinator review/override authority.

### Current Tech Stack
- **Web:** Next.js (landing page, player dashboard, coordinator tools)
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling:** Tailwind CSS (Enterprise standards for contrast and spacing)

---

## Current Status
The project has transitioned from the **Planning phase** to **Active Development**. Most core features for individual play are implemented and being stabilized.

### Key Accomplishments (as of May 3, 2026)
- **Unified Dashboard:** Dynamic player/coordinator views with automated leaderboard context.
- **TFR Algorithm:** Fully implemented with whole-number display rounding and automated updates on score submission.
- **Match Hub:** Real-time coordination with chat, scheduling, and verified score submission.
- **PWA Ready:** Manifest and service worker configured for mobile-first experience.

---

## Development Roadmap
Following the phase-based approach in `BUILD_PLAN.md`:
1.  **Phase 1-5:** Auth, Supabase Schema, TFR Algorithm, Dashboard (Completed/Stabilized)
2.  **Phase 6-10:** Match Generation, Score Submission, Verification, Leaderboards (Completed/Stabilized)
3.  **Phase 11+:** NTRP Verification, Season Completion Batching, Stripe Integration (Planned)

---

## Instructions for Gemini CLI
- **Design Standard:** Always use high-contrast dark text (e.g., `text-slate-900`) on light backgrounds for readability.
- **Rounding:** TFR ratings (10-80 scale) must always be displayed as rounded whole numbers using `Math.round`.
- **Logic:** Prioritize win percentage and total wins for leaderboard rankings.
- **Multi-tenancy:** Maintain strict RLS policies scoped to the `Organization` or `Player` records.

---

## Building and Running
The project is a standard Next.js application.
```bash
npm install
npm run dev
```
Check `todo_next.md` for the immediate implementation queue.
