# Tennis-Flex Technical Architecture Review

## Executive Summary

Date: April 23, 2026
Project: Tennis-Flex Multi-Tenant Tennis League Platform
Tech Stack: Next.js 16, Supabase, TypeScript

---

## Part 1: Planned vs Implemented Analysis

### Core Features (From BUILD_PLAN.md)

| Feature | Planned Phase | Implementation Status |
|---------|-------------|-----------------|
| Multi-tenant (Flexes) | Phase 4-6 | ✅ Complete |
| Season Management | Phase 7 | ✅ Complete |
| Division/Skill Level CRUD | Phase 8 | ✅ Complete |
| Player Registration | Phase 9 | ✅ Complete |
| Match Scoring with TFR | Phase 10-11 | ✅ Complete |
| Per-division Leaderboards | Phase 12 | ✅ Complete |
| Authentication | Phase 1 | ✅ Complete |
| RLS Policies | Phase 2-3 | ✅ Complete |

### Tables Created (Per database.ts)

- ✅ organizations (Flexes)
- ✅ profiles (Users)
- ✅ coordinators (Flex admins)
- ✅ seasons (Season configs)
- ✅ divisions (Singles/Doubles types)
- ✅ skill_levels (TFR rating buckets - stored as NTRP × 10)
- ✅ players (TFR ratings)
- ✅ matches (Match scheduling)
- ⚠️ messages (In-app chat - defined but unused)
- ⚠️ rating_flags (Anti-sandbagging - defined but unused)
- ⚠️ extensions (Match time - defined but unused)

### Features Not Yet Implemented

1. **Notifications** - No notification system
2. **In-app Messaging UI** - Table exists but no UI
3. **Rating Flag Review UI** - Table exists but no UI
4. **Match Extension UI** - Table exists but no UI
5. **UTR Integration** - Column exists but unused
6. **Season Completion/Standings** - No automated workflow

---

## Part 2: Critical Issues

### Issue #1: Player ↔ Season Relationship Untracked

**Problem**: When a player registers, we create a `players` record for the organization but don't track:
- Which season they registered for
- Which division they chose
- When they registered

**Impact**: 
- Can't show "my seasons" accurately
- Can't confirm division placement
- No audit trail for coordinator

### Issue #2: No Notification System

**Problem**: Players have no way to know when:
- They have a new match scheduled
- Their score is awaiting verification
- Season registration opens
- Season is ending

**Impact**: Poor engagement, missed matches

### Issue #3: No Season Completion Workflow

**Problem**: At season end, coordinator must manually:
- Mark all matches complete
- Calculate final standings
- Update ratings

**Impact**: Time-consuming, error-prone

---

## Part 3: Recommended Enhancements

### High Priority (Being Implemented)

1. **Season Registration Table**
   - Table: `season_registrations`
   - Fields: player_id, season_id, division_id, registered_at, status
   
2. **Notification System**
   - Table: `notifications`
   - In-app bell icon with unread count
   - Email triggers for key events
   
3. **Season Completion**
   - Generate final standings
   - Auto-mark expired matches
   - Calculate final ratings

### Medium Priority (Future)

4. Match Pairing Algorithm
5. Messaging UI
6. Profile Enhancements
7. UTR Integration

### Nice to Have (Future)

8. PWA Push Notifications
9. Hit Partner Matching
10. Analytics Dashboard

---

## Part 4: Technical Debt

| Issue | Severity | Fix |
|-------|----------|-----|
| Duplicate skill_levels in DB | High | Add UNIQUE constraint |
| Missing DB indexes | Medium | Add index on matches(skill_level_id) |
| Hardcoded TFR K-factors | Low | Move to season config |
| No API rate limiting | Low | Add Vercel Edge |

---

## Part 5: Database Schema Changes

### New Tables Added

```sql
-- Season Registrations
CREATE TABLE season_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  division_id uuid REFERENCES divisions(id),
  registered_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);

-- Notifications  
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## Part 6: Implementation Roadmap

### Phase 1: Registration Tracking (Current)
- [ ] Create season_registrations table
- [ ] Update registration flow to insert record
- [ ] Update dashboard to show registrations

### Phase 2: Notifications (Next)
- [ ] Create notifications table
- [ ] Add notification bell to layout
- [ ] Trigger notifications on key events

### Phase 3: Season Completion (After)
- [ ] Add season completion API
- [ ] Auto-mark expired matches
- [ ] Generate standings

---

*Document Version: 1.0*
*Last Updated: April 23, 2026*