# TourneyHub: Build Plan

The app works the way an IPL season is prepared: the **organizer** creates the tournament and its rules, **teams** register like franchises, each team adds its **squad**, the **fixtures** are generated, matches are **scored live**, and the **points table** decides the **playoffs** and the **champion**.

TourneyHub is for all sports. We build **cricket first**; other sports come later (see "Later" at the bottom).

**How we work:** build one sub-phase at a time. When it's finished and checked, tick it `[x]`.

**Who uses the app**

| Role | What they do |
|---|---|
| Organizer | Creates the tournament, sets rules, approves teams, manages fixtures |
| Team owner / captain | Registers a team, adds players, picks the playing XI |
| Scorer | Scores a match ball by ball |
| Viewer | Watches live scores, the points table and stats (no login needed) |

---

## Phase 0: Foundation
- [x] **0.1** Project setup: React 19, Vite, Tailwind CSS v4, shadcn/ui config
- [x] **0.2** Supabase client (`src/lib/supabase.ts`) and `.env.example`
- [x] **0.3** TypeScript, base shadcn components, app layout (header and mobile menu) and page routing
- [x] **0.4** Data layer with dummy data: table types (`src/types/db.ts`), data functions (`src/data/api.ts`), dummy tournaments/teams/players (`src/data/mock`), matching `supabase/schema.sql`
- [ ] **0.5** *(later)* Connect real Supabase: create the project, add keys to `.env`, run `supabase/schema.sql`, add `src/data/supabaseApi.ts` and switch `api` to it

## Phase 1: Accounts & Roles
- [ ] **1.1** Sign up / log in (email OTP and Google) with Supabase Auth
- [ ] **1.2** User profile (name, photo, phone)
- [ ] **1.3** Roles per tournament: organizer, team owner, scorer, viewer
- [ ] **1.4** Protected pages (only logged-in users can create; anyone can watch)

## Phase 2: Tournament Creation (organizer)
- [x] **2.1** Basic details: name, season/year, logo, start and end dates, venues
- [x] **2.2** Match rules: overs per innings, players per side, powerplay overs, max overs per bowler, wide/no-ball runs, free hit, super over on a tie, last man stands
- [x] **2.3** Mode preset: **Gully** (short overs, flexible rules) or **Professional** (full T20 rules)
- [x] **2.4** Format: league (single or double round-robin) + playoffs (IPL style: Qualifier 1, Eliminator, Qualifier 2, Final), league + semi-finals and final, or knockout; number of teams; live match-count plan
- [x] **2.5** Points rules: win / tie / no result points, tie-breakers (NRR, head-to-head)
- [x] **2.6** Team registration settings: min/max squad size, open registration now or keep as draft, deadline (max teams is set in 2.4; the invite code is created on save)
- [x] **2.7** Tournament dashboard page (overview, teams, fixtures, table, stats tabs), invite code and link, open registration; /join/:code landing page (sign-up form comes in 3.1)

## Phase 3: Team Registration (franchises)
- [x] **3.1** Team owner joins with the invite link and registers a team: name, short name (e.g. "CSK"), logo, colours, home ground
- [ ] **3.2** Organizer approves or rejects teams
- [ ] **3.3** Team page: details, squad, matches, results

## Phase 4: Players & Squads
- [ ] **4.1** Player profile: name, photo, jersey number, role (batter, bowler, all-rounder, wicketkeeper), batting and bowling style
- [ ] **4.2** Add players to a team squad (within min/max squad size)
- [ ] **4.3** Pick captain, vice-captain and wicketkeeper
- [ ] **4.4** Squad lock when the registration deadline passes

## Phase 5: Fixtures & Schedule
- [ ] **5.1** Auto-generate league fixtures (round-robin)
- [ ] **5.2** Set the date, time and venue for each match; edit or reschedule
- [ ] **5.3** Schedule page (upcoming, live, completed)

## Phase 6: Match Day & Live Scoring
- [ ] **6.1** Assign the scorer and pick both playing XIs
- [ ] **6.2** Toss: winner and bat/bowl choice
- [ ] **6.3** Ball-by-ball scoring: runs, extras (wide, no-ball, bye, leg-bye), wickets (bowled, caught, run out, etc.)
- [ ] **6.4** Strike rotation, over completion, bowler change, new batter
- [ ] **6.5** Innings break, target, chase, result ("won by X runs / Y wickets"), tie → super over
- [ ] **6.6** Undo the last ball and correct mistakes
- [ ] **6.7** Full scorecard (batting and bowling) and ball-by-ball commentary

## Phase 7: Live for Viewers
- [ ] **7.1** Live score page that updates instantly (Supabase Realtime)
- [ ] **7.2** Share the match link or QR code

## Phase 8: Points Table & Playoffs
- [ ] **8.1** Points table: played, won, lost, tied, no result, points, NRR
- [ ] **8.2** Playoff qualification and the bracket (Qualifier 1, Eliminator, Qualifier 2, Final)
- [ ] **8.3** Final result and champion page

## Phase 9: Stats & Awards
- [ ] **9.1** Leaderboards: most runs (Orange Cap), most wickets (Purple Cap), most sixes, highest score, best bowling
- [ ] **9.2** Player of the Match, Player of the Tournament
- [ ] **9.3** Player career stats across tournaments

## Phase 10: Mobile & Launch
- [ ] **10.1** PWA: installable on phones, home screen icon, works on slow networks
- [ ] **10.2** Deploy the website (Vercel or Netlify)
- [ ] **10.3** Final testing on mobile and desktop

---

## Later (not now)
- Player auction (IPL-style bidding with team budgets)
- Other sports (football, kabaddi, volleyball)
- Play Store / App Store app (Capacitor)
- Push notifications (match starting, wicket, result)
