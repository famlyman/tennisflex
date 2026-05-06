# GEMINI.md

## Project Overview
**Tennis-Flex** is a multi-tenant mobile-first application designed for coordinators to create flexible tennis "seasons." Players can register by skill level, get matched, and compete on their own schedules. The project features a custom rating system (TFR - Tennis-Flex Rating) and a robust anti-sandbagging mechanism.

### Core Concepts
- **Multi-tenancy:** Organizations (tenants) can host their own seasons, divisions, and player bases.
- **Tennis-Flex Rating (TFR):** A proprietary rating algorithm inspired by Glicko-2, tracking both Singles (TFR-S) and Doubles (TFR-D) independently.
- **Anti-Sandbagging System:** A three-layer approach combining auto-adjustment rules, peer reporting (flags), and coordinator review/override authority.
- **Hybrid Promotion System:** A "native-first" monetization strategy combining direct sponsorships, affiliate gear recommendations, and partnership placeholders.

### Current Tech Stack
- **Web:** Next.js (landing page, player dashboard, coordinator tools)
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling:** Tailwind CSS (Enterprise standards for contrast and spacing)

---

## Current Status
The project has transitioned from the **Planning phase** to **Active Development**. Core features are being stabilized with a focus on hydration performance and registration UX.

### Key Accomplishments (as of May 6, 2026)
- **Hybrid Promotion System:** Implemented a full promotion engine with a `promotions` table and a premium `PromoCard` component for monetization.
- **Location-Based Discovery:** Added real-time search and one-click geolocation to the "Find Your Flex" landing page section.
- **UI Unification:** Synchronized the aesthetic between the marketing landing page and the Player Dashboard (Season Hub) for a seamless "premium" feel.
- **TFR Standardization:** Audited and synchronized TFR logic (whole-number display, 10-80 scale) and leaderboard sorting (Wins -> Win % -> Total Matches) across all APIs and UI components.
- **Timezone-Aware Scheduling:** Fixed a major bug in match coordination by correctly handling local-to-UTC conversions during scheduling.
- **Sleek Dashboard Navigation:** Implemented an expandable "Your Matches" card with intelligent "next-up" sorting for better mobile ergonomics.
- **Doubles Team Support:** Overhauled match generation and Match Hub to support 2v2 play (Men's, Women's, and Mixed).

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
