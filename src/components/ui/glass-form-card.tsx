"use client";

import { type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/** Glass card - fond noir semi-transparent, blur, bordure fine, léger tilt 3D */
export function GlassFormCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 24, mass: 0.55 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 24, mass: 0.55 });
  const rotateX = useTransform(springY, [-280, 280], [3, -3]);
  const rotateY = useTransform(springX, [-280, 280], [-3, 3]);

  function handleMouseMove(e: React.MouseEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative z-10 w-full", className)}
      style={{ perspective: 1600 }}
    >
      <motion.div
        className="relative"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-70" />
        <div className="relative overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#0a0812]/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 10%, #c084fc 0%, transparent 45%), radial-gradient(circle at 80% 90%, #7c3aed 0%, transparent 40%)",
            }}
          />
          <div className="relative z-[1]">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
