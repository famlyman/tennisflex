# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

## ✅ Recently Completed
- [x] **Super Admin Control Room:** Centralized dashboard for global oversight (Integrity, Performance, Promotions, Expansion).
- [x] **Expansion Pipeline:** Added manual Flex provisioning and restored chapter request forms.
- [x] **Infrastructure Sync:** Executed SQL migrations for awards, promotions, and coordinates.
- [x] **Proximity Discovery:** 50-mile radius search using Haversine formula implemented.
- [x] **Hybrid Promotion System:** Launched a native-first monetization engine with Direct, Affiliate, and Placeholder support.
- [x] **Technical Debt Cleanup:** Resolved 139 ESLint errors and 44 warnings across 45 files; fixed TypeScript build errors.
- [x] **E2E Testing:** Playwright suite with 17 tests for auth, registration, and match-scoring flows.
- [x] **Coordinator Analytics:** Engagement metrics, flagging heatmap, and season growth tracking on coordinator dashboard.

## 🚀 Priority 1: Technical Debt & Validation
**Goal:** Stabilize the codebase for professional handoff/launch.
- [x] **Lint & Type Cleanup:** Resolve ~130 ESLint errors (mostly `any` types and formatting).
- [x] **Build Validation:** Ensure all components are type-safe and follow React 19 standards.
- [x] **E2E Testing:** Implement Playwright tests for the registration -> match -> score flow.

## 📱 Priority 2: Mobile Expansion (PWA & Native)
**Goal:** Enhance the mobile experience.
- [ ] **PWA Optimization:** Improve offline support and add "Add to Home Screen" prompts.
- [ ] **Push Notifications:** Implement native PWA push notifications for match updates.

## 📊 Priority 3: Platform Analytics
**Goal:** Advanced insights for the platform owner.
- [ ] **Revenue Dashboard:** Track conversion rates for direct sponsors vs affiliate links.
- [ ] **Growth Projections:** User acquisition trends across different regions.

## 📊 Priority 5: Coordinator Analytics
**Goal:** Provide actionable insights to league managers.
- [x] **Engagement Metrics:** Dashboard showing % of matches completed vs. pending.
- [x] **Flagging Heatmap:** Identify "problem players" who receive frequent rating flags.
- [x] **Growth Tracking:** Compare registration counts across historical seasons.

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
*Updated: May 13, 2026 - Technical debt cleanup, E2E testing, and coordinator analytics completed*
