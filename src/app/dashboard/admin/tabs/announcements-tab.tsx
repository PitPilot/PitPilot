"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { upsertAnnouncement } from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";
import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

interface Announcement {
  id: string;
  message: string;
  variant: string;
  is_active: boolean;
  created_at: string;
}

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onStatus: (msg: string) => void;
  onConfirmDelete: (info: { type: string; id: string; label: string }) => void;
}

const variantColors: Record<string, { dot: string; border: string }> = {
  info: { dot: "bg-blue-400", border: "border-l-blue-400" },
  success: { dot: "bg-green-400", border: "border-l-green-400" },
  warning: { dot: "bg-amber-400", border: "border-l-amber-400" },
  danger: { dot: "bg-red-400", border: "border-l-red-400" },
};

export function AnnouncementsTab({ announcements, onStatus, onConfirmDelete }: AnnouncementsTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await upsertAnnouncement(new FormData(form));
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Announcement saved.");
    form.reset();
    refresh();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await upsertAnnouncement(new FormData(e.currentTarget));
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Announcement updated.");
    refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Announcements</h2>
          <p className="text-sm text-gray-400">Publish short banners across the website.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl dashboard-panel p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400">New Announcement</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-400">Message</label>
            <input name="message" type="text" className="dashboard-input mt-1 w-full px-3 py-2 text-sm" placeholder="e.g. 2026 preseason demo is live!" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Variant</label>
            <select name="variant" className="dashboard-input mt-1 w-full px-3 py-2 text-sm" defaultValue="info">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="isActive" className="h-4 w-4 rounded border-white/20 bg-white/5" />
            Active
          </label>
          <div className="md:col-span-6">
            <Button type="submit" size="md">Publish announcement</Button>
          </div>
        </div>
      </form>

      <StaggerGroup className="mt-6 space-y-4">
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 dashboard-panel p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-300">No announcements yet</p>
            <p className="mt-1 text-xs text-gray-400">Create your first announcement above.</p>
          </div>
        ) : (
          announcements.map((a) => {
            const vc = variantColors[a.variant] ?? variantColors.info;
            return (
              <StaggerChild key={a.id}>
                <form onSubmit={handleUpdate} className={`rounded-2xl dashboard-panel dashboard-card border-l-2 ${vc.border} p-5`}>
                  <input type="hidden" name="id" value={a.id} />
                  <div className="grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className={`h-2 w-2 rounded-full ${vc.dot}`} />
                        Message
                      </label>
                      <input name="message" type="text" defaultValue={a.message} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Variant</label>
                      <select name="variant" defaultValue={a.variant} className="dashboard-input mt-1 w-full px-3 py-2 text-sm">
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="danger">Danger</option>
                      </select>
                    </div>
                    <label className="mt-6 flex items-center gap-2 text-sm text-gray-300">
                      <input type="checkbox" name="isActive" defaultChecked={a.is_active} className="h-4 w-4 rounded border-white/20 bg-white/5" />
                      {a.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Inactive</span>
                      )}
                    </label>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Button type="submit" size="sm">Save</Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onConfirmDelete({ type: "announcement", id: a.id, label: `announcement "${a.message.slice(0, 40)}…"` })}
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              </StaggerChild>
            );
          })
        )}
      </StaggerGroup>
    </div>
  );
}
