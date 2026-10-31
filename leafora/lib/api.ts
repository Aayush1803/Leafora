/**
 * lib/api.ts — LEAFORA API boundary
 *
 * All backend communication is isolated here.
 * Swap the backend URL via NEXT_PUBLIC_API_URL without touching components.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://vriksh.onrender.com";

export interface Prediction {
  class: string;
  confidence: number;
}

export interface PredictResponse {
  predicted_class: string;
  confidence: number;
  top_predictions: Prediction[];
}

export interface ApiError {
  type: "validation" | "server" | "network" | "timeout" | "unavailable";
  message: string;
}

/**
 * Parse a class name returned by the LEAFORA backend into a human-readable label.
 *
 * Supports two formats:
 *  - PlantVillage triple-underscore: "Tomato___Late_blight"
 *  - LEAFORA 211-class snake_case:     "tomato_late_blight", "corn_maize_healthy"
 *
 * Returns { crop, condition, isHealthy }.
 */
export function parseClassName(raw: string): {
  crop: string;
  condition: string;
  isHealthy: boolean;
} {
  // ── PlantVillage format: "Tomato___Late_blight" ──
  if (raw.includes("___")) {
    const parts = raw.split("___");
    const crop = (parts[0] ?? raw)
      .replace(/_/g, " ")
      .replace(/\(.*?\)/g, "")
      .trim();
    const conditionRaw = parts[1] ?? "";
    const condition = conditionRaw
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const isHealthy = condition.toLowerCase() === "healthy";
    return { crop, condition, isHealthy };
  }

  // ── LEAFORA 211-class snake_case format: "tomato_late_blight" ──
  const words = raw.split("_");
  const isHealthy = words[words.length - 1]?.toLowerCase() === "healthy";

  const cropWord = words[0] ?? raw;
  const conditionWords = words.slice(1);

  // If the class is a single word (e.g. "basil"), show it as condition with no separate crop.
  if (conditionWords.length === 0) {
    const label = cropWord.charAt(0).toUpperCase() + cropWord.slice(1);
    return { crop: "", condition: label, isHealthy: false };
  }

  const crop = cropWord.charAt(0).toUpperCase() + cropWord.slice(1);

  const condition = isHealthy
    ? "Healthy"
    : conditionWords
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

  return { crop, condition, isHealthy };
}

/** Format confidence as a percentage string */
export function formatConfidence(value: number): string {
  return (value * 100).toFixed(2) + "%";
}

/** POST /predict — send image file, receive diagnosis */
export async function predict(file: File): Promise<PredictResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      const apiErr: ApiError = {
        type: "timeout",
        message:
          "The analysis took too long. The model may be cold-starting — try again in a moment.",
      };
      throw apiErr;
    }
    const apiErr: ApiError = {
      type: "network",
      message:
        "Could not reach the analysis service. Check your connection and try again.",
    };
    throw apiErr;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 503) {
    const apiErr: ApiError = {
      type: "unavailable",
      message:
        "The analysis engine is starting up. This may take up to 30 seconds on first use.",
    };
    throw apiErr;
  }

  if (res.status === 422) {
    let detail = "The image could not be processed.";
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    const apiErr: ApiError = { type: "validation", message: detail };
    throw apiErr;
  }

  if (!res.ok) {
    const apiErr: ApiError = {
      type: "server",
      message: `Server error (${res.status}). Please try again.`,
    };
    throw apiErr;
  }

  return res.json() as Promise<PredictResponse>;
}

/** GET /health — check if backend is alive */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
