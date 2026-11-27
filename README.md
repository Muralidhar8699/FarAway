# Cricket Tournament

Tournament manager for gully and professional cricket: knockouts (quarter-finals, semi-finals, final), league rounds and live ball-by-ball scoring.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Supabase

The build plan and progress are in [PLAN.md](PLAN.md).

## Setup

```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

## Supabase

1. Create a project at supabase.com.
2. Project Settings → API: copy the Project URL and anon key into `.env`.
3. SQL Editor: run `supabase/schema.sql`.

## Adding shadcn/ui components

Components live in `src/components/ui/` (button, card, input, label, badge, separator, sheet, skeleton are already added). Add more with:

```bash
npx shadcn@latest add select dialog tabs table
```
