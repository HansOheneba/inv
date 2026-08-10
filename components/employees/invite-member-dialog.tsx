"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { inviteEmployeeAction, type InviteEmployeeResult } from "@/lib/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";

export function InviteMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result: InviteEmployeeResult = await inviteEmployeeAction(
      {},
      new FormData(event.currentTarget),
    );
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(
      result.tempPassword
        ? `Invited ${result.email}. Temporary password: ${result.tempPassword}`
        : `Invite sent to ${result.email}`,
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Invite member
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-section-title">Invite team member</DialogTitle>
          <DialogDescription className="text-meta">
            They&apos;ll get employee access and can sign in with the email you add.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="invite-member-form">
          <FieldGroup>
            {error ? <FieldError>{error}</FieldError> : null}
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input id="fullName" name="fullName" placeholder="e.g. Ama Mensah" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ama@example.com"
                autoComplete="off"
                required
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="invite-member-form" disabled={pending} className="w-full">
            {pending ? "Inviting…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
