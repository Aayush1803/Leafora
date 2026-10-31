import type { Metadata } from "next";
import Image from "next/image";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "LEAFORA — crop image analysis powered by a 211-class custom CNN. Project purpose, architecture, training data, and future direction.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <div
        className="container-narrow"
        style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "6rem" }}
      >
        {/* Wordmark section */}
        <div style={{ marginBottom: "clamp(3.5rem, 7vw, 6rem)" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Image
              src="/leafora-leaf.png"
              alt="LEAFORA"
              width={72}
              height={72}
              priority
              style={{
                height: "56px",
                width: "auto",
                display: "block",
              }}
            />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: "400",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "var(--color-brand)",
              marginBottom: "2rem",
            }}
          >
            LEAFORA
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "var(--color-text-secondary)",
              maxWidth: "520px",
              lineHeight: "1.7",
              fontWeight: "400",
            }}
          >
            Crop image analysis powered by a 211-class custom CNN.
          </p>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--color-border-subtle)",
            marginBottom: "clamp(2.5rem, 5vw, 4rem)",
          }}
        />

        {/* Purpose */}
        <AboutSection label="PURPOSE">
          <p className="t-body">
            LEAFORA is a precision crop-disease analysis interface. Its immediate
            purpose is to make a trained image-classification model approachable:
            submit a photograph of a plant leaf, receive a structured diagnosis.
          </p>
          <p className="t-body" style={{ marginTop: "1rem" }}>
            The longer purpose is to establish the foundation of a more capable
            platform — one that will grow with better models, additional datasets,
            and richer analytical output.
          </p>
        </AboutSection>

        {/* Current scope */}
        <AboutSection label="CURRENT SCOPE">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1px",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              backgroundColor: "var(--color-border-subtle)",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { label: "ARCHITECTURE", value: "Custom CNN" },
              { label: "CLASSES", value: "211" },
              { label: "DATASET", value: "Multiple sources" },
              { label: "INPUT", value: "128 × 128 px" },
              { label: "TEST ACCURACY", value: "87.95%" },
              { label: "INFERENCE", value: "CPU" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "1.25rem",
                }}
              >
                <p className="t-label" style={{ marginBottom: "0.375rem" }}>
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <p className="t-body">
            The model was trained on a combined dataset drawn from multiple
            agricultural image sources. It classifies 211 distinct categories
            spanning diseased and healthy states across multiple crop species.
            Offline test accuracy: ~87.95% on 19,946 held-out samples
            (weighted F1: ~88.47%; macro F1: ~44.00%).
          </p>
        </AboutSection>

        {/* Technology */}
        <AboutSection label="TECHNOLOGY">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { name: "PyTorch", role: "Model training and inference" },
              { name: "FastAPI", role: "Inference API (deployed on Render)" },
              { name: "Next.js", role: "Frontend application" },
              { name: "Framer Motion", role: "Interface animation" },
              { name: "Tailwind CSS", role: "Styling foundation" },
              { name: "Multiple datasets", role: "Training data (Agri Foundation + others)" },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {item.name}
                </span>
                <span className="t-body-sm">{item.role}</span>
              </div>
            ))}
          </div>
        </AboutSection>

        {/* Future */}
        <AboutSection label="FUTURE DIRECTION">
          <p className="t-body">
            The current model establishes a working baseline for crop disease
            classification. Future iterations may explore:
          </p>
          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {[
              "Expand to field-condition images beyond controlled laboratory settings",
              "Explainability overlays — visualising which regions of the image influenced the diagnosis",
              "Severity estimation alongside classification",
              "Field-condition robustness through augmented training",
              "Multi-image submission for longitudinal tracking",
              "API access for integration with external systems",
            ].map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: "0.55rem",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent)",
                    display: "block",
                  }}
                />
                <p className="t-body-sm">{item}</p>
              </div>
            ))}
          </div>
        </AboutSection>
      </div>
    </PageShell>
  );
}

function AboutSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <span className="t-label">{label}</span>
        <div
          style={{
            flex: 1,
            height: "1px",
            backgroundColor: "var(--color-border-subtle)",
          }}
        />
      </div>
      {children}
    </section>
  );
}
