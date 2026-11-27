import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Radio, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  { icon: Trophy, title: "Create a tournament", text: "Set the name, overs, format and rules: gully or professional." },
  { icon: Users, title: "Teams register", text: "Share an invite link. Teams sign up and add their squads." },
  { icon: CalendarDays, title: "Fixtures", text: "League matches are generated automatically, then playoffs." },
  { icon: Radio, title: "Live scoring", text: "Score ball by ball. Everyone watches the live score on their phone." },
  { icon: ClipboardList, title: "Points table & stats", text: "Points, NRR, top run scorers and wicket takers, updated after every match." },
];

export function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4 py-8 text-center">
        <Badge variant="secondary">Cricket today · more sports coming soon</Badge>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Run your own IPL-style tournament
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Create a tournament, let teams register their squads, play the league and
          playoffs, and score every ball live.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/tournaments/new">Create Tournament</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/tournaments">Browse Tournaments</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <Card key={step.title}>
            <CardHeader>
              <step.icon className="mb-2 size-6" />
              <CardTitle>
                {i + 1}. {step.title}
              </CardTitle>
              <CardDescription>{step.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
