# Tennis-Flex: Build Plan

## Concept
A multi-tenant platform for local tennis leagues. Tennis-Flex is the brand; each area operates as its own "Flex" (e.g., "Tennis-Flex Seattle") with local branding, seasons, and community.

### Structure
- **Tennis-Flex** (brand) - Main site explaining the platform, "Choose Your Flex" search
- **Flexes** (tenants) - Local areas, each with own homepage and seasons
- **Platform Owner** - Manages all Flexes, approves new Flex requests
- **Coordinators** - Run seasons within their Flex

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Web** | Next.js 16 PWA (App Router) |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Auth** | Supabase Auth (magic links, email/password) |
| **Hosting** | Vercel |
| **Ratings** | Custom TFR (Tennis-Flex Rating) |

---

## Data Model

```
Organization (Flex)
├── Coordinator (admin/coordinator)
├── Season
│   ├── Division (singles/doubles type)
│   │   └── SkillLevel (TFR buckets)
│   │       └── Player
│   │           ├── TFR ratings
│   │           └── Match history
│   ├── Match
│   ├── Message
│   └── RatingFlag
└── ChapterRequest (pending Flexes)
```

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Flexes (tenants) |
| `profiles` | User profiles |
| `chapter_requests` | Expansion requests awaiting approval |
| `coordinators` | Flex admins |
| `seasons` | Season configs |
| `divisions` | Men's/Women's Singles/Doubles, Mixed |
| `skill_levels` | TFR rating buckets (stored as NTRP × 10) |
| `players` | Player records with TFR ratings |
| `matches` | Match scheduling and scores |
| `messages` | In-app chat between opponents |
| `rating_flags` | Anti-sandbagging reports |

---

## App Flow

### 1. Landing Page (tennisflex.vercel.app)
- Hero with "Your Game, Your Time"
- How It Works section
- TFR Rating explanation
- "Choose Your Flex" - browse active Flexes
- "Request Your Flex" - apply to start a new Flex

### 2. Flex Homepage (/[slug])
- Local branding (Flex name)
- Active/past seasons
- How to join

### 3. Player Journey
1. Find Flex → Register
2. Self-report NTRP
3. Browse seasons, join during registration
4. View matches, chat with opponent
5. Submit/verify scores
6. Build TFR rating

### 4. Coordinator Journey
1. Request Flex → gets invite email
2. Set password via magic link
3. Create season → Configure divisions & skill levels
4. Open registration
5. Monitor matches
6. Review flags, handle disputes

---

## Tennis-Flex Rating (TFR) Algorithm

### Foundation
- **Initial Rating:** Self-reported NTRP × 10
- **Scale:** 10-165 (mirrors NTRP)
- **Conservative Progression:** ~2-2.5 years (2-3 seasons/year) to move up full point with consistent play

### Separate Tracks

| Play Type | Rating |
|-----------|--------|
| Singles | TFR-S |
| Doubles | TFR-D |

### Rating Change (Conservative)

| Result | Points (vs equal) |
|--------|-------------------|
| Expected win | +0.5 to +1.0 |
| Upset win (vs higher) | +1.0 to +3.0 |
| Close loss | -0.2 to -0.3 |
| Blowout loss | -0.5 to -1.0 |

### Implementation Details
- **Blowout detection:** Average set differential ≥4 games (6-2 or worse)
- **Upset bonus:** +0.1 per TFR point difference (max +2.0)
- **Blowout multiplier:** 1.5× points for blowout wins
- **K-factor:** 32 for <10 matches, 24 for <30, 16 for 30+ (still in code but TFR system takes precedence)
- **Rating bounds:** 10-80 TFR (1.0-8.0 NTRP)
- **Example:** 10-4 record over 14 matches → ~+3-4 TFR (stay in same NTRP level)

### Skill Level Storage
- **Scale:** Ratings stored as TFR (NTRP × 10), e.g., 3.5 NTRP = 35 TFR
- Rating range: 25-165 (2.5 NTRP to 16.5 NTRP equivalent)
- Skill level min/max ratings stored multiplied by 10

