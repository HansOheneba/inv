import Link from "next/link";
import { ArrowRight, Globe2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ATLAS_NAME } from "@/lib/insights/atlas";

export function AtlasPromoCard() {
  return (
    <Card className="relative gap-3 overflow-hidden border-none bg-primary py-5 text-primary-foreground">
      <Globe2
        className="pointer-events-none absolute -right-8 -bottom-10 size-44 text-primary-foreground/10"
        strokeWidth={1}
      />
      <CardContent className="relative px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
          <Sparkles className="size-4" />
        </div>
        <h3 className="mt-3 text-row-title font-medium">{ATLAS_NAME} at your service</h3>
        <p className="mt-1 max-w-[85%] text-meta text-primary-foreground/70">
          Ask about stock, sales, or what&apos;s incoming — answered straight from your live
          numbers.
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4 w-fit gap-1.5"
          nativeButton={false}
          render={<Link href="/insights" />}
        >
          Explore insights
          <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
