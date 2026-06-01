import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { EcosystemGraph } from "@/components/EcosystemGraph";
import { EcosystemMap } from "@/components/EcosystemMap";
import { ORGS } from "@/lib/ecosystem-data";
import {
  FACTOR_META,
  MATCH_DEFAULTS,
  scorePair,
  type MatchFactor,
} from "@/lib/matchmaking";
import {
  ArrowLeft,
  Network,
  Sliders,
  MessageSquare,
  Map as MapIcon,
  Users,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How GCH Works — Prototype Walkthrough" },
      {
        name: "description",
        content:
          "Walkthrough of the GCH prototype: personas, ecosystem graph, matchmaking algorithm, messaging, and the geographic map view.",
      },
      { property: "og:title", content: "How GCH Works — Prototype Walkthrough" },
      {
        property: "og:description",
        content:
          "Personas, matchmaking factors, messaging and the world map for the supply-chain ecosystem prototype.",
      },
    ],
  }),
  component: HowItWorks,
});

function Section({
  id,
  icon,
  title,
  kicker,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-10">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-border bg-muted p-2 text-foreground">
          {icon}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{kicker}</div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function HowItWorks() {
  // Worked example: Acme ↔ Northwind under default settings
  const example = useMemo(() => {
    const a = ORGS.find((o) => o.id === "acme")!;
    const b = ORGS.find((o) => o.id === "northwind")!;
    return { a, b, ...scorePair(a, b, MATCH_DEFAULTS) };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to workspace
          </Link>
          <nav className="hidden gap-4 text-xs text-muted-foreground md:flex">
            <a href="#overview" className="hover:text-foreground">Overview</a>
            <a href="#graph" className="hover:text-foreground">Graph</a>
            <a href="#matchmaking" className="hover:text-foreground">Matchmaking</a>
            <a href="#messaging" className="hover:text-foreground">Messaging</a>
            <a href="#map" className="hover:text-foreground">Map</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Prototype guide</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">How GCH works</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            GCH (Global Compliance Hub) is a demo workspace that shows how brands, suppliers,
            verifiers and regulators can collaborate around a shared, evidence-backed supply chain.
            This page walks through every moving part of the prototype so you can see what is real,
            what is seeded, and what we could extend.
          </p>
        </div>

        {/* Overview */}
        <Section
          id="overview"
          icon={<Users className="h-4 w-4" />}
          kicker="01 · Personas"
          title="Four roles, one workspace"
        >
          <p>
            The prototype ships with four sign-in personas. Each one has their own dashboard, but
            they all share the same underlying ecosystem data so what one user does is visible to
            the others.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { name: "Rahul", role: "Brand Lead", org: "Acme Apparel", tone: "bg-indigo-500", note: "Tracks suppliers, requests evidence, opens meetings." },
              { name: "George", role: "Supplier Ops", org: "Northwind Mills", tone: "bg-amber-500", note: "Uploads dye-lot and shipment evidence, accepts orders." },
              { name: "Maria", role: "Evidence Reviewer", org: "GCH Verification", tone: "bg-emerald-500", note: "Reviews submitted evidence and flags gaps." },
              { name: "Admin", role: "Platform Operator", org: "GCH", tone: "bg-rose-500", note: "Sees the whole ecosystem, tunes matchmaking, manages users." },
            ].map((p) => (
              <div key={p.name} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ${p.tone}`}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.role} · {p.org}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>
          <p className="text-xs">
            Switch personas from the login screen; the admin can also "Preview as" any user from
            the header.
          </p>
        </Section>

        {/* Graph */}
        <Section
          id="graph"
          icon={<Network className="h-4 w-4" />}
          kicker="02 · Ecosystem graph"
          title="What every dot and line means"
        >
          <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
            <div className="aspect-[16/9]">
              <EcosystemGraph coreOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <div className="mb-1 font-semibold text-foreground">Nodes</div>
              <ul className="space-y-1">
                <li><span className="font-medium text-amber-500">Amber</span> = brand · <span className="font-medium text-sky-400">Sky</span> = supplier · <span className="font-medium text-emerald-400">Green</span> = verifier · <span className="font-medium text-violet-400">Violet</span> = regulator.</li>
                <li>Size of the dot = company size band (S / M / L).</li>
                <li>Red halo around a dot = risk score above 0.6.</li>
                <li>Opacity = confidence in the underlying data.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <div className="mb-1 font-semibold text-foreground">Edges</div>
              <ul className="space-y-1">
                <li>Grey = supply relationship · Green = verification · Violet = regulator partnership.</li>
                <li>Thicker / brighter line = stronger relationship.</li>
                <li>Dashed line = relationship exists but no uploaded evidence yet.</li>
              </ul>
            </div>
          </div>
          <p className="text-xs">
            By default the admin dashboard shows a curated 6-node core view so labels stay
            readable; toggle "Full ecosystem" to see all {ORGS.length} organisations.
          </p>
        </Section>

        {/* Matchmaking */}
        <Section
          id="matchmaking"
          icon={<Sliders className="h-4 w-4" />}
          kicker="03 · Matchmaking"
          title="How partners get suggested to each other"
        >
          <p>
            Every potential pair of organisations is scored from 0–100 and then bucketed using
            thresholds. The whole algorithm lives in <code className="rounded bg-muted px-1 py-0.5 text-[11px]">src/lib/matchmaking.ts</code> and runs entirely in the browser — no model, no server call.
          </p>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-xs font-semibold text-foreground">Step 1 — Hard filters</div>
            <p className="text-xs">
              A candidate is discarded immediately if it fails any of these toggles (admin can
              change them in the Matchmaking tab):
            </p>
            <ul className="mt-2 grid grid-cols-1 gap-1 text-xs md:grid-cols-2">
              <li>• <span className="font-medium text-foreground">Same country only</span> — geo lock.</li>
              <li>• <span className="font-medium text-foreground">Same region only</span> — EU / Americas / APAC / MEA.</li>
              <li>• <span className="font-medium text-foreground">Min company size</span> — S / M / L floor.</li>
              <li>• <span className="font-medium text-foreground">Max risk</span> — drop anything above this.</li>
              <li>• <span className="font-medium text-foreground">Required certifications</span> — must hold all.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-xs font-semibold text-foreground">
              Step 2 — Eight weighted factors
            </div>
            <p className="text-xs">
              Each factor returns a 0–1 score; the admin slides a 0–100 weight per factor; the
              final score is the weighted average × 100. Risk is subtracted instead of added.
            </p>
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Factor</th>
                    <th className="px-2 py-1.5 text-left font-medium">What it measures</th>
                    <th className="px-2 py-1.5 text-right font-medium">Default weight</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(FACTOR_META) as MatchFactor[]).map((f) => (
                    <tr key={f} className="border-t border-border">
                      <td className="px-2 py-1.5 font-medium text-foreground">{FACTOR_META[f].label}</td>
                      <td className="px-2 py-1.5">{FACTOR_META[f].description}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                        {MATCH_DEFAULTS.weights[f]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-xs font-semibold text-foreground">Step 3 — Thresholds</div>
            <ul className="text-xs">
              <li>• Score ≥ <span className="font-medium text-emerald-500">{MATCH_DEFAULTS.thresholds.autoAccept}</span> → auto-suggest as a strong match.</li>
              <li>• Score ≥ <span className="font-medium text-amber-500">{MATCH_DEFAULTS.thresholds.reject}</span> → send for human review.</li>
              <li>• Below that → rejected, not surfaced to the user.</li>
            </ul>
          </div>

          {/* Worked example */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">
                Worked example · {example.a.name} ↔ {example.b.name}
              </div>
              <div className="text-sm font-semibold tabular-nums text-foreground">
                {example.score}/100
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs md:grid-cols-4">
              {(Object.keys(example.parts) as MatchFactor[]).map((k) => (
                <div key={k} className="flex items-center justify-between rounded border border-border bg-background px-2 py-1">
                  <span className="text-muted-foreground">{FACTOR_META[k].label}</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {(example.parts[k]! * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Parameters we could add next
            </div>
            <p className="text-xs">
              The current eight factors are a starting set. Realistic extensions would include:
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs md:grid-cols-3">
              {[
                "Lead time (days)",
                "MOQ / capacity fit",
                "Price band",
                "Payment terms",
                "Language overlap",
                "On-time delivery rate",
                "Defect rate / quality KPIs",
                "Carbon intensity",
                "Energy mix",
                "Water usage",
                "Sanctions / denied-party list",
                "Worker-grievance signals",
                "Insurance coverage",
                "IP & data-handling maturity",
                "Past dispute history",
              ].map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Messaging */}
        <Section
          id="messaging"
          icon={<MessageSquare className="h-4 w-4" />}
          kicker="04 · Messaging"
          title="In-app messages and meeting requests"
        >
          <p>
            Click <span className="font-medium text-foreground">Messages</span> in the header
            (any persona) to open a thread panel:
          </p>
          <ul className="text-xs">
            <li>• Left sidebar lists every other participant with unread badges.</li>
            <li>• Right side is a normal chat — type and send, the other persona sees it when they log in.</li>
            <li>• <span className="font-medium text-foreground">Request meeting</span> inserts a card with a proposed time, duration and agenda.</li>
            <li>• The recipient can <span className="text-emerald-500">accept</span>, <span className="text-rose-500">decline</span>, or <span className="text-amber-500">reschedule</span> with a new time.</li>
          </ul>
          <p className="text-xs">
            Data is stored in the browser under <code className="rounded bg-muted px-1 py-0.5 text-[11px]">gch_comms_v1</code>; opening another persona in another tab and refreshing will show the same threads.
          </p>
        </Section>

        {/* Map */}
        <Section
          id="map"
          icon={<MapIcon className="h-4 w-4" />}
          kicker="05 · Map view"
          title="Where every organisation actually sits"
        >
          <p>
            Same organisations as the graph, but pinned on a real world map. Click any pin to see
            the org's details and top three matches under the current matchmaking settings.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
            <div className="aspect-[16/9]">
              <EcosystemMap />
            </div>
          </div>
          <p className="text-xs">
            Coordinates are country centroids with a small per-org offset so co-located suppliers
            don't overlap. Powered by the Google Maps connector.
          </p>
        </Section>

        {/* Tech notes */}
        <Section
          id="tech"
          icon={<Layers className="h-4 w-4" />}
          kicker="06 · Tech notes"
          title="What's real, what's seeded"
        >
          <ul className="text-xs">
            <li>• All ecosystem and user data is seeded in <code className="rounded bg-muted px-1 py-0.5 text-[11px]">src/lib/ecosystem-data.ts</code>.</li>
            <li>• Matchmaking settings, messages and meetings persist in browser localStorage.</li>
            <li>• No backend is required for the demo; the only network dependency is the Google Maps script for the map view.</li>
            <li>• Built on TanStack Start (React 19) with Tailwind tokens.</li>
          </ul>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Nothing on this page calls a real production API or stores PII.</span>
          </div>
        </Section>
      </main>
    </div>
  );
}
