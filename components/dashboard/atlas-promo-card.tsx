import Link from "next/link";
import { ArrowRight, Globe2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ATLAS_NAME } from "@/lib/insights/atlas";

export function AtlasPromoCard() {
  return (
    <Card className="relative h-full gap-0 overflow-hidden border-none bg-accent-brand py-5 text-accent-brand-foreground">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent-teal/40 via-transparent to-accent-sky/30" />
      <Globe2
        className="pointer-events-none absolute -right-8 -bottom-10 size-44 text-white/10"
        strokeWidth={1}
      />
      <CardContent className="relative flex h-full flex-col px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
          <Sparkles className="size-4" />
        </div>
        <h3 className="mt-3 text-row-title font-medium">{ATLAS_NAME} at your service</h3>
        <p className="mt-1 max-w-[85%] text-meta text-white/75">
          Ask about stock, sales, or what&apos;s incoming — answered straight from your live
          numbers.
        </p>
        <Button
          variant="secondary"
          className="mt-auto w-fit gap-1.5"
          nativeButton={false}
          render={<Link href="/insights" />}
        >
          Explore insights
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