### Confidence Badges

| Matches | Badge | Display |
|---------|-------|---------|
| 0-4 | Projected | 3.5(P) |
| 5-9 | Developing | 3.5 |
| 10+ | Established | 3.5★ |

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
| 4 | Flex model | ✅ Complete |
| 5 | Request Flex flow | ✅ Complete |
| 6 | Coordinator onboarding | ✅ Complete |
| 7 | Season creation (with description) | ✅ Complete |
| 8 | Division management | ✅ Complete |
| 9 | Player registration | ✅ Complete |
| 10 | Match pages + scoring | ✅ Complete |
| 11 | Score submission | ✅ Complete |
| 12 | Leaderboard | ✅ Complete |
| 13 | Season registration tracking | ✅ Complete |
| 14 | Doubles partner selection | ✅ Complete |
| 15 | Season page UI improvements | ✅ Complete |
| 16 | Flag review | ✅ Complete |
| 17 | TFR algorithm | ✅ Complete |
| 18 | Error handling pages | ✅ Complete |
 | 19 | Universal match availability system | ✅ Complete |
 | 20 | Notifications system | ✅ Complete |
 | 21 | Dashboard improvements (YourMatchesCard) | ✅ Complete |
 | 22 | Profile page cleanup | ✅ Complete |
 | 23 | Database technical debt fixes | ✅ Complete |
 | 24 | Match Hub & Real-time Coordination | ✅ Complete |

---

## Completed Features

### Phase 24: Match Hub & Real-time Coordination ✅
- **Match Hub Page (`/matches/[id]`)**: A dedicated space for match-specific coordination, moving away from constrained modals.
- **Real-time Chat**: Integrated Supabase Realtime for instant messaging between opponents with auto-scroll and timestamping.
- **Enhanced Coordination Calendar**:
  - Unified view of player availability: You (Indigo), Opponent (Emerald), and Overlap (Purple).
  - Instant availability toggling with immediate database synchronization.
- **Smart Scheduling Logic**: Added "Schedule Best Date" quick action that identifies the first shared availability and proposes it as the official match time.
- **Dashboard Integration**: Upgraded the "Your Matches" card on the player dashboard to act as a portal directly to the Hub.

### Recent Fixes & Platform Stability ✅
- **Service Worker (PWA) Deployment Fix**: Resolved 'text/plain' MIME type errors caused by deployment skew. Implemented a "Network First" strategy for navigation (HTML) and "Cache First" for hashed static assets.
- **API Resilience & ID Migration Support**: 
  - Refactored Messaging and Scheduling APIs to use `adminClient` for critical lookups, resolving RLS and participant-matching issues after player ID swaps/merges.
  - Added comprehensive diagnostic logging and error reporting to the messaging flow.
- **UI Readability & Contrast**: Enforced a "Dark Text on Light Background" policy across the app, specifically fixing the chat input and bubble contrast issues.
- **Dashboard Data Sync**: Updated the dashboard's data fetching to use `profile_id` (Auth ID) as the primary link for registrations, ensuring players see their matches correctly even after account changes.

---

### Phase 1: Landing Page + Auth ✅
- Landing page with hero, features, TFR explanation
- Login/Register with email/password
- Auth callback handling
- Dashboard with role-based views

### Phase 4-6: Flex Model & Request Flow ✅
- Multi-tenant organization structure
- Public "Request Your Flex" form
- Admin UI at /admin/chapters
- Create Flex & Send Invite workflow
- Coordinator onboarding via magic link emails

### Season & Division Management ✅
- Season creation API and page (/seasons/create)
- Division management page (/divisions)
- Add/remove divisions (Men's/Women's Singles/Doubles, Mixed)
- Add/remove skill levels within divisions
- Season description field for coordinator notes
- Skill levels now store ratings in TFR scale (×10)

### Auth Improvements ✅
- Set Password Page for new users
- Forgot Password flow
- Enhanced Auth Callback with `next` redirect support

### PWA ✅
- Manifest with icons
- Service worker for caching
- Offline support

