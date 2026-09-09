export interface ParsedDescription {
  prose: string[];
  specs: { label: string; value: string }[];
}

/**
 * Known spec labels (upper-cased). A line is treated as a spec row when it starts with
 * one of these, optionally followed by a qualifier (e.g. "WEIGHT B.W. (OZ/YD²)").
 */
const SPEC_LABELS = [
  "CODE",
  "ARTICLE",
  "ART",
  "REF",
  "COLOR",
  "COLOUR",
  "WEIGHT",
  "WIDTH",
  "WEAVE",
  "CONSTRUCTION",
  "ELASTICITY",
  "STRETCH",
  "SHRINKAGE",
  "COMPOSITION",
  "CONTENT",
  "FINISH",
  "GSM",
  "MOQ",
  "LEAD TIME",
  "ORIGIN",
  "CERTIFICATION",
  "CERTIFICATIONS",
  "PRICE",
  "YARN",
  "COUNT",
  "DENSITY",
  "THREAD",
  "PATTERN",
  "DYE",
  "DYEING",
  "WASH",
];

const LABEL_RE = new RegExp(`^(${SPEC_LABELS.join("|")})\\b`, "i");

function splitSpecLine(line: string): { label: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // "Label: value" form (short label, explicit colon).
  const sep = trimmed.match(/^([^:]{2,40}):\s+(.+)$/);
  if (sep && sep[1].trim().split(/\s+/).length <= 5) {
    return { label: sep[1].trim(), value: sep[2].trim() };
  }

  if (!LABEL_RE.test(trimmed)) return null;

  const VALUE_SENTINELS = /^(N\/?A|NONE|NIL|TBD|NA|-)$/i;

  // Label = leading run of all-caps tokens without digits (e.g. "WEIGHT B.W. (OZ/YD²)", "SHRINKAGE WEFT%"),
  // value = everything after. Handles "ELASTICITY% 42", "COMPOSITION 97CO + 3EA", "WIDTH 150 CM / 59"".
  const tokens = trimmed.split(/\s+/);
  const labelTokens: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    // Sentinel values like N/A or NONE should never be treated as part of the spec label
    if (i > 0 && VALUE_SENTINELS.test(t)) break;
    const isLabelToken = /^[A-Z][A-Z.%²\/()-]*$/.test(t) || /^\([A-Z\/²%]+\)$/.test(t);
    if (!isLabelToken) break;
    labelTokens.push(t);
    i += 1;
  }
  if (labelTokens.length === 0) return null;

  // If all tokens were consumed as uppercase words (e.g. "ORIGIN TURKEY", "DYE INDIGO", "FINISH REGULAR"),
  // split between the matched spec keyword/qualifiers and the value instead of returning null.
  if (i >= tokens.length) {
    if (tokens.length < 2) return null;
    const match = trimmed.match(LABEL_RE);
    const specPrefixTokenCount = match ? match[1].trim().split(/\s+/).length : 1;
    let splitIdx = specPrefixTokenCount;
    while (
      splitIdx < tokens.length - 1 &&
      /^(B\.?W\.?|A\.?W\.?|WARP|WEFT|[%()²\/A-Z]+)$/i.test(tokens[splitIdx]) &&
      !VALUE_SENTINELS.test(tokens[splitIdx])
    ) {
      splitIdx += 1;
    }

    const label = tokens
      .slice(0, splitIdx)
      .join(" ")
      .replace(/%$/, " (%)")
      .replace(/\s+/g, " ")
      .trim();
    const value = tokens.slice(splitIdx).join(" ").trim();
    return value ? { label, value } : null;
  }

  const label = labelTokens
    .join(" ")
    .replace(/%$/, " (%)")
    .replace(/\s+/g, " ")
    .trim();
  return { label, value: tokens.slice(i).join(" ").trim() };
}

/** Split a free-text description into prose paragraphs and key/value spec rows. */
export function parseProductDescription(description: string | null | undefined): ParsedDescription {
  if (!description) return { prose: [], specs: [] };
  const lines = description.replace(/\r\n?/g, "\n").split("\n");

  const prose: string[] = [];
  const specs: { label: string; value: string }[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length) {
      prose.push(buffer.join(" ").trim());
      buffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const spec = splitSpecLine(line);
    if (spec) {
      flush();
      specs.push(spec);
    } else {
      buffer.push(line);
    }
  }
  flush();

  return { prose: prose.filter(Boolean), specs };
}
