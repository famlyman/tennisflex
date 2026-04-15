# GEMINI.md

## Project Overview
**Tennis-Flex** is a multi-tenant mobile-first application designed for coordinators to create flexible tennis "seasons." Players can register by skill level, get matched, and compete on their own schedules. The project features a custom rating system (TFR - Tennis-Flex Rating) and a robust anti-sandbagging mechanism.

### Core Concepts
- **Multi-tenancy:** Organizations (tenants) can host their own seasons, divisions, and player bases.
- **Tennis-Flex Rating (TFR):** A proprietary rating algorithm inspired by Glicko-2, tracking both Singles (TFR-S) and Doubles (TFR-D) independently.
- **Anti-Sandbagging System:** A three-layer approach combining auto-adjustment rules, peer reporting (flags), and coordinator review/override authority.

### Planned Tech Stack
- **Mobile:** Expo / React Native
- **Web:** Next.js (landing page + coordinator dashboard)
- **Backend/DB:** Supabase (PostgreSQL, Edge Functions, Auth, Realtime)

---

## Current Status
The project is currently in the **Planning/Design phase**. All foundational architectural decisions and the implementation roadmap are documented in `BUILD_PLAN.md`.

### Key Files
- **`BUILD_PLAN.md`**: The primary source of truth for the project's concept, tech stack, TFR algorithm, data model, and implementation phases.

---

## Development Roadmap
The project is intended to follow the phase-based approach outlined in `BUILD_PLAN.md`:
1.  **Phase 1:** Landing Page + Auth
2.  **Phase 2:** Supabase Setup (schema, RLS, Edge Functions)
3.  **Phase 3:** TFR Algorithm Implementation
4.  **Phase 4:** Coordinator Dashboard
5.  **...** (See `BUILD_PLAN.md` for full details)

---

## Instructions for Gemini CLI
- **Refer to `BUILD_PLAN.md`** for all architectural decisions, data models, and feature requirements.
- **Adhere to the planned project structure** (Monorepo with `apps/`, `packages/`, and `supabase/` directories) when starting implementation.
- **Implement the TFR algorithm** exactly as specified in the "Tennis-Flex Rating (TFR) Algorithm" section of the build plan.
- **Maintain multi-tenancy** by ensuring all data models and RLS (Row Level Security) policies are scoped to the `Organization`.

---

## Building and Running
*No code has been implemented yet.*
Refer to `BUILD_PLAN.md` for the planned tech stack and implementation steps.