### Match Pages + Score Submission ✅
- Skill level page shows matches with status indicators
- Winner highlighting for completed matches
- Score entry modal with set-by-set dropdowns (0-7)
- Both coordinators and match players can submit scores
- Coordinators can edit any score

### Leaderboard (Per-Division) ✅
- Cascading select: Season → Division → Skill Level
- Division names: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- Ranked by wins, top 20 players
- Link added to coordinator dashboard

### Dashboard Improvements ✅
- Fixed match counts through proper organization→season→division→skill_level chain
- Quick actions: Create Season, Leaderboards, Manage Divisions
- Pending matches count now includes all non-completed matches
- Registration card shows player's season registrations
- Uses admin client to bypass RLS for reliable queries

### Player Registration System ✅
- Multi-division registration support ( Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles)
- Registration API uses admin client for reliable queries
- Dashboard fetches registrations via profile_id (not player_id) due to FK constraints
- Registration page shows registered divisions + remaining available divisions
- Fixed unique constraint: `season_registrations(player_id, season_id, division_id)` allows multiple divisions per player per season

### Confidence Badges ✅
- Updated thresholds: 0-4 (Projected), 5-9 (Developing), 10+ (Established)
- Utility function `getConfidenceBadge()` in `src/utils/rating.ts`
- Badges displayed on profile page and leaderboard

### TFR Algorithm ✅
- Conservative point system: +0.5-1.0 for expected win, +1.0-3.0 for upset
- Close loss: -0.2 to -0.3, Blowout loss: -0.5 to -1.0
- Blowout detection: average set differential ≥4 games
- Conservative progression: ~2-2.5 years (2-3 seasons/year) to move up full point
- Example: 10-4 record over 14 matches → ~+3-4 TFR (stay in same NTRP level)

### Database Fixes ✅
- `season_registrations` table now has proper constraint for multi-division registration
- FK relationships work correctly for dashboard queries
- RLS policies support both player_id and profile_id queries

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── HomeClient.tsx             # Landing page client component
│   ├── error.tsx                  # Global error page
│   ├── not-found.tsx              # Global 404 page
│   ├── [chapter]/
│   │   ├── page.tsx              # Flex homepage
│   │   ├── error.tsx             # Flex-specific error page
│   │   └── not-found.tsx         # Flex-specific 404 page
│   ├── register/page.tsx           # Player/coordinator registration
│   ├── login/page.tsx              # Login
│   ├── dashboard/
│   │   ├── page.tsx              # User dashboard
│   │   └── error.tsx             # Dashboard error page
│   ├── admin/chapters/page.tsx     # Flex request admin
│   ├── seasons/
│   │   ├── page.tsx                # Browse seasons
│   │   ├── error.tsx               # Seasons error page
│   │   ├── create/page.tsx         # Create season
│   │   └── [id]/
│   │       ├── page.tsx            # Season details
│   │       ├── register/page.tsx   # Register for season
│   │       └── not-found.tsx      # Season 404 page
│   ├── divisions/page.tsx          # Manage divisions
│   ├── profile/page.tsx            # User profile
│   ├── auth/
│   │   ├── callback/route.ts       # Auth callback
│   │   └── signout/route.ts        # Sign out
│   ├── set-password/page.tsx       # Set password for new users
│   └── api/
│       ├── admin/chapters/         # Flex admin APIs
│       ├── seasons/                # Season APIs
│       ├── divisions/              # Division APIs
│       ├── matches/[id]/
│       │   ├── score/route.ts     # Score submission API
│       │   └── availability/route.ts  # Match availability API
│       ├── organizations/[id]/players/route.ts  # Organization players API
│       ├── skill-levels/[id]/     # Skill level matches API
│       └── leaderboard/            # Leaderboard APIs
│           ├── [id]/             # Get leaderboard for skill level
│           ├── seasons/           # Get active seasons
│           ├── divisions/          # Get divisions for season
│           └── skill-levels/        # Get skill levels for division
├── actions/                        # Server actions
├── components/
│   ├── MatchesCard.tsx            # Calendar view of matches
│   └── NotificationBell.tsx      # Notification dropdown
├── types/database.ts              # TypeScript types
└── utils/
    ├── notifications.ts            # Notification helper functions
    ├── rating.ts                   # TFR rating utilities
    └── token.ts                   # JWT token utilities
