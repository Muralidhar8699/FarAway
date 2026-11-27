# Cricket Tournament

Tournament manager for gully and professional cricket: knockouts (quarter-finals, semi-finals, final), league rounds and live ball-by-ball scoring.

**Stack:** React 19 · Vite · Tailwind CSS v4 · shadcn/ui · Supabase

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

```bash
npx shadcn@latest add button card input select dialog tabs table badge
```

Components land in `src/components/ui/`.
