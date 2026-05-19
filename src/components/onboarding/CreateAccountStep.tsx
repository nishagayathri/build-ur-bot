"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAccount } from "@/hooks/useAccounts";
import type { AccountSummary } from "@/context/AccountContext";

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
];

interface CreateAccountStepProps {
  onComplete: (account: AccountSummary) => void;
}

export function CreateAccountStep({ onComplete }: CreateAccountStepProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const createAccount = useCreateAccount();

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [name, slugManuallyEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const account = await createAccount.mutateAsync({
        name,
        slug,
        description: description || undefined,
        color,
      });
      onComplete(account);
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Create your newsroom
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your AI-powered content operation. You can always change these
          later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Name */}
        <div className="space-y-2">
          <Label htmlFor="account-name">Account name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Deriv Markets, CryptoDesk, etc."
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="account-slug">URL slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">marketary.app/</span>
            <Input
              id="account-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                setSlugManuallyEdited(true);
              }}
              placeholder="your-newsroom"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This will be your unique workspace identifier
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="account-description">Description</Label>
          <Textarea
            id="account-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what this newsroom is about"
            rows={3}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Brand color</Label>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "white" : "transparent",
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-10 cursor-pointer border-0 p-0"
            />
          </div>
        </div>

        {createAccount.isError && (
          <p className="text-sm text-destructive">
            {createAccount.error instanceof Error
              ? createAccount.error.message
              : "Failed to create account"}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!name || !slug || createAccount.isPending}
        >
          {createAccount.isPending ? "Creating..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
