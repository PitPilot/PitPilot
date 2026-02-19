"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PickListLoadingContext = createContext({
  loading: false,
  setLoading: (_: boolean) => {},
});

export function usePickListLoading() {
  return useContext(PickListLoadingContext);
}

export function PickListLoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  return (
    <PickListLoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </PickListLoadingContext.Provider>
  );
}

function SkeletonTeamRow({ delay }: { delay: number }) {
  return (
    <div className="px-6 py-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/8" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-32 animate-pulse rounded bg-white/6" />
          </div>
          <div className="h-3 w-11/12 animate-pulse rounded bg-white/8" style={{ animationDelay: "80ms" }} />
          <div className="h-3 w-9/12 animate-pulse rounded bg-white/6" style={{ animationDelay: "160ms" }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-14 animate-pulse rounded-full bg-white/8" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-white/6" />
          <div className="h-7 w-10 animate-pulse rounded-md bg-white/8" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-white/5 p-2 text-center">
            <div className="mx-auto h-2 w-8 animate-pulse rounded bg-white/8" />
            <div className="mx-auto mt-1.5 h-4 w-10 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PickListSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]"
    >
      <div className="space-y-6">
        {/* Strategy Summary skeleton */}
        <section className="rounded-2xl dashboard-panel p-6">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400/70" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-purple-400" />
            </span>
            <p className="text-sm font-medium text-gray-200">
              Generating your alliance pick list...
            </p>
          </div>
          <p className="mt-1.5 ml-6.5 text-xs text-gray-500">
            This may take up to a minute depending on the number of teams.
          </p>
          <div className="mt-5 space-y-2.5">
            <div className="h-3 w-full animate-pulse rounded bg-white/8" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-white/6" style={{ animationDelay: "100ms" }} />
            <div className="h-3 w-10/12 animate-pulse rounded bg-white/8" style={{ animationDelay: "200ms" }} />
          </div>
        </section>

        {/* Ranked Teams skeleton */}
        <section className="rounded-2xl dashboard-table overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-3">
            <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
          </div>
          <div className="divide-y divide-white/10">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonTeamRow key={i} delay={i * 60} />
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar skeleton */}
      <aside className="space-y-6">
        <section className="rounded-2xl dashboard-panel p-6">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-5 w-48 animate-pulse rounded bg-white/8" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-white/6" />
          <div className="mt-6 h-32 w-full animate-pulse rounded-xl bg-white/5" />
        </section>
        <section className="rounded-2xl dashboard-panel p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-white/6" />
          <div className="mt-4 h-10 w-44 animate-pulse rounded-lg bg-white/8" />
        </section>
      </aside>
    </motion.div>
  );
}

export function PickListContentArea({ children }: { children: ReactNode }) {
  const { loading } = usePickListLoading();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <PickListSkeleton key="skeleton" />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
