"use client";

import { LoginForm } from "@/components/login-form";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden flex items-center justify-center p-6 md:p-10">

      {/* --- BACKGROUND SHAPES (Corporate Memphis) --- */}

      {/* Shape 1: Big Emerald Circle */}
      <motion.div
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-100/50"
        animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Shape 2: Green Pill */}
      <motion.div
        className="absolute bottom-10 -left-10 w-64 h-32 rounded-full bg-green-100/60"
        animate={{ x: [0, 30, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Shape 3: Donut Ring */}
      <motion.div
        className="absolute top-20 left-10 w-24 h-24 border-8 border-emerald-500/20 rounded-full"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Shape 4: Decorative Dots */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-green-500 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/3 left-1/4 w-3 h-3 bg-emerald-400 rounded-full"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* --- THE ROOT LINES --- */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Define the Gradient */}
        <defs>
          <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0" />   {/* Transparent start */}
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.4" /> {/* Emerald Middle */}
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />  {/* Transparent end */}
          </linearGradient>
        </defs>

        {/* Root Line 1: Crossing from Mid-Right to Bottom-Left */}
        <motion.path
          stroke="url(#rootGradient)"
          strokeWidth="0.8"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: 1,
            // Animate the Curve (M=Move, C=Cubic Bezier)
            // We change the Control Points (the middle numbers) to make it wave
            d: [
              "M 100 40 C 70 40, 30 80, 0 60", // State A
              "M 100 40 C 70 60, 30 60, 0 60", // State B (Sway down)
              "M 100 40 C 70 30, 30 90, 0 60", // State C (Sway up)
              "M 100 40 C 70 40, 30 80, 0 60", // Back to A
            ]
          }}
          transition={{
            pathLength: { duration: 2, ease: "easeOut" }, // Draw in speed
            d: { duration: 10, repeat: Infinity, ease: "easeInOut" } // Waving speed
          }}
        />

        {/* Root Line 2: Crossing from Bottom-Right to Mid-Left */}
        <motion.path
          stroke="url(#rootGradient)"
          strokeWidth="0.8"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: 1,
            d: [
              "M 100 60 C 60 90, 40 30, 0 40",
              "M 100 60 C 70 80, 30 40, 0 40",
              "M 100 60 C 50 100, 50 20, 0 40",
              "M 100 60 C 60 90, 40 30, 0 40",
            ]
          }}
          transition={{
            pathLength: { duration: 2.5, ease: "easeOut", delay: 0.5 },
            d: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }}
        />
      </svg>

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
