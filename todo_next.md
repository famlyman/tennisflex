# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

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

## 🛠 Technical Debt & Maintenance
- [ ] **Push Notifications:** Move beyond the in-app bell to native PWA push notifications.
- [ ] **API Rate Limiting:** Implement Vercel Edge middleware for protection.
- [ ] **Email Templates:** Polish transactional emails for match schedules and score verifications.

---
*Created: April 29, 2026*
