import { redirect } from "next/navigation";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getEmployees } from "@/lib/data/employees";
import { toggleEmployeeRoleAction, toggleEmployeeActiveAction } from "@/lib/actions/employees";
import { InviteMemberDialog } from "@/components/employees/invite-member-dialog";
import { PageHeader, PageShell } from "@/components/app-shell/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  const source = name.trim() || "?";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function EmployeesPage() {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) redirect("/");

  const employees = await getEmployees();
  const activeCount = employees.filter((employee) => employee.active).length;

  return (
    <PageShell>
      <PageHeader
        title="Team"
        description={`${activeCount} active · ${employees.length} total`}
        actions={<InviteMemberDialog />}
      />

      {employees.length === 0 ? (
        <p className="rounded-xl border px-5 py-14 text-center text-meta text-muted-foreground">
          No team members yet. Invite someone to get started.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {employees.map((employee) => (
            <li key={employee.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="text-caption">
                  {initials(employee.fullName || employee.email || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-row-title font-medium">
                  {employee.fullName || "Unnamed"}
                  {!employee.active ? (
                    <span className="ml-2 text-meta text-muted-foreground">(inactive)</span>
                  ) : null}
                </p>
                <p className="truncate text-meta text-muted-foreground">
                  {employee.email ?? "No email"}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {employee.role}
              </Badge>
              {employee.id !== profile.id ? (
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <form action={toggleEmployeeRoleAction}>
                    <input type="hidden" name="profileId" value={employee.id} />
                    <input
                      type="hidden"
                      name="nextRole"
                      value={employee.role === "owner" ? "employee" : "owner"}
                    />
                    <Button type="submit" variant="outline">
                      Make {employee.role === "owner" ? "employee" : "owner"}
                    </Button>
                  </form>
                  <form action={toggleEmployeeActiveAction}>
                    <input type="hidden" name="profileId" value={employee.id} />
                    <input type="hidden" name="active" value={String(employee.active)} />
                    <Button type="submit" variant="ghost">
                      {employee.active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </div>
              ) : (
                <span className="shrink-0 text-meta text-muted-foreground">You</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
