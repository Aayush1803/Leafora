"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ApiError } from "@/lib/api";

interface ErrorBannerProps {
  error: ApiError | null;
  onDismiss: () => void;
}

const errorConfig: Record<
  ApiError["type"],
  { label: string; icon: string }
> = {
  validation: { label: "INVALID FILE", icon: "⚠" },
  server: { label: "SERVER ERROR", icon: "✕" },
  network: { label: "NETWORK ERROR", icon: "◌" },
  timeout: { label: "TIMEOUT", icon: "◷" },
  unavailable: { label: "SERVICE STARTING", icon: "◉" },
};

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  const config = errorConfig[error.type];

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          role="alert"
          aria-live="assertive"
          style={{
            padding: "1rem 1.25rem",
            backgroundColor:
              error.type === "unavailable"
                ? "var(--color-accent-soft)"
                : "var(--color-danger-soft)",
            border: `1px solid ${
              error.type === "unavailable"
                ? "rgba(155, 106, 63, 0.25)"
                : "rgba(139, 58, 58, 0.2)"
            }`,
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
          }}
        >
          {/* Icon */}
          <span
            style={{
              fontSize: "1rem",
              color:
                error.type === "unavailable"
                  ? "var(--color-accent)"
                  : "var(--color-danger)",
              flexShrink: 0,
              marginTop: "1px",
            }}
            aria-hidden="true"
          >
            {config.icon}
          </span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="t-label"
              style={{
                color:
                  error.type === "unavailable"
                    ? "var(--color-accent)"
                    : "var(--color-danger)",
                marginBottom: "0.25rem",
              }}
            >
              {config.label}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                lineHeight: "1.5",
              }}
            >
              {error.message}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              fontSize: "1rem",
              padding: "0 0 0 0.5rem",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
