# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

## ✅ Recently Completed
- [x] **TFR Rating Display:** Standardized whole-number TFR ratings (10-80 scale) across the entire app using `Math.round`.
- [x] **Dynamic Leaderboard:** Dashboard leaderboard now automatically focuses on the user's most recent completed match.
- [x] **Win/Loss Logic:** Fixed reversed win/loss reporting and ensured immediate database updates on score submission.
- [x] **UI Contrast Fix:** Enforced dark text (`text-slate-900`) for player names on the leaderboard per enterprise readability standards.
- [x] **Match Score Integration:** Integrated score submission directly into the Match Hub with verified badges.
- [x] **Verification System:** Added opponent score verification across the platform.

## 🚀 Priority 1: NTRP Verification (Scraper Integration)
**Goal:** Replace or augment self-reported skill levels with verified data.
- [x] **Scraper API:** Connect `scraper/tennisrecord.ts` to `/api/tennisrecord`.
- [ ] **UI/UX:** Add a "Verify with TennisRecord" button during player onboarding/profile editing.
- [ ] **Data Sync:** Auto-populate `initial_ntrp_singles` and `initial_ntrp_doubles` from scraped data.
- [ ] **Anti-Sandbagging:** Flag players whose self-reported rating significantly deviates from their scraped dynamic rating.

## 🏁 Priority 2: Season Completion Workflow
**Goal:** Automate the transition from an active season to a completed one.
- [ ] **Batch Processing:** Create a "Close Season" utility to handle matches with no scores.
- [ ] **Final Standings:** Generate a static snapshot of the leaderboard at the moment of closure.
- [ ] **Awards/Badges:** Implement "Season Winner" badges on player profiles.
- [ ] **Transition:** Auto-invite active players to the "Registration Open" phase of the subsequent season.

## 🧪 Priority 3: Testing & Quality Assurance
**Goal:** Ensure platform stability and multi-tenant security.
- [ ] **Build Validation:** Fix remaining lint/type errors across the codebase to ensure clean CI/CD.
- [ ] **E2E Testing:** Implement Playwright tests for the registration -> match -> score flow.
- [ ] **Multi-Tenancy Audit:** Verify RLS policies prevent data leakage between Organizations.

## 💰 Priority 4: Monetization (Stripe Integration)
**Goal:** Enable organizations to collect registration fees.
- [ ] **Stripe Connect:** Implement a multi-tenant payment flow where Coordinators can link their own Stripe accounts.
- [ ] **Checkout Flow:** Add a payment step to the `/register` process.
- [ ] **Platform Fees:** Logic to deduct a "Tennis-Flex" service fee from registration totals.

## 📊 Priority 5: Coordinator Analytics
**Goal:** Provide actionable insights to league managers.
- [ ] **Engagement Metrics:** Dashboard showing % of matches completed vs. pending.
- [ ] **Flagging Heatmap:** Identify "problem players" who receive frequent rating flags.
- [ ] **Growth Tracking:** Compare registration counts across historical seasons.

## 📱 Priority 6: Mobile Expansion (Monorepo Strategy)
**Goal:** Transition to a shared-core architecture to support a native Expo/React Native app.
- [ ] **Turborepo Migration:** Restructure the project into a monorepo (`apps/web`, `apps/mobile`, `packages/shared`).
- [ ] **Shared Logic:** Extract TFR algorithm and Supabase types into a shared `packages/logic` directory.
- [ ] **Native Features:** Implement the Player Journey in Expo (Push Notifications, Deep Linking, Native UI).
- [ ] **Dashboard Retention:** Keep the Next.js app for complex Coordinator Dashboard tasks while using Expo for the Player experience.

## 🛠 Technical Debt & Maintenance
- [ ] **Push Notifications:** Move beyond the in-app bell to native PWA push notifications.
- [ ] **Email Templates:** Polish transactional emails for match schedules and score verifications.
- [ ] **Rate Limiting:** Implement Vercel Edge middleware for API protection.

---
*Updated: May 2, 2026 - Match verification system and unified dashboard implemented*
