# Tennis-Flex

A multi-tenant tennis league management platform built with Next.js 16 and Supabase.

## Features

### Core Functionality
- **Multi-Tenant Architecture** - Organizations (Flexes) with regional support
- **Season Management** - Full lifecycle: upcoming → registration_open → active → completed
- **Player Registration** - Multi-division registration with NTRP ratings and doubles partner selection
- **Match System** - Round-robin generation, score submission, TFR rating updates
- **TFR Rating Algorithm** - Conservative rating system with blowout detection, K-factors, confidence badges
- **Leaderboards** - Per skill level, ranked by wins with confidence badges
- **Anti-Sandbagging** - Player flagging system with coordinator review workflow
- **Notifications & Match Chat** - In-app messaging system
- **PWA Support** - Service worker, manifest, offline capabilities

### Recent Updates (April 2026)

#### Match Availability Feature
- **API Route**: `/api/player/availability` (GET/POST)
  - GET: Fetch player's available dates (optionally ?player_id=X for opponent)
  - POST: Save player's available dates
  
- **Database**: New `player_availability` table
  - Stores player availability with date and time slots
  - Row Level Security (RLS) policies for players and coordinators
   
- **UI Components**:
  - `YourMatchesCard` - Displays upcoming matches on player dashboard with "Set Availability" button
  - Uses react-calendar to show availability with overlapping date detection
  - Time slots: Morning (8am-12pm), Afternoon (12pm-5pm), Evening (5pm-9pm), Night (9pm+)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Setup

Run the SQL migration to create the match_availability table:

```bash
# Execute supabase/match_availability.sql in your Supabase SQL editor
# or via Supabase CLI
supabase db execute --file supabase/match_availability.sql
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
