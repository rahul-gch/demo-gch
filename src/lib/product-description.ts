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

  // "Label: value" or "Label - value" forms.
  const sep = trimmed.match(/^([^:–—-]{2,40})\s*[:–—-]\s+(.+)$/);
  if (sep && sep[1].trim().split(/\s+/).length <= 5) {
    return { label: sep[1].trim(), value: sep[2].trim() };
  }

  if (!LABEL_RE.test(trimmed)) return null;

  // Label = leading uppercase-ish tokens (letters, dots, parentheses, %, ², slashes),
  // value = rest. Handles "WEIGHT B.W. (OZ/YD²) 7,5", "ELASTICITY% 42", "COMPOSITION 97CO + 3EA".
  const m = trimmed.match(/^([A-Z][A-Z .%²\/()-]*?)\s+(.+)$/);
  if (m) {
    const label = m[1].replace(/\s*%\s*$/, " (%)").trim();
    return { label, value: m[2].trim() };
  }

  // "ELASTICITY%42" with no space.
  const m2 = trimmed.match(/^([A-Z][A-Z .\/()-]*?)%\s*(.+)$/);
  if (m2) return { label: `${m2[1].trim()} (%)`, value: m2[2].trim() };

  return null;
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
