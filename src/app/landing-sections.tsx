"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/* ── Stagger variants ── */

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const stepContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const stepVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const rowContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

const pricingContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const pricingVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/* ── Animated Feature Grid ── */

export function AnimatedFeatureGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFeatureCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <motion.div variants={cardVariant}>{children}</motion.div>;
}

/* ── Animated Steps Grid ── */

export function AnimatedStepsGrid({
  children,
  connectorLine,
}: {
  children: React.ReactNode;
  connectorLine: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mt-16 grid gap-8 sm:grid-cols-3 sm:gap-6"
      variants={stepContainer}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {connectorLine}
      {children}
    </motion.div>
  );
}

export function AnimatedStep({
  children,
}: {
  children: React.ReactNode;
}) {
  return <motion.div variants={stepVariant}>{children}</motion.div>;
}

/* ── Animated Table Body ── */

export function AnimatedTableBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.tbody
      className="divide-y divide-white/[0.04]"
      variants={rowContainer}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.tbody>
  );
}

export function AnimatedTableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tr className={className} variants={rowVariant}>
      {children}
    </motion.tr>
  );
}

/* ── Animated Pricing Grid ── */

export function AnimatedPricingGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="mt-14 grid gap-6 sm:grid-cols-2 sm:gap-5 lg:mx-auto lg:max-w-3xl"
      variants={pricingContainer}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPricingCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <motion.div variants={pricingVariant}>{children}</motion.div>;
}

/* ── Animated CTA ── */

export function AnimatedCTA({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto max-w-2xl px-4 text-center"
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 24, scale: 0.97 }
      }
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section Header Reveal ── */

export function AnimatedSectionHeader({
  children,
  className = "text-center",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
