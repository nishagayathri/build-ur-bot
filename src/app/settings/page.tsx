"use client";

import { useAccountContext } from "@/context/AccountContext";
import { useDeleteAccount } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountSettingsPage() {
  const { activeAccount } = useAccountContext();
  const [name, setName] = useState(activeAccount?.name ?? "");
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const deleteAccount = useDeleteAccount(activeAccount?.id ?? "");

  if (!activeAccount) {
    return (
      <div className="text-muted-foreground">No account selected.</div>
    );
  }

  const handleDelete = async () => {
    await deleteAccount.mutateAsync();
    setDialogOpen(false);
    router.push("/");
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Workspace settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Workspace name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">marketary.app/</span>
            <Input value={activeAccount.slug} disabled />
          </div>
        </div>

        <Button disabled={name === activeAccount.name}>
          Save changes
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-destructive">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete this workspace and all its data.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmText(""); }}>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>
            Delete workspace
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete workspace</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{activeAccount.name}</strong> and
                all its agents, personas, stories, and data. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>
                Type <strong>{activeAccount.name}</strong> to confirm
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={activeAccount.name}
              />
            </div>

            <DialogFooter showCloseButton>
              <Button
                variant="destructive"
                disabled={confirmText !== activeAccount.name || deleteAccount.isPending}
                onClick={handleDelete}
              >
                {deleteAccount.isPending ? "Deleting..." : "Delete workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
