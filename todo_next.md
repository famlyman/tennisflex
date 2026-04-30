# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

## ✅ Recently Completed
- [x] **Match Hub & Real-time Coordination:** Dedicated coordination page with live chat and shared availability.
- [x] **Service Worker Fix:** Resolved PWA deployment skew issues (MIME type errors).
- [x] **API Resilience:** Upgraded messaging/scheduling to handle ID migrations and RLS complexities.
- [x] **UI Polish:** Enforced dark text on light backgrounds for better contrast.

## 🚀 Priority 1: NTRP Verification (Scraper Integration)
**Goal:** Replace or augment self-reported skill levels with verified data.
- [ ] **Integration:** Connect `scraper/tennisrecord.ts` to the registration flow.
- [ ] **UI/UX:** Add a "Verify with TennisRecord" button during player onboarding.
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
- [ ] **E2E Testing:** Implement Playwright tests for the critical path:
    - Registration -> Registration Approval -> Match Generation -> Score Submission.
- [ ] **Multi-Tenancy Audit:** Verify that Row Level Security (RLS) prevents data leakage between Organizations.
- [ ] **TFR Validation:** Create unit tests for `src/utils/rating.ts` to verify rating changes for upsets vs. blowouts.

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
*Updated: April 30, 2026*
