"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadWorkspaceProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onReset: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function UploadWorkspace({
  onFileSelect,
  selectedFile,
  previewUrl,
  onReset,
  onAnalyze,
  isAnalyzing,
  disabled = false,
}: UploadWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setFileError(null);
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError("Only JPG and PNG images are accepted.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError("File exceeds 10 MB limit.");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    e.target.value = "";
  };

  return (
    <div style={{ width: "100%" }}>
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          /* ── Empty state ── */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              animate={{
                borderColor: isDragging
                  ? "var(--color-accent)"
                  : "var(--color-border)",
                backgroundColor: isDragging
                  ? "var(--color-accent-soft)"
                  : "var(--color-surface)",
              }}
              transition={{ duration: 0.18 }}
              style={{
                position: "relative",
                width: "100%",
                minHeight: "clamp(280px, 40vw, 420px)",
                border: "1.5px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                padding: "3rem 2rem",
              }}
              role="button"
              tabIndex={0}
              aria-label="Click or drag a leaf image to upload"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
            >
              {/* Subtle background grid */}
              <GridPattern isDragging={isDragging} />

              {/* Upload icon */}
              <motion.div
                animate={{ scale: isDragging ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ position: "relative", zIndex: 1 }}
              >
                <UploadIcon isDragging={isDragging} />
              </motion.div>

              {/* Copy */}
              <div
                style={{
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: "500",
                    color: isDragging
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                    transition: "color 0.18s",
                    marginBottom: "0.35rem",
                  }}
                >
                  {isDragging ? "Release to load" : "Drop a leaf image"}
                </p>
                <p className="t-caption">
                  JPG, PNG · up to 10 MB
                </p>
              </div>

              {/* Browse button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                style={{
                  position: "relative",
                  zIndex: 1,
                  background: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8125rem",
                  fontWeight: "500",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  transition: "border-color 200ms, color 200ms",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor =
                    "var(--color-accent)";
                  (e.target as HTMLElement).style.color = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor =
                    "var(--color-border)";
                  (e.target as HTMLElement).style.color =
                    "var(--color-text-secondary)";
                }}
              >
                Browse files
              </motion.button>

              {/* Corner labels — mimicking a precision tool */}
              <CornerLabel position="top-left">LEAF ANALYSIS</CornerLabel>
              <CornerLabel position="bottom-right">JPG / PNG</CornerLabel>
            </motion.div>

            {/* File error */}
            <AnimatePresence>
              {fileError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    marginTop: "0.875rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--color-danger-soft)",
                    border: "1px solid rgba(139, 58, 58, 0.2)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                  }}
                  role="alert"
                >
                  <span style={{ fontSize: "0.875rem", color: "var(--color-danger)" }}>
                    ⚠
                  </span>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-danger)",
                      fontWeight: "500",
                    }}
                  >
                    {fileError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── File selected state ── */
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Image preview */}
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {/* Top metadata bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 1rem",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-success)",
                      display: "block",
                    }}
                  />
                  <span className="t-label">IMAGE LOADED</span>
                </div>
                <span className="t-caption">
                  {(selectedFile.size / 1024).toFixed(0)} KB ·{" "}
                  {selectedFile.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>

              {/* Image */}
              <motion.div
                initial={{ scale: 1.04, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "relative",
                  aspectRatio: "4/3",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Uploaded leaf for analysis"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {/* Analyzing overlay */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(245, 242, 237, 0.7)",
                        backdropFilter: "blur(2px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem",
                      }}
                    >
                      <AnalyzingIndicator />
                      <AnalyzingOverlayText />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Bottom action bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.875rem 1rem",
                  borderTop: "1px solid var(--color-border-subtle)",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={onReset}
                  disabled={isAnalyzing}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    color: "var(--color-text-muted)",
                    cursor: isAnalyzing ? "not-allowed" : "pointer",
                    letterSpacing: "0.01em",
                    borderRadius: "var(--radius-sm)",
                    transition: "color 200ms",
                    opacity: isAnalyzing ? 0.5 : 1,
                  }}
                >
                  ← Remove
                </button>

                <AnalyzeButton
                  onClick={onAnalyze}
                  disabled={isAnalyzing || disabled}
                  loading={isAnalyzing}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleInputChange}
        style={{ display: "none" }}
        aria-label="Upload leaf image"
        id="leaf-upload-input"
      />
    </div>
  );
}

/* ── Sub-components ── */

function GridPattern({ isDragging }: { isDragging: boolean }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: isDragging ? 0.3 : 0.15,
        transition: "opacity 0.25s",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="grid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function UploadIcon({ isDragging }: { isDragging: boolean }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      style={{ transition: "opacity 0.2s" }}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="32"
        height="24"
        rx="3"
        stroke={isDragging ? "var(--color-accent)" : "var(--color-border)"}
        strokeWidth="1.5"
        fill="none"
        style={{ transition: "stroke 0.2s" }}
      />
      <path
        d="M 20 24 L 20 14 M 20 14 L 15 19 M 20 14 L 25 19"
        stroke={isDragging ? "var(--color-accent)" : "var(--color-text-muted)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 0.2s" }}
      />
      <path
        d="M 13 31 L 27 31"
        stroke={isDragging ? "var(--color-accent)" : "var(--color-border)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transition: "stroke 0.2s" }}
      />
    </svg>
  );
}

function CornerLabel({
  position,
  children,
}: {
  position: "top-left" | "bottom-right";
  children: React.ReactNode;
}) {
  const pos =
    position === "top-left"
      ? { top: "0.875rem", left: "1rem" }
      : { bottom: "0.875rem", right: "1rem" };
  return (
    <span
      className="t-label"
      style={{
        position: "absolute",
        ...pos,
        color: "var(--color-text-muted)",
        opacity: 0.6,
        pointerEvents: "none",
      }}
    >
      {children}
    </span>
  );
}

function AnalyzingIndicator() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.97, 1.03, 0.97] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/leafora-logo.png"
          alt=""
          width={36}
          height={36}
          style={{ height: "32px", width: "auto" }}
        />
      </motion.div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
            style={{
              display: "block",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AnalyzingOverlayText() {
  const [status, setStatus] = useState("Starting analysis…");

  useEffect(() => {
    const timer1 = setTimeout(() => setStatus("Connecting to analysis engine…"), 2500);
    const timer2 = setTimeout(() => setStatus("Analysing image…"), 8000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <motion.p
      key={status}
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      style={{
        fontSize: "0.8125rem",
        fontWeight: "500",
        letterSpacing: "0.04em",
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
      }}
    >
      {status}
    </motion.p>
  );
}

function AnalyzeButton({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled
          ? "var(--color-border)"
          : "var(--color-text-primary)",
        color: disabled ? "var(--color-text-muted)" : "var(--color-background)",
        border: "none",
        borderRadius: "var(--radius-md)",
        padding: "0.625rem 1.5rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        letterSpacing: "0.04em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 250ms, color 250ms",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        minWidth: "120px",
        justifyContent: "center",
      }}
    >
      {loading ? "Analysing…" : "Analyse"}
      {!loading && (
        <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>→</span>
      )}
    </motion.button>
  );
}
