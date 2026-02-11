"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  upsertTestimonial,
} from "@/lib/staff-actions";
import { Button } from "@/components/ui/button";

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
      <h2 className="text-xl font-bold">Testimonials</h2>
      <p className="mt-1 text-sm text-gray-400">Manage testimonials shown on the landing page.</p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">New Testimonial</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400">Quote</label>
            <textarea name="quote" rows={2} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="Add a testimonial quote" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Name</label>
            <input name="name" type="text" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Role</label>
            <input name="role" type="text" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Team</label>
            <input name="team" type="text" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400">Rating</label>
              <input name="rating" type="number" min={1} max={5} defaultValue={5} className="mt-1 w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">Sort</label>
              <input name="sortOrder" type="number" defaultValue={0} className="mt-1 w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-gray-300">
              <input name="isPublished" type="checkbox" defaultChecked />
              Published
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="md">Add testimonial</Button>
          </div>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {testimonials.length === 0 ? (
          <p className="text-sm text-gray-400">No testimonials yet.</p>
        ) : (
          testimonials.map((t) => (
            <form key={t.id} onSubmit={handleUpdate} className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
              <input type="hidden" name="id" value={t.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400">Quote</label>
                  <textarea name="quote" defaultValue={t.quote} rows={2} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400">Name</label>
                  <input name="name" type="text" defaultValue={t.name} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400">Role</label>
                  <input name="role" type="text" defaultValue={t.role} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400">Team</label>
                  <input name="team" type="text" defaultValue={t.team} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" required />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Rating</label>
                    <input name="rating" type="number" min={1} max={5} defaultValue={t.rating} className="mt-1 w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400">Sort</label>
                    <input name="sortOrder" type="number" defaultValue={t.sort_order} className="mt-1 w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                  <label className="mt-6 flex items-center gap-2 text-sm text-gray-300">
                    <input name="isPublished" type="checkbox" defaultChecked={t.is_published} />
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
          ))
        )}
      </div>
    </div>
  );
}
