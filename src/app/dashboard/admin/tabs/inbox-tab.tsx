"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  respondContactMessage,
} from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";

interface ContactMessage {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  created_at: string;
  responded_at: string | null;
}

interface InboxTabProps {
  contactMessages: ContactMessage[];
  onStatus: (msg: string) => void;
  onConfirmDelete: (info: { type: string; id: string; label: string }) => void;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InboxTab({ contactMessages, onStatus, onConfirmDelete }: InboxTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await respondContactMessage(new FormData(e.currentTarget));
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Response saved.");
    refresh();
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Contact Inbox</h2>
      <p className="mt-1 text-sm text-gray-400">Review inbound messages and draft replies.</p>

      <div className="mt-6 space-y-4">
        {contactMessages.length === 0 ? (
          <p className="text-sm text-gray-400">No contact messages yet.</p>
        ) : (
          contactMessages.map((msg) => (
            <form key={msg.id} onSubmit={handleUpdate} className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
              <input type="hidden" name="id" value={msg.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{msg.subject}</p>
                  <p className="mt-1 text-xs text-gray-400">{msg.email} · {formatDateTime(msg.created_at)}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300">{msg.status}</span>
              </div>
              <p className="mt-3 text-sm text-gray-200">{msg.message}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-400">Response</label>
                  <textarea name="response" rows={3} defaultValue={msg.response ?? ""} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="Draft your reply..." />
                  <p className="mt-1 text-xs text-gray-400">Response drafts are stored here. You can email manually after saving.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400">Status</label>
                  <select name="status" defaultValue={msg.status} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-400">{msg.responded_at ? `Replied ${formatDateTime(msg.responded_at)}` : "No response yet"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm">Save response</Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onConfirmDelete({ type: "contact", id: msg.id, label: `message from ${msg.email}` })}
                >
                  Delete
                </Button>
                <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}&body=${encodeURIComponent(msg.response ?? "")}`} className="text-sm text-gray-300 underline underline-offset-4 transition hover:text-white">Open email client</a>
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