```

### Supabase Migrations (in /supabase/)
- `fix_profiles_columns.sql` - Add missing profile columns
- `match_availability.sql` - Match availability table
- `migration_technical_debt_fixes.sql` - Indexes, constraints, notifications table

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Supabase anon key
SUPABASE_SECRET_KEY=              # Supabase service role key (server only)
JWT_SECRET=                       # Secret for signing set-password tokens (use openssl rand -base64 32)
RESEND_API_KEY=                  # Resend API key for transactional emails (free at resend.com)
```

---

## Recent Fixes

- Fixed coordinator invite email: Changed from `recovery` to `invite` link type to properly create session
- Improved `/set-password` page: Added session check with proper loading states
- **Unified set-password flow**: Replaced session exchange with signed JWT tokens for reliability
  - Uses `jose` library for JWT signing
  - Created `/src/utils/token.ts` for token utilities
  - Unified `create-flex` and `approve` routes to use same pattern
  - Added `/api/set-password` endpoint for password setting
  - Updated `/set-password` page to verify token directly
  - Added `JWT_SECRET` to environment variables
- **Auto-seed divisions**: Season creation now automatically adds 5 divisions (Men's/Women's Singles/Doubles, Mixed) + 6 skill levels each
- **Fixed RLS issues**: Updated API routes to use admin client for data operations
- **Dashboard redesign**: Added stats cards, seasons list, removed redundant buttons
- **Profile page**: New profile page with self-rating (NTRP), ratings display, win/loss stats
- **Score submission modal**: Set-by-set dropdowns (0-7), winner selection
- **Per-division leaderboard**: Fixed org lookup through division→season→organization chain
- **Fixed pending matches**: Dashboard now correctly counts non-completed matches
- **Season registration tracking**: Resolved issue with player ↔ season relationship
  - Created `season_registrations` table to track season/division registrations
  - Added RLS policies for player INSERT and SELECT
  - Updated `/api/seasons/[id]/register` to insert registration records
  - Added check-if-exists before insert to handle duplicates
  - Added comprehensive debug logging for troubleshooting
- **Player dashboard cards**: Changed to 3-column horizontal layout
- **Leaderboard card**: Now shows actual leaderboard for player's skill level based on their TFR/initial NTRP
- **Profile page redesign**: Modern profile with avatar (initials), stats grid, two-column layout for ratings and account

### Quick SQL Reference

```sql
-- Add player RLS policies
-- Allow users to insert their own record
CREATE POLICY "players profile owner can insert" ON players
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Allow users to update their own record
CREATE POLICY "players profile owner can update" ON players
FOR UPDATE
USING (auth.uid() = profile_id);

-- Allow users to read their own record
CREATE POLICY "players profile owner can select" ON players
FOR SELECT
USING (auth.uid() = profile_id);

-- Allow anyone to read players (for leaderboards)
CREATE POLICY "players are readable" ON players
FOR SELECT
USING (true);
```

### Quick SQL Reference

```sql
-- Add NTRP columns to profiles for self-rating
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS initial_ntrp_singles numeric(3,1),
ADD COLUMN IF NOT EXISTS initial_ntrp_doubles numeric(3,1);

-- Player RLS policies (allow self-insert/update)
CREATE POLICY "players profile owner can insert" ON players
FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "players profile owner can update" ON players
FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "players profile owner can select" ON players
FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "players are readable" ON players
FOR SELECT USING (true);
```

### Auto-seed Divisions
When creating a season, 5 divisions + 6 skill levels are automatically created:
- Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles
- Skill levels: 2.5, 3.0, 3.5, 4.0, 4.5, 5.0+

### SQL to Seed Existing Seasons
(Automatically done when creating new seasons - see API)

---

