"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function HeroAnimations() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="hero-badge mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 shadow-lg shadow-blue-500/5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          AI-Powered FRC Scouting
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
      >
        Scout smarter.{" "}
        <span className="hero-gradient-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
          Win more.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400"
      >
        ScoutAI combines your team&apos;s observations with TBA data, Statbotics
        EPA, and AI analysis to give you a competitive edge at every event.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <Link
          href="/signup"
          className="group relative overflow-hidden rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
          <span className="relative z-10">
            Get Started Free
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>
        <a
          href="#features"
          className="rounded-lg border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5"
        >
          See Features
        </a>
      </motion.div>

      {/* Trust indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
        className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-500"
      >
        <span className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500/60"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Open Source
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500/60"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Free Forever
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500/60"><path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-1 .5A3.5 3.5 0 0 0 4 11a3.5 3.5 0 0 0 1.5 2.9A4 4 0 0 0 8 18h1"/><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1 1 .5A3.5 3.5 0 0 1 20 11a3.5 3.5 0 0 1-1.5 2.9A4 4 0 0 1 16 18h-1"/><path d="M12 2v20"/></svg>
          AI-Powered
        </span>
      </motion.div>
    </div>
  );
}
