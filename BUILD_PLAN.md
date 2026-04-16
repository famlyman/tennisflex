# Tennis-Flex: Build Plan

## Concept
A multi-tenant platform for local tennis leagues with a "chapter" model. Tennis-Flex is the brand; each area operates as its own chapter (e.g., "Tennis-Flex Foothills") with local branding, seasons, and community.

### Structure
- **Tennis-Flex** (brand) - Main site explaining the platform, "Find Your Chapter" search
- **Chapters** (tenants) - Local areas, each with own homepage and seasons
- **Platform Owner** - Manages all chapters, approves new chapter requests

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Web** | Next.js PWA (landing + chapter dashboards) |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Auth** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **Ratings** | Custom TFR (Tennis-Flex Rating) |

---

## Chapter Model

### How It Works
1. **Platform owner** creates first chapter (e.g., Tennis-Flex Foothills)
2. Anyone can "Request a Chapter" on the main site
3. Platform owner approves and creates new chapters
4. Each chapter has its own:
   - Branded homepage (subdomain or subpath)
   - Coordinators who run seasons
   - Players who join seasons
   - Divisions and skill levels

### Data Model
```
Platform Owner
└── Chapters (tenants)
    ├── Chapter Admin (coordinator)
    ├── Season
    │   ├── Division
    │   │   ├── Skill Level (NTRP buckets)
    │   │   │   └── Player
    │   │   │       ├── TFR ratings
    │   │   │       ├── Match history
    │   │   │       └── Flag count
    │   │   └── Match
    │   └── Rating Flag
    └── Message
```

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `chapters` | Local areas (tenants) |
| `chapter_requests` | Expansion requests awaiting approval |
| `coordinators` | Chapter admins |
| `seasons` | Season configs |
| `divisions` | Men's/Women's Singles/Doubles, Mixed |
| `skill_levels` | NTRP buckets |
| `players` | User profiles + TFR |
| `matches` | Match scheduling |
| `messages` | In-app chat |
| `rating_flags` | Anti-sandbagging |
| `extensions` | Extension requests |

---

## App Flow

### 1. Landing Page (tennisflex.com)
- What is Tennis-Flex
- "Find Your Chapter" - browse/search active chapters
- "Request a Chapter" - apply to start a new chapter

### 2. Chapter Homepage (tennisflex.com/[chapter])
- Local branding
- Active/past seasons
- How to join

### 3. Player Journey
1. Find chapter → Register
2. Self-report NTRP
3. Join season
4. View matches, chat with opponent
5. Submit/verify scores
6. Build rating

### 4. Coordinator Journey
1. Request chapter or join existing
2. Create season → Configure
3. Monitor matches
4. Review flags, override ratings

---

## Tennis-Flex Rating (TFR) Algorithm

### Foundation
- **Initial Rating:** Self-reported NTRP × 10
- **Scale:** 10-165 (mirrors NTRP)

### Separate Tracks

| Play Type | Rating |
|-----------|--------|
| Singles | TFR-S |
| Doubles | TFR-D |

### Rating Change

| Result | Points |
|--------|--------|
| Upset win | +8 to +15 |
| Expected win | +5 to +8 |
| Close loss | -3 to -5 |
| Blowout loss | -8 to -12 |

### Confidence Badges

| Matches | Badge | Display |
|---------|-------|---------|
| 0-4 | Projected | 3.5(P) |
| 5-19 | Developing | 3.5 |
| 20+ | Established | 3.5★ |

---

## Anti-Sandbagging

| Layer | Mechanism |
|-------|----------|
| Auto-Adjustment | TFR corrects over time |
| Peer Reporting | Players flag suspicious |
| Coordinator Review | Manual override |

---

## Implementation Order

| Phase | Task | Status |
|-------|------|--------|
| 1 | Landing page + Auth | ✅ Complete |
| 2 | Supabase schema | ✅ Complete |
| 3 | PWA setup | ✅ Complete |
| 4 | Chapter model | ✅ Complete |
| 5 | Find Chapter UI | ⏳ Pending |
| 6 | Request Chapter flow | ✅ Complete |
| 7 | Chapter dashboard | ⏳ Pending |
| 8 | Player registration | ✅ Complete |
| 9 | Match pages + messaging | ⏳ Pending |
| 10 | Score submission | ⏳ Pending |
| 11 | Leaderboard | ⏳ Pending |
| 12 | TFR algorithm | ⏳ Pending |
| 13 | Anti-sandbagging | ⏳ Pending |

---

## Completed

### Phase 1: Landing Page + Auth ✅
- Landing page with hero, features, TFR explanation
- Login/Register
- Auth callback
- Dashboard

### Phase 4 & 6: Chapter Model & Request Flow ✅
- Multi-tenant organization structure
- Public "Request a Chapter" form
- Admin Approval/Denial API and UI
- Automated Coordinator onboarding via email/magic-links

### Auth Improvements ✅
- **Set Password Page:** Dedicated UI for invited/new users to set credentials.
- **Forgot Password Flow:** Full reset cycle with email notification.
- **Enhanced Auth Callback:** Support for `next` redirect parameters.
- **Dev Tooling:** Magic-link terminal logging to bypass Supabase email rate limits.

### Phase 2: Supabase Setup ✅
- Database schema
- RLS policies

### Phase 3: PWA ✅
- Manifest
- Service worker
- Icons
- Offline support

### Phase 7: Scheduling Algorithm ✅
- Auto-generate schedules after registration closes
- Round-robin/Swiss pairing

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing + Find Chapter
│   │   ├── manifest.ts        # PWA manifest
│   │   ├── [chapter]/        # Chapter homepage
│   │   ├── register/         # Player registration
│   │   ├── dashboard/        # Coordinator dashboard
│   │   └── admin/           # Platform owner admin
│   └── components/
└── public/
    ├── icon-*.png
    └── sw.js
```