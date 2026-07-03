import { Package, LogOut, User } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { CurrentProfile } from "@/lib/auth";

function initials(name: string, email: string | null) {
  const source = name.trim() || email || "?";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar({ profile }: { profile: CurrentProfile }) {
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Package className="size-4" />
        </div>
        <span className="text-row-title font-semibold">Stockline</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px]">
              {initials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-row-title font-medium">
              {profile.full_name || profile.email || "Account"}
            </span>
            <Badge variant="secondary" className="w-fit gap-1 text-[11px] capitalize">
              <User className="size-3" />
              {profile.role}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <form action={signOutAction}>
            <DropdownMenuItem
              variant="destructive"
              render={<button type="submit" className="w-full text-left" />}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
