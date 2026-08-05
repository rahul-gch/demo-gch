import { createFileRoute, Link } from "@tanstack/react-router";
import { PRIVACY_VERSION } from "@/lib/policies";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Global Chain Hub" },
      {
        name: "description",
        content:
          "How Global Chain Hub collects, uses, stores and protects user and organization supply-chain data.",
      },
      { property: "og:title", content: "Privacy Policy — Global Chain Hub" },
      { property: "og:description", content: "How we handle user and organization data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-xs text-muted-foreground hover:underline">
        ← Back to Global Chain Hub
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Version {PRIVACY_VERSION}</p>

      <div className="mt-8 text-sm leading-relaxed">
        <Section title="Who we are">
          Global Chain Hub operates a collaboration platform for fashion and textile supply-chain
          organizations. This page is maintained by Global Chain Hub and describes current
          practices; it is not an independent certification or legal advice.
        </Section>
        <Section title="What we collect">
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account data: name, work email, authentication metadata.</li>
            <li>
              Organization data: name, entity type, location, website, description, logo,
              certifications, capabilities, materials, capacity, MOQ, lead times and other
              supply-chain attributes you enter.
            </li>
            <li>Documents you upload (audits, certificates, reports) — stored privately.</li>
            <li>Collaboration data: messages, meeting requests, projects and activity.</li>
            <li>Security logs: sign-in, password reset, role and organization changes.</li>
          </ul>
        </Section>
        <Section title="Passwords">
          Passwords are never stored by the application. Authentication is handled by our managed
          authentication provider, which stores only a salted hash. We never log passwords, tokens
          or session data.
        </Section>
        <Section title="Public vs private data">
          A limited profile (name, entity type, country/city, website, description, logo,
          certifications and capabilities) is visible to other verified members so partners can find
          you. Documents, internal readiness scores, KPIs, messages, projects and member details
          remain private to your organization and are enforced by database-level row access rules,
          not only by the interface.
        </Section>
        <Section title="Legal bases and purposes">
          We process account and organization data to perform our contract with you; security logs
          on the basis of our legitimate interest in protecting the platform; and marketing emails
          only with your separate, optional consent, which you can withdraw at any time.
        </Section>
        <Section title="Sharing">
          We do not sell personal data. Data is processed by our infrastructure providers (hosting,
          managed database, authentication, storage) acting as processors on our instructions.
        </Section>
        <Section title="Retention">
          Account and organization data is retained while your account is active. Deletion requests
          are actioned through the process below; security logs may be retained for a limited period
          for audit purposes.
        </Section>
        <Section title="Your rights">
          You can request an export of your data or deletion of your account from{" "}
          <span className="font-medium">Privacy &amp; security</span> inside the app. You may also
          object to processing or ask us to correct inaccurate data at{" "}
          <a className="text-primary hover:underline" href="mailto:privacy@globalchainhub.io">
            privacy@globalchainhub.io
          </a>
          .
        </Section>
        <Section title="Security">
          All traffic is served over HTTPS/TLS. Access to organization data is enforced server-side
          with row-level security. Uploaded documents live in private storage and are served through
          short-lived signed links only to authorised members. Service keys and database credentials
          are held in server-side environment variables and are never shipped to the browser.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </section>
  );
}
