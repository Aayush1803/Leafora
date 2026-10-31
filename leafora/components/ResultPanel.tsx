"use client";

import { motion } from "framer-motion";
import { parseClassName, formatConfidence } from "@/lib/api";
import type { PredictResponse } from "@/lib/api";
import ConfidenceDisplay from "./ConfidenceDisplay";

interface ResultPanelProps {
  result: PredictResponse;
  previewUrl: string | null;
  onReset: () => void;
}

export default function ResultPanel({
  result,
  previewUrl,
  onReset,
}: ResultPanelProps) {
  const primary = parseClassName(result.predicted_class);
  const alternatives = result.top_predictions.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: "100%" }}
    >
      {/* ── Main layout: image + result ── */}
      <div className="result-grid">
        {/* Image panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "relative",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-surface)",
            aspectRatio: "4/3",
          }}
        >
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Analysed leaf"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* Overlay label */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(to top, rgba(26,24,21,0.7) 0%, transparent 100%)",
              padding: "1.5rem 1rem 0.875rem",
            }}
          >
            <span
              className="t-label"
              style={{ color: "rgba(245, 242, 237, 0.7)" }}
            >
              SUBMITTED IMAGE
            </span>
          </div>
        </motion.div>

        {/* Result panel */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span className="t-label">DIAGNOSIS</span>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: "700",
                letterSpacing: "0.14em",
                color: "var(--color-brand)",
                opacity: 0.7,
              }}
            >
              LEAFORA CNN
            </span>
          </motion.div>

          {/* Primary result */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {/* Crop name — only shown when we have a separate crop label */}
            {primary.crop && (
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: "500",
                  letterSpacing: "0.02em",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {primary.crop}
              </p>
            )}

            <h2
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: "400",
                lineHeight: "1.15",
                color: primary.isHealthy
                  ? "var(--color-success)"
                  : "var(--color-text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {primary.isHealthy ? "Healthy" : (primary.condition || result.predicted_class)}
            </h2>

            {primary.isHealthy && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "var(--color-success-soft)",
                  border: "1px solid rgba(74, 124, 89, 0.2)",
                  borderRadius: "var(--radius-sm)",
                  width: "fit-content",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-success)",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "var(--color-success)",
                    letterSpacing: "0.05em",
                  }}
                >
                  NO DISEASE DETECTED
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Confidence */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
          >
            <ConfidenceDisplay value={result.confidence} />
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "1px",
              backgroundColor: "var(--color-border-subtle)",
              transformOrigin: "left",
            }}
          />

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52, duration: 0.3 }}
            >
              <p
                className="t-label"
                style={{ marginBottom: "1rem", color: "var(--color-text-muted)" }}
              >
                DIFFERENTIAL
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {alternatives.map((alt, i) => {
                  const parsed = parseClassName(alt.class);
                  const displayCondition =
                    parsed.isHealthy
                      ? "Healthy"
                      : parsed.condition || alt.class;
                  return (
                    <motion.div
                      key={alt.class}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.56 + i * 0.08,
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.625rem 0.875rem",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        {parsed.crop && (
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: "500",
                              color: "var(--color-text-muted)",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              marginBottom: "0.125rem",
                            }}
                          >
                            {parsed.crop}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {displayCondition}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: "600",
                          color: "var(--color-text-muted)",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                          marginLeft: "1rem",
                        }}
                      >
                        {formatConfidence(alt.confidence)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            style={{
              padding: "0.875rem 1rem",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                lineHeight: "1.6",
              }}
            >
              Confidence scores reflect model certainty on the training
              distribution, not a guarantee of diagnostic accuracy. Always
              consult an agronomist for crop management decisions.
            </p>
          </motion.div>

          {/* Reset action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 1.25rem",
                fontSize: "0.8125rem",
                fontWeight: "500",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "border-color 200ms, color 200ms",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-brand)";
                el.style.color = "var(--color-brand)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-border)";
                el.style.color = "var(--color-text-secondary)";
              }}
            >
              ← Analyse another image
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .result-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </motion.div>
  );
}
