"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { respondContactMessage } from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";
import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

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

const statusColors: Record<string, string> = {
  new: "bg-green-500/15 text-green-400 ring-green-500/20",
  in_progress: "bg-blue-500/15 text-blue-400 ring-blue-500/20",
  replied: "bg-gray-500/15 text-gray-300 ring-gray-500/20",
  closed: "bg-gray-800/50 text-gray-500 ring-gray-600/20",
};

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
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Contact Inbox</h2>
          <p className="text-sm text-gray-400">Review inbound messages and draft replies.</p>
        </div>
      </div>

      <StaggerGroup className="mt-6 space-y-4">
        {contactMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 dashboard-panel p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-300">No contact messages yet</p>
            <p className="mt-1 text-xs text-gray-400">Messages from the contact form will appear here.</p>
          </div>
        ) : (
          contactMessages.map((msg) => (
            <StaggerChild key={msg.id}>
              <form
                onSubmit={handleUpdate}
                className={`rounded-2xl dashboard-panel dashboard-card p-5 ${msg.status === "new" ? "border-l-2 border-l-green-400" : ""}`}
              >
                <input type="hidden" name="id" value={msg.id} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{msg.subject}</p>
                    <p className="mt-1 text-xs text-gray-400">{msg.email} · {formatDateTime(msg.created_at)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusColors[msg.status] ?? statusColors.new}`}>
                    {msg.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-gray-200">{msg.message}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-400">Response</label>
                    <textarea name="response" rows={3} defaultValue={msg.response ?? ""} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" placeholder="Draft your reply..." />
                    <p className="mt-1 text-xs text-gray-500">Response drafts are stored here. You can email manually after saving.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Status</label>
                    <select name="status" defaultValue={msg.status} className="dashboard-input mt-1 w-full px-3 py-2 text-sm">
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">{msg.responded_at ? `Replied ${formatDateTime(msg.responded_at)}` : "No response yet"}</p>
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
                  <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}&body=${encodeURIComponent(msg.response ?? "")}`} className="inline-flex items-center gap-1.5 text-sm text-gray-300 underline underline-offset-4 transition hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Open email client
                  </a>
                </div>
              </form>
            </StaggerChild>
          ))
        )}
      </StaggerGroup>
    </div>
  );
}
