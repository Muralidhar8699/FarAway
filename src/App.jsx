import { Trophy } from "lucide-react";

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-4 text-center">
      <Trophy className="size-12" />
      <h1 className="text-3xl font-bold">Cricket Tournament</h1>
      <p className="text-muted-foreground">
        Gully &amp; professional tournaments: knockouts, semis, finals and live scoring.
      </p>
      <p className="text-sm text-muted-foreground">
        Setup ready: React 19 + Vite + Tailwind v4 + shadcn/ui + Supabase.
      </p>
    </main>
  );
}
