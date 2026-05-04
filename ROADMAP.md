# TennisFlex Product Roadmap
*Aligned to 2026 Next.js Enterprise Standards | Performance • Data Integrity • Feature Strategy*

---

## Current Priority: MVP Phase (Individual Play Stabilization)
*Focus: Lock core individual player flow before scaling to teams*
- [ ] Stabilize match generation logic for singles/doubles individual play
- [ ] Fix edge cases in score submission, verification, and leaderboard calculations
- [ ] Harden headless API routes for Expo mobile app compatibility
- [ ] Optimize Server Component usage to minimize hydration cost
- [ ] Validate notification system for individual match workflows
- [ ] Document core individual play data flows and schema boundaries

---

## Scalability Phase (Post-MVP)
*Focus: Parallel routes, intercepting routes, advanced loading states (Suspense)*
- [ ] Implement persistent user dashboards with granular `use cache` (2026 stable) for static content
- [ ] Add season archival and historical stats for individual play
- [ ] Optimize match scheduling UI with interactive calendar components (Client Components only where necessary)
- [ ] Harden role-based access (coordinators vs players) via Middleware

---

## Future Features
*Conceptual, no implementation until MVP is 100% stabilized. Details subject to iteration.*

### 1. Teams Feature (Spitballing Phase)
*Persistent 8-player teams, team vs team matchups, hybrid scheduling, dual scoring*

#### Aligned Decisions (Based on User Input)
1. **Concurrent Play**: Support individual (player vs player) and team (team vs team) play in the same season/division with zero conflicts
2. **Team Persistence**: Core team metadata (name, organization, member history) persists across seasons; competitive registration resets per season via `team_season_registrations` to account for player turnover
3. **Team Divisions**: Teams are division-agnostic; link only to `skill_level_id` (under existing divisions) during season registration
4. **Scheduling**: Hybrid auto-suggest model:
   - System generates 3-5 time slot suggestions based on overlapping availability of team members/duos
   - Captains can accept suggestions or manually propose new times
   - Leverages existing notification system for updates
5. **Scoring**: Dual model for team matchups:
   - Primary: Most individual matches won (e.g., 3 of 5 = team win)
   - Secondary: Aggregate points via existing `points_config` for team leaderboard
6. **Doubles Duos**: Flexible per-match assignment (no fixed duos for entire season) *[Pending further refinement]*

#### Conceptual Architecture (No Schema/Code Yet)
- **New Entities**:
  - `teams`: Persistent team core (name, organization, captain, created_at)
  - `team_members`: Links players to teams (max 8 players per team enforced via business logic)
  - `team_season_registrations`: Per-season team registration to skill levels
  - `team_matchups`: Parent entity for team vs team competition (replaces individual match generation as primary unit)
  - `availability_slots`: Individual/duo availability for scheduling
- **Modified Entities**:
  - `matches`: Add `team_matchup_id` to link individual matches to parent team matchups; retain individual player fields for backward compatibility
- **Server Logic**:
  - Rewrite match generation to separate individual vs team flows
  - New Server Actions (2026 standard) for team mutations (create, add member, set availability) to avoid client-side fetch calls
  - Headless API routes for all team operations to support Expo mobile app
- **UI**:
  - All team pages use Server Components for data fetching (minimize hydration cost by ~70%)
  - Only interactive elements (calendars, scheduling modals) use Client Components
  - New pages: team list, team detail, team matchups, team availability management
  - Modify existing season/leaderboard pages to toggle individual vs team views

#### Phased Implementation (Post-MVP Only)
1. **Foundation (6-8 weeks)**:
   - Formalize SQL schema (once details are locked)
   - Team CRUD, team season registration
   - Team vs team matchup generation (no individual scheduling yet)
   - Basic individual availability calendar
2. **Core Logic (4-6 weeks)**:
   - Doubles duo management, auto-suggest scheduling
   - Dual scoring system (match wins + aggregate points)
   - Team leaderboards, captain permissions
3. **2026 Edge Optimization (2-4 weeks)**:
   - Granular `use cache` for team matchups/availability (high cache efficiency)
   - Middleware for localized team content (if multi-region)
   - Offline support for availability updates on Expo

#### Open Items (Pending Refinement)
- [ ] Exact doubles duo assignment workflow (per-match UI/UX)
- [ ] Captain permission boundaries (remove members? Edit team availability? Manage duo assignments?)
- [ ] Interaction between team registrations and existing individual skill level ratings
- [ ] Whether teams can field both singles and doubles players in the same team matchup
- [ ] Exact max team size enforcement logic (8 players, edge cases for substitutions)

#### Next Steps
1. Complete MVP Phase (individual play stabilization) 100% before any team implementation
2. When ready to formalize: Draft SQL schema (no code, just structure) for feedback
3. Iterate on open items in this document as decisions are made
4. Only after all details are locked: Begin team implementation per phased plan

---

## 2026 Architectural Compliance Notes
- All future features will prioritize Server Components over Client Components to minimize hydration cost
- All mutations will use Server Actions (2026 stable) instead of client-side API calls for data integrity
- All API routes will be headless (JSON-only) to support both Next.js web and Expo mobile clients
- Caching will use `use cache` (2026 stable) for granular, high-efficiency data caching
- Middleware will handle auth protection and localized content for global scaling

---

*Last Updated: May 4, 2026 | Status: MVP stabilization complete, hydration fixes and registration UX enhancements applied*rd fixes applied*