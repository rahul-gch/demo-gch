import { createFileRoute, Link } from "@tanstack/react-router";
import { TERMS_VERSION } from "@/lib/policies";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Global Chain Hub" },
      {
        name: "description",
        content:
          "Terms & Conditions governing the use of the Global Chain Hub supply-chain platform.",
      },
      { property: "og:title", content: "Terms & Conditions — Global Chain Hub" },
      {
        property: "og:description",
        content: "Terms governing use of the Global Chain Hub platform.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-xs text-muted-foreground hover:underline">
        ← Back to Global Chain Hub
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Version {TERMS_VERSION}</p>

      <div className="prose prose-slate mt-8 max-w-none text-sm leading-relaxed">
        <Section title="1. Agreement">
          These Terms govern access to and use of the Global Chain Hub platform ("the Platform") by
          you and the organization you represent. By creating an account you confirm you are
          authorised to accept these Terms on behalf of that organization.
        </Section>
        <Section title="2. Accounts and security">
          You are responsible for keeping your credentials confidential and for all activity under
          your account. Accounts are personal and must not be shared. You must notify us promptly of
          any suspected unauthorised access.
        </Section>
        <Section title="3. Organization data">
          Your organization retains ownership of the supply-chain data it uploads (products,
          materials, capacity, MOQ, lead times, certifications, documents). You grant the Platform a
          limited licence to process that data to provide the service — directory listing, matching,
          messaging and analytics you have enabled.
        </Section>
        <Section title="4. Public and private information">
          A limited set of organization profile fields is visible to other verified members of the
          network. Commercially sensitive information (documents, internal scores, KPIs, private
          notes) is restricted to your own organization and the partners you explicitly share it
          with.
        </Section>
        <Section title="5. Acceptable use">
          You must not attempt to access data belonging to other organizations, probe or bypass
          access controls, upload malicious files, scrape the directory, or use the Platform to send
          unsolicited commercial messages.
        </Section>
        <Section title="6. Availability and changes">
          The Platform is provided on an "as is" basis while in active development. We may update
          these Terms; material changes require renewed acceptance and are recorded with a version
          and timestamp.
        </Section>
        <Section title="7. Termination">
          You may request deletion of your account at any time from Privacy &amp; security in the
          app. We may suspend accounts that breach these Terms.
        </Section>
        <Section title="8. Contact">
          Questions about these Terms:{" "}
          <a href="mailto:legal@globalchainhub.io">legal@globalchainhub.io</a>.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </section>
  );
}
