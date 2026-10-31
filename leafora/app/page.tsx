"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import UploadWorkspace from "@/components/UploadWorkspace";
import ResultPanel from "@/components/ResultPanel";
import ErrorBanner from "@/components/ErrorBanner";
import { predict } from "@/lib/api";
import type { PredictResponse, ApiError } from "@/lib/api";

type AppState = "idle" | "ready" | "analyzing" | "result";

export default function AnalyzePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setAppState("ready");
    setError(null);
    setResult(null);
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setAppState("idle");
  }, [previewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setAppState("analyzing");
    setError(null);

    try {
      const res = await predict(selectedFile);
      setResult(res);
      setAppState("result");
    } catch (err: unknown) {
      setError(err as ApiError);
      setAppState("ready");
    }
  }, [selectedFile]);

  return (
    <PageShell>
      <div
        className="container-main"
        style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "4rem" }}
      >
        <AnimatePresence mode="wait">
          {appState === "result" && result ? (
            /* ── Result state ── */
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Error above result (shouldn't normally happen but defensive) */}
              {error && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <ErrorBanner error={error} onDismiss={() => setError(null)} />
                </div>
              )}
              <ResultPanel
                result={result}
                previewUrl={previewUrl}
                onReset={handleReset}
              />
            </motion.div>
          ) : (
            /* ── Upload / hero state ── */
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero */}
              <div style={{ marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.3rem 0.75rem 0.3rem 0.45rem",
                      border: "1px solid rgba(27, 77, 53, 0.25)",
                      borderRadius: "999px",
                      backgroundColor: "var(--color-brand-soft)",
                      width: "fit-content",
                    }}
                  >
                    <Image
                      src="/leafora-leaf.png"
                      alt="LEAFORA"
                      width={28}
                      height={28}
                      priority
                      style={{ height: "22px", width: "auto" }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.9375rem",
                        fontWeight: "700",
                        letterSpacing: "0.18em",
                        color: "var(--color-brand)",
                        lineHeight: 1,
                      }}
                    >
                      LEAFORA
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--color-brand-mid)",
                      paddingLeft: "0.25rem",
                    }}
                  >
                    Precision Leaf Analysis
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="t-display"
                  style={{ marginBottom: "1.25rem", maxWidth: "640px" }}
                >
                  See what<br />the leaf is telling you.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.4 }}
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-secondary)",
                    maxWidth: "480px",
                    lineHeight: "1.7",
                  }}
                >
                  Submit a leaf image. Receive a structured diagnosis across 211
                  crop-disease categories, powered by the LEAFORA custom CNN.
                </motion.p>
              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginBottom: "1.5rem" }}
                >
                  <ErrorBanner error={error} onDismiss={() => setError(null)} />
                </motion.div>
              )}

              {/* Upload workspace */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxWidth: "680px" }}
              >
                <UploadWorkspace
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onReset={handleReset}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={appState === "analyzing"}
                />
              </motion.div>

              {/* Metadata footer row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{
                  marginTop: "2.5rem",
                  display: "flex",
                  gap: "2rem",
                  flexWrap: "wrap",
                  maxWidth: "680px",
                }}
              >
                {[
                  { label: "CLASSES", value: "211" },
                  { label: "TEST SAMPLES", value: "19,946" },
                  { label: "FORMAT", value: "JPG / PNG" },
                  { label: "LIMIT", value: "10 MB" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="t-label" style={{ marginBottom: "0.25rem" }}>
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-secondary)",
                        fontWeight: "500",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
