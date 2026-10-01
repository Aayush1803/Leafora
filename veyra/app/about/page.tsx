import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "VEYRA — crop image analysis beginning with a 38-class PlantVillage model. Project purpose, scope, and future direction.",
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
          <h1
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: "400",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "var(--color-text-primary)",
              marginBottom: "2rem",
            }}
          >
            VEYRA
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
            Crop image analysis, beginning with a 38-class PlantVillage model.
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
            VEYRA is a precision crop-disease analysis interface. Its immediate
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
              { label: "MODEL", value: "Model 01" },
              { label: "ARCHITECTURE", value: "Custom CNN" },
              { label: "CLASSES", value: "38" },
              { label: "DATASET", value: "PlantVillage" },
              { label: "CROPS", value: "14" },
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
            The model was trained on the PlantVillage dataset — a structured
            collection of leaf photographs acquired under controlled laboratory
            conditions. It classifies 38 distinct categories spanning diseased
            and healthy states across 14 crop species.
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
              { name: "PlantVillage", role: "Training dataset" },
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
            Model 01 is intentionally minimal — a working baseline. Future
            iterations will explore:
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
              "A unified model trained across a significantly expanded class set",
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
