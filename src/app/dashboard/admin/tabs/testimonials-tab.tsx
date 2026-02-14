"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { upsertTestimonial } from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";
import { StaggerGroup, StaggerChild } from "@/components/ui/animate-in";

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  team: string;
  rating: number;
  sort_order: number;
  is_published: boolean;
}

interface TestimonialsTabProps {
  testimonials: Testimonial[];
  onStatus: (msg: string) => void;
  onConfirmDelete: (info: { type: string; id: string; label: string }) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-teal-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "opacity-100" : "opacity-20"}>★</span>
      ))}
    </span>
  );
}

export function TestimonialsTab({ testimonials, onStatus, onConfirmDelete }: TestimonialsTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await upsertTestimonial(new FormData(form));
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Testimonial saved.");
    form.reset();
    refresh();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await upsertTestimonial(new FormData(e.currentTarget));
    if (result?.error) { onStatus(result.error); return; }
    onStatus("Testimonial updated.");
    refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Testimonials</h2>
          <p className="text-sm text-gray-400">Manage testimonials shown on the landing page.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl dashboard-panel p-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-400">New Testimonial</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400">Quote</label>
            <textarea name="quote" rows={2} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" placeholder="Add a testimonial quote" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Name</label>
            <input name="name" type="text" className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Role</label>
            <input name="role" type="text" className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Team</label>
            <input name="team" type="text" className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400">Rating</label>
              <input name="rating" type="number" min={1} max={5} defaultValue={5} className="dashboard-input mt-1 w-20 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">Sort</label>
              <input name="sortOrder" type="number" defaultValue={0} className="dashboard-input mt-1 w-20 px-3 py-2 text-sm" />
            </div>
            <label className="mt-5 flex items-center gap-2 text-sm text-gray-300">
              <input name="isPublished" type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/20 bg-white/5" />
              Published
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="md">Add testimonial</Button>
          </div>
        </div>
      </form>

      <StaggerGroup className="mt-6 space-y-4">
        {testimonials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 dashboard-panel p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-300">No testimonials yet</p>
            <p className="mt-1 text-xs text-gray-400">Add your first testimonial above.</p>
          </div>
        ) : (
          testimonials.map((t) => (
            <StaggerChild key={t.id}>
              <form onSubmit={handleUpdate} className="rounded-2xl dashboard-panel dashboard-card p-5">
                <input type="hidden" name="id" value={t.id} />
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <Stars rating={t.rating} />
                  {t.is_published ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400 ring-1 ring-green-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs font-semibold text-gray-400 ring-1 ring-gray-500/20">
                      Draft
                    </span>
                  )}
                  <span className="text-xs text-gray-500">Sort: {t.sort_order}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400">Quote</label>
                    <textarea name="quote" defaultValue={t.quote} rows={2} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Name</label>
                    <input name="name" type="text" defaultValue={t.name} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Role</label>
                    <input name="role" type="text" defaultValue={t.role} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Team</label>
                    <input name="team" type="text" defaultValue={t.team} className="dashboard-input mt-1 w-full px-3 py-2 text-sm" required />
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Rating</label>
                      <input name="rating" type="number" min={1} max={5} defaultValue={t.rating} className="dashboard-input mt-1 w-20 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400">Sort</label>
                      <input name="sortOrder" type="number" defaultValue={t.sort_order} className="dashboard-input mt-1 w-20 px-3 py-2 text-sm" />
                    </div>
                    <label className="mt-5 flex items-center gap-2 text-sm text-gray-300">
                      <input name="isPublished" type="checkbox" defaultChecked={t.is_published} className="h-4 w-4 rounded border-white/20 bg-white/5" />
                      Published
                    </label>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button type="submit" size="sm">Save</Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onConfirmDelete({ type: "testimonial", id: t.id, label: `testimonial by ${t.name}` })}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            </StaggerChild>
          ))
        )}
      </StaggerGroup>
    </div>
  );
}
