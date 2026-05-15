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

## ⚡ Next.js 16 Audit (May 15, 2026)

### ✅ Migrated / Compatible
- **Async Request APIs:** All `params`/`searchParams` correctly use `await` or `use()` — no sync access found
- **`middleware` → `proxy`:** Already migrated (`src/proxy.ts` with `NextProxy` type and `proxy` export)
- **Parallel routes:** None exist → no `default.js` requirement
- **Turbopack by default:** Build uses Turbopack, compiles in ~4s
- **`next.config.ts`:** Clean config, no deprecated options (`experimental_ppr`, `dynamicIO`, etc.)
- **ESLint flat config:** `eslint.config.mjs` using `eslint-config-next` (flat format)
- **No deprecated APIs in use:** No `unstable_cacheLife`, `unstable_cacheTag`, `experimental.turbopack`, `next lint`, `next/legacy/image`, or `images.domains`

### ❌ Known Issues
- **Lint broken:** `fast-glob@3.3.1` has empty `filters/` directory in `node_modules` — fix with `rm -rf node_modules && npm install`

### 🔜 Optional Enhancements (v16 features not yet adopted)
- **`cacheComponents: true`** — Enables PPR, `'use cache'`, `cacheLife`/`cacheTag`, and `unstable_instant` for instant navigation validation
- **React Compiler** — Add `reactCompiler: true` to `next.config.ts` for auto-memoization
- **`revalidateTag` 2nd arg** — If used, now requires a `cacheLife` profile (e.g. `revalidateTag('posts', 'max')`)
- **`updateTag`** — New Server Actions API for immediate read-your-writes semantics
- **`npx next typegen`** — Generates `PageProps`/`LayoutProps`/`RouteContext` type helpers
- **`images.localPatterns.search`** — Required for local images with query strings

---
*Updated: May 15, 2026 - Next.js 16 compatibility audit, build/lint verification, docs review*
