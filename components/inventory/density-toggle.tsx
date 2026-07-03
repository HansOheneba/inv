"use client";

import { useState } from "react";
import { AlignJustify, Rows3 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DENSITY_COOKIE, parseDensity, type Density } from "@/lib/density";

export function DensityToggle({ initial }: { initial: Density }) {
  const [density, setDensity] = useState<Density>(initial);

  function apply(next: string) {
    const value = parseDensity(next);
    setDensity(value);
    document.documentElement.dataset.density = value;
    document.cookie = `${DENSITY_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <ToggleGroup
      value={[density]}
      onValueChange={(value) => value[0] && apply(value[0])}
      variant="outline"
      size="sm"
      aria-label="Density mode"
    >
      <ToggleGroupItem value="compact" aria-label="Compact density" className="gap-1.5 px-2.5">
        <Rows3 className="size-3.5" />
        <span className="text-meta">Compact</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="comfortable"
        aria-label="Comfortable density"
        className="gap-1.5 px-2.5"
      >
        <AlignJustify className="size-3.5" />
        <span className="text-meta">Comfortable</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
