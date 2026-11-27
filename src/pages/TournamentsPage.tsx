import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TournamentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <Button asChild>
          <Link to="/tournaments/new">Create Tournament</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Trophy className="size-10 text-muted-foreground" />
          <p className="font-medium">No tournaments yet</p>
          <p className="text-sm text-muted-foreground">
            Tournaments you create or join will show up here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
