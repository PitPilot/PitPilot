"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { removeOrgEvent } from "@/lib/org-event-actions";

interface OrgEvent {
  id: string;
  is_attending: boolean;
  events: {
    id: string;
    tba_key: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    year: number | null;
  } | null;
}

interface SortableEventsProps {
  orgEvents: OrgEvent[];
  isCaptain: boolean;
}

const STORAGE_KEY = "scoutai-events-order";
type DropPosition = "before" | "after";

function formatEventTitle(event: { name: string; year?: number | null; start_date?: string | null; tba_key?: string | null }) {
  const year =
    event.year ??
    (event.start_date ? event.start_date.slice(0, 4) : event.tba_key?.slice(0, 4));
  return year ? `${year} ${event.name}` : event.name;
}

function formatDate(date: string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitialOrder(orgEvents: OrgEvent[]): OrgEvent[] {
  if (typeof window === "undefined") return orgEvents;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedOrder: string[] = JSON.parse(saved);
      return [...orgEvents].sort((a, b) => {
        const aIndex = savedOrder.indexOf(a.id);
        const bIndex = savedOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
  } catch {
    // localStorage may not be available
  }
  return orgEvents;
}

export function SortableEvents({
  orgEvents,
  isCaptain,
}: SortableEventsProps) {
  const router = useRouter();
  const [orderedEvents, setOrderedEvents] = useState<OrgEvent[]>(() => getInitialOrder(orgEvents));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: DropPosition;
  } | null>(null);

  // Pointer-based drag state
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDragging = useRef(false);
  const draggedIdRef = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrderedEvents(getInitialOrder(orgEvents));
  }, [orgEvents]);

  function saveOrder(events: OrgEvent[]) {
    try {
      const order = events.map((e) => e.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // localStorage may not be available
    }
  }

  function commitOrder(nextEvents: OrgEvent[]) {
    setOrderedEvents(nextEvents);
    saveOrder(nextEvents);
  }

  function reorderEvents(
    sourceId: string,
    targetId: string,
    position: DropPosition
  ) {
    if (sourceId === targetId) return;
    setOrderedEvents((prev) => {
      const sourceIndex = prev.findIndex((e) => e.id === sourceId);
      const targetIndex = prev.findIndex((e) => e.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      let insertIndex = next.findIndex((e) => e.id === targetId);
      if (insertIndex === -1) return prev;
      if (position === "after") insertIndex += 1;
      next.splice(insertIndex, 0, moved);
      saveOrder(next);
      return next;
    });
  }

  function moveBy(id: string, delta: -1 | 1) {
    const index = orderedEvents.findIndex((event) => event.id === id);
    const nextIndex = index + delta;
    if (index === -1 || nextIndex < 0 || nextIndex >= orderedEvents.length) return;
    const next = [...orderedEvents];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    commitOrder(next);
  }

  // --- Pointer-based drag system ---

  const updateGhostPosition = useCallback((clientX: number, clientY: number) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.left = `${clientX - dragOffsetRef.current.x}px`;
    ghost.style.top = `${clientY - dragOffsetRef.current.y}px`;
  }, []);

  const findDropTarget = useCallback((clientX: number, clientY: number): { id: string; position: DropPosition } | null => {
    const currentDraggedId = draggedIdRef.current;
    if (!currentDraggedId) return null;

    for (const [id, el] of cardRefsMap.current.entries()) {
      if (id === currentDraggedId) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const midY = rect.top + rect.height / 2;
        return { id, position: clientY < midY ? "before" : "after" };
      }
    }
    return null;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    updateGhostPosition(e.clientX, e.clientY);
    const target = findDropTarget(e.clientX, e.clientY);
    setDropTarget(target);
  }, [updateGhostPosition, findDropTarget]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    isDragging.current = false;

    const sourceId = draggedIdRef.current;
    const target = findDropTarget(e.clientX, e.clientY);

    // Clean up ghost
    const ghost = ghostRef.current;
    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
    ghostRef.current = null;

    // Apply reorder
    if (sourceId && target) {
      reorderEvents(sourceId, target.id, target.position);
    }

    setDraggedId(null);
    setDropTarget(null);
    draggedIdRef.current = null;

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findDropTarget, handlePointerMove]);

  function startDrag(e: React.PointerEvent, id: string) {
    const cardEl = cardRefsMap.current.get(id);
    if (!cardEl) return;

    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    const rect = cardEl.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Create ghost
    const ghost = document.createElement("div");
    ghost.innerHTML = cardEl.outerHTML;
    const inner = ghost.firstElementChild as HTMLElement;
    if (inner) {
      inner.style.width = `${rect.width}px`;
      inner.style.transform = "rotate(1.5deg) scale(1.02)";
      inner.style.boxShadow = "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.3)";
      inner.style.opacity = "0.95";
      inner.style.pointerEvents = "none";
    }
    ghost.style.position = "fixed";
    ghost.style.zIndex = "10000";
    ghost.style.pointerEvents = "none";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.transition = "none";
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    isDragging.current = true;
    draggedIdRef.current = id;
    setDraggedId(id);
    setDropTarget(null);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }

  // Compute placeholder position in the visible list
  const visibleEvents = orderedEvents;

  const placeholderInfo = (() => {
    if (!draggedId || !dropTarget) return null;
    const targetIndex = visibleEvents.findIndex((e) => e.id === dropTarget.id);
    if (targetIndex === -1) return null;
    const insertIndex = dropTarget.position === "before" ? targetIndex : targetIndex + 1;
    // Get the height of the dragged card for the placeholder
    const draggedCard = cardRefsMap.current.get(draggedId);
    const height = draggedCard ? draggedCard.offsetHeight : 140;
    return { insertIndex, height };
  })();

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Drag cards by the grip to reorder. On touch devices, use the arrow controls.
      </p>
      <div
        ref={gridRef}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visibleEvents.map((orgEvent, renderIndex) => {
          const event = orgEvent.events;
          if (!event) return null;
          const index = orderedEvents.findIndex((e) => e.id === orgEvent.id);
          const isBeingDragged = draggedId === orgEvent.id;

          const showPlaceholderBefore = placeholderInfo?.insertIndex === renderIndex;
          const showPlaceholderAfter =
            placeholderInfo?.insertIndex === visibleEvents.length &&
            renderIndex === visibleEvents.length - 1;

          const card = (
            <div
              key={`card-${orgEvent.id}`}
              ref={(el) => {
                if (el) cardRefsMap.current.set(orgEvent.id, el);
                else cardRefsMap.current.delete(orgEvent.id);
              }}
              data-sort-card-id={orgEvent.id}
              className={`group relative rounded-2xl dashboard-panel dashboard-card p-5 transition-all duration-200 ${
                isBeingDragged
                  ? "opacity-30 scale-[0.97]"
                  : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/dashboard/events/${event.tba_key}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    {orgEvent.is_attending ? (
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-400" title="Attending" />
                    ) : (
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gray-500" title="Not attending" />
                    )}
                    <h4 className="truncate text-base font-semibold text-white">
                      {formatEventTitle(event)}
                    </h4>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {event.location}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(event.start_date)} &mdash;{" "}
                    {formatDate(event.end_date)}
                  </p>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={(e) => startDrag(e, orgEvent.id)}
                    className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:bg-white/5 hover:text-gray-200 active:cursor-grabbing touch-none"
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBy(orgEvent.id, -1)}
                    disabled={index === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:bg-white/5 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Move event up"
                    title="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBy(orgEvent.id, 1)}
                    disabled={index === orderedEvents.length - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:bg-white/5 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Move event down"
                    title="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <form action={async (formData: FormData) => {
                    await removeOrgEvent(formData);
                    router.refresh();
                  }}>
                    <input type="hidden" name="orgEventId" value={orgEvent.id} />
                    <ConfirmButton
                      type="submit"
                      disabled={!isCaptain}
                      title="Remove event from dashboard?"
                      description="This only removes the event from your team's dashboard. It won't delete global event data."
                      confirmLabel="Remove event"
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${
                        isCaptain
                          ? "border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                          : "border-white/5 text-gray-600 cursor-not-allowed"
                      }`}
                      aria-label={
                        isCaptain
                          ? "Remove event"
                          : "Only captains can remove events"
                      }
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    </ConfirmButton>
                  </form>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/dashboard/events/${event.tba_key}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-blue-300 dashboard-chip dashboard-chip-action"
                >
                  Open event
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
                {!orgEvent.is_attending && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">
                    Not Attending
                  </span>
                )}
              </div>
            </div>
          );

          if (showPlaceholderBefore) {
            return (
              <Fragment key={`wrap-before-${orgEvent.id}`}>
                <div
                  className="rounded-2xl border-2 border-dashed border-blue-400/40 bg-blue-500/5 transition-all duration-200"
                  style={{ minHeight: `${placeholderInfo?.height ?? 140}px` }}
                />
                {card}
              </Fragment>
            );
          }

          if (showPlaceholderAfter) {
            return (
              <Fragment key={`wrap-after-${orgEvent.id}`}>
                {card}
                <div
                  className="rounded-2xl border-2 border-dashed border-blue-400/40 bg-blue-500/5 transition-all duration-200"
                  style={{ minHeight: `${placeholderInfo?.height ?? 140}px` }}
                />
              </Fragment>
            );
          }

          return card;
        })}
      </div>
    </div>
  );
}
