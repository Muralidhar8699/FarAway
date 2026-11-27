import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { CreateTournamentPage } from "@/pages/CreateTournamentPage";
import { HomePage } from "@/pages/HomePage";
import { JoinTournamentPage } from "@/pages/JoinTournamentPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { TeamPage } from "@/pages/TeamPage";
import { TournamentPage } from "@/pages/TournamentPage";
import { TournamentsPage } from "@/pages/TournamentsPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/tournaments", element: <TournamentsPage /> },
      { path: "/tournaments/new", element: <CreateTournamentPage /> },
      { path: "/tournaments/:id", element: <TournamentPage /> },
      { path: "/tournaments/:id/teams/:teamId", element: <TeamPage /> },
      { path: "/join/:code", element: <JoinTournamentPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
