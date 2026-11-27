import { Outlet } from "react-router-dom";

import { Header } from "@/components/layout/Header";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        CricTourney: run your own cricket league
      </footer>
    </div>
  );
}
