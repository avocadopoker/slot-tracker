# Slot Tracker + Marketplace

Slot tracker for advantage players + marketplace for buying/selling slot plays.
Stack: Vite + React, Supabase, Netlify (same conventions as TDL and LIVE-PT).

## Status
- Session 1: scaffold, Supabase client, Netlify config — done
- Session 2: marketplace tables (plays, purchases) + basic marketplace UI (post/list/buy) — done
- Tracker data model — TBD per game type
- Auth, real payments, tightened RLS — later

## Local dev
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev
