import { redirect } from "next/navigation";
import { getOptionalProfile } from "@/lib/auth";
import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const profile = await getOptionalProfile();
  if (profile) {
    redirect("/");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <span className="text-[15px] font-semibold">RK</span>
        </div>
        <h1 className="text-page-title font-semibold">Raj Kollections</h1>
        <p className="text-meta text-muted-foreground">
          Sign in to manage inventory, sales, and shipments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Welcome back</CardTitle>
          <CardDescription className="text-meta">
            Use the account your business owner set up for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInAction}>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
