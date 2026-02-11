"use client";

import { motion, useReducedMotion } from "framer-motion";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

export function MotionSection({
  children,
  delay = 0,
  className,
  id,
}: MotionSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={
        prefersReducedMotion
          ? false
          : {
              opacity: 0,
              y: 24,
            }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.section>
  );
}
