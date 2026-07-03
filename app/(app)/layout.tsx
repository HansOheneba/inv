import { getCurrentProfile, isOwner } from "@/lib/auth";
import { TopBar } from "@/components/app-shell/top-bar";
import { BottomNav } from "@/components/app-shell/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar profile={profile} />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav showEmployees={isOwner(profile)} />
    </div>
  );
}
