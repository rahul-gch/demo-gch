import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  getProfileDef,
  isAnswered,
  type Bucket,
  type ProfileAnswers,
  type ProfileField,
} from "./entity-profiles";

export interface ProfileCoreFields {
  name?: string;
  description?: string;
  website?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
}

export interface BucketScore {
  bucket: Bucket;
  label: string;
  weight: number;
  answered: number;
  total: number;
  percent: number;
  missing: { id: string; label: string }[];
}

export interface ProfileScoreResult {
  score: number;
  buckets: BucketScore[];
  answeredCount: number;
  totalCount: number;
  nextMissing: { id: string; label: string; bucket: Bucket }[];
}

const CORE_FIELDS: { id: keyof ProfileCoreFields; label: string }[] = [
  { id: "description", label: "Company description" },
  { id: "website", label: "Website" },
  { id: "city", label: "City / region" },
  { id: "country", label: "Country" },
  { id: "logoUrl", label: "Company logo" },
];

/**
 * Weighted 0-100 profile completeness. Weights are entity-type specific and
 * normalized, so every organization is scored on the same 0-100 scale even
 * though a Farmer and a Brand answer very different questions.
 */
export function computeProfileScore(
  entityType: string | undefined | null,
  answers: ProfileAnswers | undefined | null,
  core: ProfileCoreFields = {},
): ProfileScoreResult {
  const def = getProfileDef(entityType);
  const a = answers ?? {};

  const byBucket = new Map<Bucket, ProfileField[]>();
  for (const field of def.fields) {
    const arr = byBucket.get(field.bucket) ?? [];
    arr.push(field);
    byBucket.set(field.bucket, arr);
  }

  const weights: Partial<Record<Bucket, number>> = { basic: def.weights.basic ?? 15, ...def.weights };

  const buckets: BucketScore[] = [];
  for (const bucket of BUCKET_ORDER) {
    const fields = byBucket.get(bucket) ?? [];
    const missing: { id: string; label: string }[] = [];
    let answered = 0;
    let total = 0;

    if (bucket === "basic") {
      for (const c of CORE_FIELDS) {
        total += 1;
        if (isAnswered(core[c.id])) answered += 1;
        else missing.push({ id: c.id, label: c.label });
      }
    }

    for (const f of fields) {
      total += 1;
      if (isAnswered(a[f.id])) answered += 1;
      else missing.push({ id: f.id, label: f.label });
    }

    if (total === 0) continue;
    const weight = weights[bucket] ?? 0;
    if (weight === 0) continue;
    buckets.push({
      bucket,
      label: BUCKET_LABELS[bucket],
      weight,
      answered,
      total,
      percent: Math.round((answered / total) * 100),
      missing,
    });
  }

  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0) || 1;
  const score = Math.round(
    buckets.reduce((s, b) => s + b.weight * (b.answered / b.total), 0) * (100 / totalWeight),
  );

  const answeredCount = buckets.reduce((s, b) => s + b.answered, 0);
  const totalCount = buckets.reduce((s, b) => s + b.total, 0);

  const nextMissing = buckets
    .slice()
    .sort((x, y) => y.weight - x.weight)
    .flatMap((b) => b.missing.map((m) => ({ ...m, bucket: b.bucket })))
    .slice(0, 6);

  return { score: Math.max(0, Math.min(100, score)), buckets, answeredCount, totalCount, nextMissing };
}
