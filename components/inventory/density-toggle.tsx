"use client";

import { useState } from "react";
import { AlignJustify, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DENSITY_COOKIE, parseDensity, type Density } from "@/lib/density";

const DENSITY_ICON: Record<Density, React.ComponentType<{ className?: string }>> = {
  compact: Rows3,
  comfortable: AlignJustify,
};

export function DensityToggle({ initial }: { initial: Density }) {
  const [density, setDensity] = useState<Density>(initial);
  const Icon = DENSITY_ICON[density];

  function apply(next: string) {
    const value = parseDensity(next);
    setDensity(value);
    document.documentElement.dataset.density = value;
    document.cookie = `${DENSITY_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="size-8" aria-label="Row density" />
        }
      >
        <Icon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={density} onValueChange={apply}>
          <DropdownMenuRadioItem value="compact">
            <Rows3 className="size-3.5" />
            Compact
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">
            <AlignJustify className="size-3.5" />
            Comfortable
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
