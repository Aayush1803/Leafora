"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface ConfidenceDisplayProps {
  value: number; // 0–1
}

export default function ConfidenceDisplay({ value }: ConfidenceDisplayProps) {
  const pct = value * 100;
  const isHigh = pct >= 80;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 16,
    restDelta: 0.01,
  });
  const display = useTransform(springValue, (v) => v.toFixed(2) + "%");

  useEffect(() => {
    motionValue.set(pct);
  }, [pct, motionValue]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <span className="t-label">CONFIDENCE</span>

      {/* Large animated number */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: "700",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: isHigh ? "var(--color-text-primary)" : "var(--color-accent)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <motion.span>{display}</motion.span>
      </motion.p>

      {/* Thin bar */}
      <div
        style={{
          height: "2px",
          backgroundColor: "var(--color-border-subtle)",
          borderRadius: "2px",
          overflow: "hidden",
          position: "relative",
        }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${pct.toFixed(2)}%`}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 1,
            delay: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            backgroundColor: isHigh
              ? "var(--color-text-primary)"
              : "var(--color-accent)",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Calibration text */}
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          letterSpacing: "0.01em",
        }}
      >
        {isHigh
          ? "High-confidence classification"
          : "Consider reviewing image quality"}
      </p>
    </div>
  );
}
