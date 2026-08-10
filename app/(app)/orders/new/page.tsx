import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderFormOptions } from "@/lib/data/orders";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { PageShell } from "@/components/app-shell/page-shell";
import { Button } from "@/components/ui/button";

export default async function NewOrderPage() {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) redirect("/orders");

  const options = await getOrderFormOptions();

  return (
    <PageShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <Button
            variant="ghost"
            className="mb-2 -ml-2 gap-1.5 text-meta"
            nativeButton={false}
            render={<Link href="/orders" />}
          >
            <ArrowLeft className="size-4" />
            Orders
          </Button>
          <h1 className="text-page-title font-semibold">New order</h1>
          <p className="text-meta text-muted-foreground">
            Capture what the customer ordered over WhatsApp. Once saved it appears on the Ghana
            team&apos;s board to pack and dispatch.
          </p>
        </div>
        <NewOrderForm options={options} />
      </div>
    </PageShell>
  );
}
