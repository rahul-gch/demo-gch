export interface ConfidenceBand {
  min: number;
  max: number;
  label: string;
  meaning: string;
  action: string;
  tone: "verified" | "documented" | "declared" | "estimated" | "insufficient";
}

export const CONFIDENCE_BANDS: ConfidenceBand[] = [
  {
    min: 90,
    max: 100,
    label: "Verified high confidence",
    meaning: "Third-party or official source with clear KPI value and boundary.",
    action: "Use in benchmark; show source; no warning.",
    tone: "verified",
  },
  {
    min: 70,
    max: 89,
    label: "Documented medium-high",
    meaning:
      "Official company report or reputable secondary source with quantifiable value but not product-level evidence.",
    action: "Use in benchmark; request deeper evidence if product/facility view needed.",
    tone: "documented",
  },
  {
    min: 50,
    max: 69,
    label: "Declared medium",
    meaning:
      "Supplier/company declaration or qualitative target without enough quantified evidence.",
    action: "Use as directional; show confidence warning.",
    tone: "declared",
  },
  {
    min: 30,
    max: 49,
    label: "Estimated low",
    meaning: "Calculated with proxy factors or partial inputs.",
    action: "Use for scenario/demo; label estimated.",
    tone: "estimated",
  },
  {
    min: 0,
    max: 29,
    label: "Insufficient",
    meaning: "Data missing or impossible to normalize reliably.",
    action: "Do not benchmark except as missing-data signal.",
    tone: "insufficient",
  },
];

export function getConfidenceBand(score: number): ConfidenceBand {
  return (
    CONFIDENCE_BANDS.find((b) => score >= b.min && score <= b.max) ??
    CONFIDENCE_BANDS[CONFIDENCE_BANDS.length - 1]
  );
}

export function confidenceClasses(tone: ConfidenceBand["tone"]): string {
  switch (tone) {
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "documented":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "declared":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "estimated":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "insufficient":
      return "border-red-200 bg-red-50 text-red-700";
  }
}
