// Server-only helpers for the messaging module. Never imported by client code.

export const STARTER_THREADS: { subject: string; lines: string[] }[] = [
  {
    subject: "capacity",
    lines: [
      "Thanks for connecting on the platform. We have open capacity for the next quarter and would be glad to share our current certifications.",
      "Happy to walk you through our lead times whenever it suits your team.",
    ],
  },
  {
    subject: "certification",
    lines: [
      "Our GOTS scope certificate was renewed last month — I can upload the latest copy to the shared documents here.",
      "Let me know if you need the transaction certificates for the last shipment as well.",
    ],
  },
  {
    subject: "sampling",
    lines: [
      "We received your sampling brief. Our development team can turn the first proto around in about three weeks.",
      "Could you confirm the target fabric weight so we can quote accurately?",
    ],
  },
  {
    subject: "audit",
    lines: [
      "Our latest social audit closed with no critical findings. Corrective actions from the previous cycle are all verified.",
      "Do you want the full report or just the summary scorecard?",
    ],
  },
  {
    subject: "intro",
    lines: [
      "Great to be matched with you. We work with several brands in your category and would love to explore a pilot order.",
      "I'm available for a short intro call this week or next.",
    ],
  },
];

export function starterAuthor(orgName: string): { name: string; role: string } {
  const roles = [
    "Sustainability Lead",
    "Commercial Director",
    "Compliance Manager",
    "Head of Partnerships",
    "Production Manager",
  ];
  let h = 0;
  for (const ch of orgName) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { name: `${orgName} team`, role: roles[h % roles.length] };
}

export function daysAgoIso(days: number, hourOffset = 0): string {
  return new Date(Date.now() - days * 86400000 - hourOffset * 3600000).toISOString();
}
