import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "How VEYRA classifies leaf images — methodology, evaluation metrics, image guidance, and model limitations.",
};

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
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--color-border-subtle)",
            marginBottom: "clamp(2.5rem, 5vw, 4rem)",
          }}
        />

        {/* Section 1 — How it works */}
        <Section title="What the analysis examines">
          <p className="t-body">
            VEYRA passes each image through a convolutional neural network
            trained end-to-end on labelled leaf photographs. The network learns
            to distinguish visual patterns — colour distribution, texture,
            lesion morphology, margin characteristics — that correlate with
            specific disease states or healthy tissue.
          </p>
          <p className="t-body" style={{ marginTop: "1rem" }}>
            The model operates on a single image resized to 128×128 pixels and
            produces a probability distribution across 211 classes. The
            highest-probability class becomes the primary diagnosis; the next
            two form the differential.
          </p>
        </Section>

        {/* Section 2 — Scope */}
        <Section title="Supported crops and conditions">
          <p className="t-body" style={{ marginBottom: "1rem" }}>
            The model covers 211 disease and healthy-state categories drawn
            from multiple agricultural image datasets. Crops represented
            include Apple, Banana, Basil, Bean, Cherry, Corn, Grape, Orange,
            Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry,
            Tomato, Wheat, and Zucchini, among others.
          </p>
          <p className="t-body">
            Because the class set spans 211 categories from multiple sources,
            per-class accuracy varies. High-support crops such as Tomato and
            Apple perform strongest. Low-support or visually ambiguous classes
            may yield lower confidence predictions.
          </p>
        </Section>

        {/* Section 3 — Evaluation metrics */}
        <Section title="Evaluation results">
          <p className="t-body" style={{ marginBottom: "1.75rem" }}>
            The model was evaluated on a held-out test set of{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              19,946 images
            </strong>{" "}
            not seen during training. The results below are offline metrics
            only — they do not guarantee equivalent accuracy on all real-world
            inputs.
          </p>

          {/* Metric grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1px",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              backgroundColor: "var(--color-border-subtle)",
              marginBottom: "1.75rem",
            }}
          >
            {[
              {
                label: "TEST ACCURACY",
                value: "87.95%",
                note: "Correct predictions on held-out set",
              },
              {
                label: "WEIGHTED F1",
                value: "88.47%",
                note: "F1 weighted by class support",
              },
              {
                label: "MACRO F1",
                value: "44.00%",
                note: "Unweighted average across all classes",
              },
              {
                label: "TEST SAMPLES",
                value: "19,946",
                note: "Images in held-out evaluation set",
              },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "1.25rem",
                }}
              >
                <p className="t-label" style={{ marginBottom: "0.5rem" }}>
                  {m.label}
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    marginBottom: "0.25rem",
                  }}
                >
                  {m.value}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    lineHeight: "1.4",
                  }}
                >
                  {m.note}
                </p>
              </div>
            ))}
          </div>

          {/* Metric explanation */}
          <div
            style={{
              padding: "1.125rem 1.25rem",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="t-label" style={{ marginBottom: "0.625rem" }}>
              UNDERSTANDING THE GAP
            </p>
            <p className="t-body-sm">
              The 44-point gap between macro F1 (44%) and weighted F1 (88%)
              reflects class imbalance. Classes with many training examples
              perform strongly; classes with few examples perform weaker. The
              weighted metric is skewed by high-support classes. Both numbers
              are reported honestly here.
            </p>
          </div>
        </Section>

        {/* Section 4 — Architecture */}
        <Section title="How image classification works">
          <p className="t-body">
            The network architecture is a custom CNN — four convolutional
            blocks with batch normalisation, ReLU activations and max-pooling,
            followed by an adaptive average pool and a two-layer classifier
            with dropout. This is a deliberately compact design: small enough
            to run on a CPU inference instance, structurally simple enough to
            iterate on quickly.
          </p>
          <p className="t-body" style={{ marginTop: "1rem" }}>
            During training, the network adjusts parameters until it can map
            pixel intensities to disease labels with acceptable accuracy on
            held-out images. At inference time, a softmax function converts raw
            scores to probabilities that sum to 1. The top three classes by
            probability are returned.
          </p>
        </Section>

        {/* Section 5 — Image quality */}
        <Section title="Why image quality matters">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                point: "Sharp focus",
                detail:
                  "Lesion texture is a primary discriminative signal. Blurry images obscure this detail.",
              },
              {
                point: "Neutral background",
                detail:
                  "The model was trained on leaf-isolated images. Cluttered backgrounds may confuse classification.",
              },
              {
                point: "Good lighting",
                detail:
                  "Colour is a meaningful feature. Overexposed or underlit images shift colour distributions artificially.",
              },
              {
                point: "Single leaf",
                detail:
                  "Multiple overlapping leaves introduce ambiguity. Isolate the affected leaf where possible.",
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

        {/* Section 6 — Limitations */}
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
              VEYRA is a research prototype. Outputs should not be used as the
              sole basis for crop management decisions.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              "Trained primarily on laboratory-controlled images; field photographs may differ significantly.",
              "Does not account for disease severity, co-infections, or crop variety differences.",
              "Confidence scores reflect model certainty on the training distribution, not clinical diagnostic certainty.",
              "Classes outside the 211 training categories will receive an incorrect classification.",
              "Geographic and seasonal variation in disease appearance is not modelled.",
              "The four recorded fine-tuning epochs do not represent the complete training history.",
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
