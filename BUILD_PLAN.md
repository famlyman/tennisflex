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
│   │   └── SkillLevel (NTRP buckets)
│   │       └── Player
│   │           ├── TFR ratings
│   │           └── Match history
│   ├── Match
│   ├── Message
│   ├── RatingFlag
│   └── Extension
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
| `skill_levels` | NTRP rating buckets |
| `players` | Player records with TFR ratings |
| `matches` | Match scheduling and scores |
| `messages` | In-app chat between opponents |
| `rating_flags` | Anti-sandbagging reports |
| `extensions` | Match time extension requests |

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
| 4 | Flex model | ✅ Complete |
| 5 | Request Flex flow | ✅ Complete |
| 6 | Coordinator onboarding | ✅ Complete |
| 7 | Season creation | ✅ Complete |
| 8 | Division management | ✅ Complete |
| 9 | Player registration | ✅ Complete |
| 10 | Match pages + messaging | ⏳ Pending |
| 11 | Score submission | ⏳ Pending |
| 12 | Leaderboard | ⏳ Pending |
| 13 | Flag review | ⏳ Pending |
| 14 | TFR algorithm | ⏳ Pending |

---

## Completed Features

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

### Auth Improvements ✅
- Set Password Page for new users
- Forgot Password flow
- Enhanced Auth Callback with `next` redirect support

### PWA ✅
- Manifest with icons
- Service worker for caching
- Offline support

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── HomeClient.tsx             # Landing page client component
│   ├── [chapter]/page.tsx         # Flex homepage
│   ├── register/page.tsx           # Player/coordinator registration
│   ├── login/page.tsx              # Login
│   ├── dashboard/page.tsx          # User dashboard
│   ├── admin/chapters/page.tsx     # Flex request admin
│   ├── seasons/
│   │   ├── page.tsx                # Browse seasons
│   │   ├── create/page.tsx         # Create season
│   │   └── [id]/register/page.tsx  # Register for season
│   ├── divisions/page.tsx          # Manage divisions
│   ├── auth/
│   │   ├── callback/route.ts       # Auth callback
│   │   └── signout/route.ts        # Sign out
│   ├── set-password/page.tsx       # Set password for new users
│   └── api/
│       ├── admin/chapters/         # Flex admin APIs
│       ├── seasons/                # Season APIs
│       └── divisions/              # Division APIs
├── actions/                        # Server actions
├── components/                    # UI components
├── types/database.ts              # TypeScript types
└── utils/                        # Utilities
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Supabase anon key
SUPABASE_SECRET_KEY=              # Supabase service role key (server only)
```

---

## Known Issues

- Email sending via Supabase has rate limits in development
- Magic link fallback logs to console
- Production email deliverability depends on Supabase email config
