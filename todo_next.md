# Tennis-Flex: Next Steps & Future Roadmap

This document outlines the logical progression for the Tennis-Flex platform following the completion of the core Phase 1-23 implementation.

## ✅ Recently Completed
- [x] **Infrastructure Sync:** Executed SQL migrations for awards, promotions, and coordinates.
- [x] **Expansion Request Flow:** Restored specialized form for coordinators to request new Flex chapters.
- [x] **Proximity Discovery:** 50-mile radius search using Haversine formula implemented.
- [x] **Hybrid Promotion System:** Launched a native-first monetization engine with Direct, Affiliate, and Placeholder support.

## 🚀 Priority 1: Code Quality & Stability
**Goal:** Clean up the codebase for professional handoff/launch.
- [ ] **Lint & Type Cleanup:** Resolve ~130 ESLint errors (mostly `any` types and formatting).
- [ ] **Build Validation:** Ensure all components are type-safe and follow React 19 standards.
- [ ] **E2E Testing:** Implement Playwright tests for the registration -> match -> score flow.

## 📊 Priority 2: Coordinator Analytics
**Goal:** Provide actionable insights to league managers.
- [ ] **Engagement Metrics:** Dashboard showing % of matches completed vs. pending.
- [ ] **Flagging Heatmap:** Identify "problem players" who receive frequent rating flags.
- [ ] **Growth Tracking:** Compare registration counts across historical seasons.

## 📱 Priority 3: Mobile Expansion (PWA & Native)
**Goal:** Enhance the mobile experience.
- [ ] **PWA Optimization:** Improve offline support and add "Add to Home Screen" prompts.
- [ ] **Push Notifications:** Implement native PWA push notifications for match updates.

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
