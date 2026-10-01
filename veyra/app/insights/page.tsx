import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "What VEYRA analyses — supported crops, classification methodology, image quality guidance, and model limitations.",
};

const CROPS_AND_CONDITIONS = [
  { crop: "Apple", conditions: ["Apple Scab", "Black Rot", "Cedar Apple Rust", "Healthy"] },
  { crop: "Blueberry", conditions: ["Healthy"] },
  { crop: "Cherry", conditions: ["Powdery Mildew", "Healthy"] },
  { crop: "Corn (Maize)", conditions: ["Cercospora Leaf Spot / Gray Leaf Spot", "Common Rust", "Northern Leaf Blight", "Healthy"] },
  { crop: "Grape", conditions: ["Black Rot", "Esca (Black Measles)", "Leaf Blight (Isariopsis)", "Healthy"] },
  { crop: "Orange", conditions: ["Huanglongbing (Citrus Greening)"] },
  { crop: "Peach", conditions: ["Bacterial Spot", "Healthy"] },
  { crop: "Pepper (Bell)", conditions: ["Bacterial Spot", "Healthy"] },
  { crop: "Potato", conditions: ["Early Blight", "Late Blight", "Healthy"] },
  { crop: "Raspberry", conditions: ["Healthy"] },
  { crop: "Soybean", conditions: ["Healthy"] },
  { crop: "Squash", conditions: ["Powdery Mildew"] },
  { crop: "Strawberry", conditions: ["Leaf Scorch", "Healthy"] },
  { crop: "Tomato", conditions: ["Bacterial Spot", "Early Blight", "Late Blight", "Leaf Mold", "Septoria Leaf Spot", "Spider Mites", "Target Spot", "Yellow Leaf Curl Virus", "Mosaic Virus", "Healthy"] },
];

export default function InsightsPage() {
  return (
    <PageShell>
      <div
        className="container-narrow"
        style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "6rem" }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <p className="t-label" style={{ marginBottom: "1rem" }}>
            INSIGHTS
          </p>
          <h1
            className="t-heading-xl"
            style={{ marginBottom: "1.25rem", maxWidth: "560px" }}
          >
            How VEYRA reads a leaf.
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--color-text-secondary)",
              maxWidth: "520px",
              lineHeight: "1.75",
            }}
          >
            A practical account of what the analysis does, what it sees, and
            where its limits lie.
          </p>
        </div>

        {/* Divider */}
        <hr style={{ border: "none", borderTop: "1px solid var(--color-border-subtle)", marginBottom: "clamp(2.5rem, 5vw, 4rem)" }} />

        {/* Section 1 */}
        <Section title="What the analysis examines">
          <p className="t-body">
            VEYRA passes each image through a convolutional neural network trained
            end-to-end on labelled leaf photographs. The network learns to
            distinguish visual patterns — colour distribution, texture, lesion
            morphology, margin characteristics — that correlate with specific
            disease states or healthy tissue.
          </p>
          <p className="t-body" style={{ marginTop: "1rem" }}>
            The model operates on a single image at 128×128 pixels and produces a
            probability distribution across 38 classes. The highest-probability
            class becomes the primary diagnosis; the next two form the
            differential.
          </p>
        </Section>

        {/* Section 2 — crop table */}
        <Section title="Supported crops and conditions — Model 01">
          <p className="t-body" style={{ marginBottom: "1.75rem" }}>
            The current model covers 14 crops and 38 disease or healthy-state
            categories, drawn from the publicly available PlantVillage dataset.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1px",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              backgroundColor: "var(--color-border-subtle)",
            }}
          >
            {CROPS_AND_CONDITIONS.map((item) => (
              <div
                key={item.crop}
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "1.25rem 1.25rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                    marginBottom: "0.625rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.crop}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {item.conditions.map((c) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          backgroundColor:
                            c === "Healthy"
                              ? "var(--color-success)"
                              : "var(--color-accent)",
                          flexShrink: 0,
                          display: "block",
                        }}
                      />
                      <p className="t-body-sm" style={{ color: c === "Healthy" ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                        {c}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 3 */}
        <Section title="How image classification works">
          <p className="t-body">
            The network architecture is a custom CNN — several convolutional
            blocks with ReLU activations and max-pooling, followed by a fully
            connected classifier. This is a deliberate first model: compact
            enough to run on a single CPU instance, interpretable enough to
            iterate on quickly.
          </p>
          <p className="t-body" style={{ marginTop: "1rem" }}>
            During training, the network adjusts millions of parameters until it
            can map pixel intensities to disease labels with acceptable accuracy
            on held-out images. At inference time, it applies a softmax function
            to convert raw scores to probabilities that sum to 1.
          </p>
        </Section>

        {/* Section 4 */}
        <Section title="Why image quality matters">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                point: "Sharp focus",
                detail: "Lesion texture is a primary discriminative signal. Blurry images obscure this detail.",
              },
              {
                point: "Neutral background",
                detail: "The model was trained on leaf-isolated images. Cluttered backgrounds may confuse classification.",
              },
              {
                point: "Good lighting",
                detail: "Colour is a meaningful feature. Overexposed or underlit images shift colour distributions artificially.",
              },
              {
                point: "Single leaf",
                detail: "Multiple overlapping leaves introduce ambiguity. Isolate the affected leaf where possible.",
              },
            ].map((item) => (
              <div
                key={item.point}
                style={{
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                    marginBottom: "0.375rem",
                  }}
                >
                  {item.point}
                </p>
                <p className="t-body-sm">{item.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 5 — Limitations */}
        <Section title="Model limitations">
          <div
            style={{
              padding: "1.25rem 1.5rem",
              backgroundColor: "var(--color-accent-soft)",
              border: "1px solid rgba(155, 106, 63, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "var(--color-accent)",
                marginBottom: "0.5rem",
                letterSpacing: "0.04em",
              }}
            >
              FOR RESEARCH AND EXPLORATION ONLY
            </p>
            <p className="t-body-sm">
              VEYRA Model 01 is a research prototype. Outputs should not be
              used as the sole basis for crop management decisions.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              "Trained on laboratory-controlled images; field photographs may differ significantly.",
              "Does not account for disease severity, co-infections, or crop variety differences.",
              "Confidence scores reflect model certainty, not clinical diagnostic certainty.",
              "Classes outside the 38 training categories will receive an incorrect classification.",
              "Geographic and seasonal variation in disease appearance is not modelled.",
            ].map((point, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: "0.35rem",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-text-muted)",
                    display: "block",
                  }}
                />
                <p className="t-body-sm">{point}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "clamp(3rem, 6vw, 4.5rem)" }}>
      <h2
        className="t-heading-md"
        style={{
          marginBottom: "1.5rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid var(--color-border-subtle)",
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
