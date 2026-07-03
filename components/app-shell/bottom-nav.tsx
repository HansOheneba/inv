"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Receipt, Ship, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNav({ showEmployees }: { showEmployees: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/sales", label: "Sales", icon: Receipt },
    { href: "/shipments", label: "Shipments", icon: Ship },
    ...(showEmployees ? [{ href: "/employees", label: "Team", icon: Users }] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid h-14 max-w-lg grid-flow-col auto-cols-fr">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-meta transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