## Known Issues

- Email sending via Supabase has rate limits in development
- Magic link fallback logs to console
- Production email deliverability depends on Supabase email config

## Database Requirements

### season_registrations Table
The table must have this unique constraint to allow multiple divisions per player per season:

```sql
-- Drop old constraint if exists
ALTER TABLE season_registrations DROP CONSTRAINT IF EXISTS season_registrations_player_id_season_id_key;

-- Add correct 3-column constraint
ALTER TABLE season_registrations ADD UNIQUE(player_id, season_id, division_id);
```

### RLS for season_registrations
Use admin client (service role) for all queries to bypass RLS issues with foreign key relationships.

---

## Database Technical Debt - SQL Fixes

Run these SQL commands in your Supabase SQL Editor to fix technical debt issues:

```sql
-- Add UNIQUE constraint to prevent duplicate skill levels per division
ALTER TABLE skill_levels 
ADD CONSTRAINT IF NOT EXISTS skill_levels_division_id_name_key UNIQUE(division_id, name);

-- Add index for matches lookup by skill_level_id (improves query performance)
CREATE INDEX IF NOT EXISTS idx_matches_skill_level_id ON matches(skill_level_id);

-- Add index for season_registrations lookups
CREATE INDEX IF NOT EXISTS idx_season_registrations_player_season ON season_registrations(player_id, season_id);

-- Add index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read);

-- Verify season_registrations has correct unique constraint
ALTER TABLE season_registrations DROP CONSTRAINT IF EXISTS season_registrations_player_id_season_id_key;
ALTER TABLE season_registrations ADD CONSTRAINT IF NOT EXISTS season_registrations_unique UNIQUE(player_id, season_id, division_id);
```

---

## April 27, 2026 - Updates

### Season Page UI Redesign
- Added gradient header for active seasons
- Stats bar showing: Players Registered, Total Matches, Completed, Pending
- Progress bar showing season completion percentage and days remaining
- Division cards now show match counts and completion status per skill level
- Skill level cards show recent match previews inline

### Match Display Fixes
- Fixed skill level cards showing "No matches yet" - was RLS issue, resolved by using adminClient
- Fixed player names showing "Unknown" - properly fetching profile names from players table
- TFR ratings now display correctly for singles vs doubles (TFR-S vs TFR-D)

### Doubles Partner Selection
- Added partner selection to registration form for doubles divisions
- Players can either:
  - Select an existing player from the organization
  - Invite a new player by email
- New columns added to season_registrations:
  - `partner_id` - UUID to existing player
  - `partner_email` - for inviting new players
  - `partner_status` - 'none', 'invited', 'confirmed'

### SQL for Partner Feature
```sql
ALTER TABLE season_registrations 
ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS partner_email text,
ADD COLUMN IF NOT EXISTS partner_status text DEFAULT 'none' CHECK (partner_status IN ('none', 'pending', 'confirmed', 'invited'));

CREATE INDEX IF NOT EXISTS idx_season_registrations_partner ON season_registrations(partner_id);
```

### New API Endpoint
- `/api/organizations/[id]/players` - Returns list of players in organization for partner selection

### Phase Status
- Phase 14 (Doubles Partner Selection): ✅ Complete
- Phase 15 (Season Page UI): ✅ Complete
- Phase 16 (Flag Review): ✅ Complete
- Phase 17 (TFR Algorithm): ✅ Complete
- Phase 18 (Error Handling Pages): ✅ Complete
- Phase 19 (Match Availability System): ✅ Complete
- Phase 20 (Notifications System): ✅ Complete
- Phase 21 (Dashboard Improvements): ✅ Complete
- Phase 22 (Profile Page Cleanup): ✅ Complete
- Phase 23 (Database Technical Debt): ✅ Complete

---

## April 28, 2026 - Session Updates (ses_22bb04eeeffe8h1aSwK5txSsV9)

