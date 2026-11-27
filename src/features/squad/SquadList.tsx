import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, ApiError } from "@/data/api";
import { PLAYER_ROLE_LABELS } from "@/lib/labels";
import type { PlayerRole, SquadPlayer } from "@/types/db";

const ROLE_ORDER: PlayerRole[] = ["batter", "wicket_keeper", "all_rounder", "bowler"];
const ROLE_GROUP_TITLES: Record<PlayerRole, string> = {
  batter: "Batters",
  wicket_keeper: "Wicketkeepers",
  all_rounder: "All-rounders",
  bowler: "Bowlers",
};

export function SquadList({
  teamId,
  squad,
  canEdit,
  onEdit,
  onChanged,
}: {
  teamId: string;
  squad: SquadPlayer[];
  canEdit: boolean;
  onEdit: (player: SquadPlayer) => void;
  /** Called after a change, to reload the squad. */
  onChanged: () => void;
}) {
  const [removing, setRemoving] = useState<SquadPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {ROLE_ORDER.map((role) => {
        const players = squad
          .filter((s) => s.player.role === role)
          .sort(
            (a, b) =>
              Number(b.is_captain) - Number(a.is_captain) ||
              Number(b.is_vice_captain) - Number(a.is_vice_captain) ||
              a.player.full_name.localeCompare(b.player.full_name)
          );
        if (players.length === 0) return null;
        return (
          <div key={role}>
            <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
              {ROLE_GROUP_TITLES[role]} ({players.length})
            </h3>
            <ul className="divide-y">
              {players.map((s) => (
                <li key={s.player_id} className="flex items-center gap-3 py-2">
                  <span className="w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                    {s.jersey_number ?? "–"}
                  </span>
                  {s.player.photo_url && (
                    <img src={s.player.photo_url} alt="" className="size-8 shrink-0 rounded-full border object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-medium">
                      <span className="truncate">{s.player.full_name}</span>
                      {s.is_captain && <RoleTag title="Captain">C</RoleTag>}
                      {s.is_vice_captain && <RoleTag title="Vice-captain">VC</RoleTag>}
                      {s.is_wicket_keeper && <RoleTag title="Wicketkeeper">WK</RoleTag>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PLAYER_ROLE_LABELS[s.player.role]} ·{" "}
                      {s.player.batting_style === "left" ? "Left" : "Right"}-hand bat
                      {s.player.bowling_style ? ` · ${s.player.bowling_style}` : ""}
                    </p>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label={`Options for ${s.player.full_name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(s)}>
                          <Pencil /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(s)}>
                          <Trash2 /> Remove from squad
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.player.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be taken out of this squad. You can add them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => removing && run(() => api.removeSquadPlayer(teamId, removing.player_id))}
            >
              Remove player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleTag({ title, children }: { title: string; children: string }) {
  return (
    <abbr
      title={title}
      className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground no-underline"
    >
      {children}
    </abbr>
  );
}
