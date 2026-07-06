import { redirect } from "next/navigation";
import { getCurrentProfile, isOwner } from "@/lib/auth";
import { getEmployees } from "@/lib/data/employees";
import { toggleEmployeeRoleAction, toggleEmployeeActiveAction } from "@/lib/actions/employees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4">
        <h1 className="text-page-title font-semibold">Team</h1>
        <p className="text-meta text-muted-foreground">
          {employees.length} people with access to Raj Kollections
        </p>
      </div>

      <Alert className="mb-3">
        <Info className="size-4" />
        <AlertTitle className="text-row-value">Adding someone new</AlertTitle>
        <AlertDescription className="text-meta">
          Create their login in the Supabase dashboard (Authentication → Users). They&apos;ll appear
          here as an employee the first time they sign in — promote them to owner below if needed.
        </AlertDescription>
      </Alert>

      <ul className="divide-y overflow-hidden rounded-lg border">
        {employees.map((employee) => (
          <li key={employee.id} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-[11px]">
                {initials(employee.full_name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-row-title font-medium">
                {employee.full_name || "Unnamed"}
                {!employee.active ? (
                  <span className="ml-2 text-meta text-muted-foreground">(inactive)</span>
                ) : null}
              </p>
              <Badge variant="secondary" className="text-[11px] capitalize">
                {employee.role}
              </Badge>
            </div>
            {employee.id !== profile.id ? (
              <div className="flex shrink-0 gap-1.5">
                <form action={toggleEmployeeRoleAction}>
                  <input type="hidden" name="profileId" value={employee.id} />
                  <input
                    type="hidden"
                    name="nextRole"
                    value={employee.role === "owner" ? "employee" : "owner"}
                  />
                  <Button type="submit" variant="outline" size="sm">
                    Make {employee.role === "owner" ? "employee" : "owner"}
                  </Button>
                </form>
                <form action={toggleEmployeeActiveAction}>
                  <input type="hidden" name="profileId" value={employee.id} />
                  <input type="hidden" name="active" value={String(employee.active)} />
                  <Button type="submit" variant="ghost" size="sm">
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
    </div>
  );
}
