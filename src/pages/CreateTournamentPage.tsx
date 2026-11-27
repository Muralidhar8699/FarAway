import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateTournamentPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Create Tournament</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
          <CardDescription>
            The tournament setup form (details, rules, format and team registration) is built in Phase 2.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
