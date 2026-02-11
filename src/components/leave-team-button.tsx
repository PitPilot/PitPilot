"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveOrganization } from "@/lib/auth-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface LeaveTeamButtonProps {
  label?: string;
}

export function LeaveTeamButton({ label = "Leave team" }: LeaveTeamButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const result = await leaveOrganization();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace("/join");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="inline-flex items-center rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/10 disabled:opacity-60"
      >
        {isPending ? "Leaving..." : label}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title="Leave team?"
        description="You will lose access to team data and scouting history until you rejoin with a new code."
        confirmLabel={isPending ? "Leaving..." : "Leave team"}
        cancelLabel="Stay"
        tone="danger"
        confirmDisabled={isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          handleLeave();
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
