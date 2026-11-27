import { Link, useParams } from "react-router-dom";
import { Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/data/api";
import { useAsync } from "@/hooks/useAsync";
import { formatDateRange } from "@/lib/labels";

/** Landing page for invite links. Team sign-up itself is built in Phase 3.1. */
export function JoinTournamentPage() {
  const { code = "" } = useParams();
  const { status, data: t } = useAsync(() => api.getTournamentByInviteCode(code), [code]);

  if (status === "loading") return <Skeleton className="mx-auto h-56 w-full max-w-md rounded-xl" />;

  if (!t) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Trophy className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Invite code not found</h1>
        <p className="text-muted-foreground">Check the link or code with the tournament organizer.</p>
      </div>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardDescription>You're invited to join</CardDescription>
        <CardTitle className="text-xl">
          {t.name} {t.season}
        </CardTitle>
        <CardDescription>{formatDateRange(t.start_date, t.end_date)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            {t.status === "registration"
              ? "Team sign-up is coming soon. You'll be able to register your team and squad from this page."
              : "Registration for this tournament isn't open right now. Check with the organizer."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/tournaments/${t.id}`}>View tournament</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