### Error Handling Pages ✅
- Added `error.tsx` (global error page with "Try again" and "Go home" buttons)
- Added `not-found.tsx` (global 404 page with back to home link)
- Added `src/app/[chapter]/error.tsx` (Flex-specific error page)
- Added `src/app/[chapter]/not-found.tsx` (Flex-specific 404)
- Added `src/app/dashboard/error.tsx` (Dashboard error page)
- Added `src/app/seasons/error.tsx` (Seasons list error page)
- Added `src/app/seasons/[id]/not-found.tsx` (Season-specific 404)

### Match Availability Feature ✅
- Created `supabase/universal_availability.sql` with new table definition
- Table: `player_availability` (id, player_id, available_date)
- UNIQUE constraint prevents duplicate date entries per player
- RLS policies: players can only manage their own availability, all can view
- API endpoint: `/api/player/availability` (GET/POST)
  - GET: Fetch player's available dates (?player_id=X for opponent)
  - POST: Save player's available dates (replaces all existing)
- Allows players to set general availability dates visible to all opponents
- Calendar shows overlapping dates where both players are available (purple highlight)

### Notifications System ✅
- Created `src/utils/notifications.ts` with helper functions:
  - `sendNotification()` - Generic notification sender
  - `notifyMatchScoreSubmitted()` - Notify opponent when score submitted
  - `notifySeasonRegistration()` - Notify coordinator of new registration
- Notifications table with: user_id, type, title, message, link, read status
- Integrated with score submission flow

### Dashboard Improvements ✅
- Added `MatchesCard` component using `react-calendar`
- Calendar displays match dates with availability highlighting
- Quick overview of upcoming matches on dashboard
- Installed `react-calendar` package (^6.0.1)

### Profile Page Cleanup ✅
- Removed `ustaNumber` field from profile page
- Streamlined profile form to focus on essential info:
  - Full name, email, phone, location
  - Play preferences (weekdays/weekends, morning/afternoon/evening)
  - Gender, avatar upload
  - Initial NTRP ratings (singles/doubles)

### Database Technical Debt Fixes ✅
- Created `supabase/migration_technical_debt_fixes.sql`:
  - Added UNIQUE constraint on `skill_levels(division_id, name)`
  - Added performance indexes:
    - `idx_matches_skill_level_id`
    - `idx_season_registrations_player_season`
    - `idx_season_registrations_division`
    - `idx_players_profile_id`
    - `idx_matches_home_player`
    - `idx_matches_away_player`
  - Ensured `notifications` table exists with proper schema
  - Added RLS policies for notifications

### Profile Table Fixes ✅
- Created `supabase/fix_profiles_columns.sql` to add missing columns:
  - `location` (text)
  - `phone` (text)
  - `play_preferences` (jsonb)
  - `gender` (text with CHECK constraint)
  - `avatar_url` (text)
  - `initial_ntrp_singles` (numeric 3,1)
  - `initial_ntrp_doubles` (numeric 3,1)

### Score Submission Enhancements ✅
- Integrated notification system with score submission
- Opponents now receive notification when score is submitted
- Score submission API (`/api/matches/[id]/score/route.ts`) updated to send notifications

### Files Modified in This Session
- `src/app/error.tsx` (new)
- `src/app/not-found.tsx` (new)
- `src/app/[chapter]/error.tsx` (new)
- `src/app/[chapter]/not-found.tsx` (new)
- `src/app/dashboard/error.tsx` (new)
- `src/app/seasons/error.tsx` (new)
- `src/app/seasons/[id]/not-found.tsx` (new)
- `src/components/MatchesCard.tsx` (new)
- `src/utils/notifications.ts` (new)
- `supabase/match_availability.sql` (new)
- `supabase/migration_technical_debt_fixes.sql` (new)
- `supabase/fix_profiles_columns.sql` (new)
- `src/app/dashboard/page.tsx` (modified - added MatchesCard)
- `src/app/profile/page.tsx` (modified - removed USTA number)
- `src/app/api/matches/[id]/score/route.ts` (modified - added notifications)
- `src/app/api/player/availability/route.ts` (new)
- `package.json` (added react-calendar)
- `BUILD_PLAN.md` (this update)
