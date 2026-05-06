# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

## ✅ Recently Completed
- [x] **Hybrid Promotion System:** Launched a native-first monetization engine with Direct, Affiliate, and Placeholder support.
- [x] **Location Discovery:** Implemented real-time search and geolocation for finding local chapters.
- [x] **TFR Standardization:** Unified sorting logic and whole-number displays across the entire platform.
- [x] **Timezone Fix:** Resolved the 4-hour offset in match scheduling.
- [x] **Doubles Team Support:** Overhauled match generation and Match Hub to support 2v2 play (Men's, Women's, and Mixed).
- [x] **NTRP Verification:** Connected TennisRecord scraper to player profiles, allowing one-click rating verification.

## 🚀 Priority 1: Infrastructure & DB Sync
**Goal:** Finalize the database schema and resolve technical debt.
- [ ] **DB Migration (Manual):** Execute `supabase/awards.sql` to resolve 404 errors on the profile page.
- [ ] **DB Migration (Manual):** Execute `supabase/promotions.sql` to enable the promotional engine.
- [ ] **Lint & Type Cleanup:** Resolve ~130 ESLint errors (mostly `any` types and formatting).

## 💰 Priority 2: Monetization (Stripe Integration)
**Goal:** Enable fee collection for coordinators.
- [ ] **Stripe Connect:** Implement multi-tenant payment flow.
- [ ] **Platform Fees:** Logic for service fee deduction.

---
*Updated: May 6, 2026 - Hybrid Promotion System and Location Discovery implemented*

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
