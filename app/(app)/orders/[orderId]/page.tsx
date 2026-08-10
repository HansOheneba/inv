import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { OrderDetail } from "@/components/orders/order-detail";
import { PageShell } from "@/components/app-shell/page-shell";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [profile, order] = await Promise.all([getCurrentProfile(), getOrderById(orderId)]);

  if (!order) notFound();

  return (
    <PageShell>
      <OrderDetail order={order} isOwner={isOwner(profile)} />
    </PageShell>
  );
}
