import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Lock, Network } from "lucide-react";
import gchLogo from "@/assets/gch-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { CountrySelect } from "@/components/CountrySelect";
import { VerificationUpload } from "@/components/verification/VerificationUpload";
import { ENTITY_TYPES } from "@/lib/entity-profiles";
import { stashPendingVerificationFile, verificationChoiceValid } from "@/lib/verification";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Register your company — Global Chain Hub" },
      { name: "description", content: "Register your organization on Global Chain Hub in one short step." },
      { property: "og:title", content: "Register your company — Global Chain Hub" },
      { property: "og:description", content: "Register your organization on Global Chain Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
          {n}
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-none">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4 pl-9">{children}</div>
    </section>
  );
}

function SignupPage() {
  const nav = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [later, setLater] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/onboarding", replace: true });
    });
  }, [nav]);

  useEffect(() => {
    void stashPendingVerificationFile(file);
  }, [file]);

  const verificationOk = verificationChoiceValid(file, later);
  const pendingOrg =
    orgName.trim().length >= 2 && type && country && verificationOk
      ? { name: orgName.trim(), type, country, verification: file ? "upload" : "later" }
      : null;

  const signupTypes = ENTITY_TYPES.filter((t) => t !== "Seed");

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden h-screen lg:sticky lg:top-0 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 p-1">
            <img src={gchLogo} alt="GCH" className="h-8 w-8" />
          </span>
          <span className="text-lg font-bold tracking-tight">GCH</span>
        </div>
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              The verified network for textile and apparel supply chains.
            </h1>
            <p className="text-sm text-primary-foreground/70">
              Connect with brands, mills and factories, share credentials once, and run projects with your partners.
            </p>
          </div>
          <ul className="space-y-4 text-sm">
            {[
              { icon: BadgeCheck, t: "Verified organizations", d: "Every company is reviewed before receiving a verified badge." },
              { icon: Network, t: "Matchmaking that fits", d: "Partners are suggested from your capabilities and credentials." },
              { icon: Lock, t: "Private by default", d: "Documents are shared only with organizations you connect with." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <div className="font-medium">{t}</div>
                  <div className="text-primary-foreground/60">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} Global Chain Hub</p>
      </aside>

      <main className="flex items-start justify-center px-5 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={gchLogo} alt="GCH" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">GCH</span>
          </div>
          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Register your company</h1>
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/auth" className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="space-y-8">
            <Step n={1} title="Organization" hint="Shown on your public profile.">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Cotton Mills"
                  autoComplete="organization"
                  className="h-10"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Organization type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger aria-label="Organization type" className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {signupTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-country">Headquarters country</Label>
                  <CountrySelect id="org-country" value={country} onChange={setCountry} placeholder="Select country" />
                </div>
              </div>
            </Step>

            <Step n={2} title="Business verification" hint="Proof that your company is registered. Reviewed by our team.">
              <VerificationUpload file={file} onFile={setFile} later={later} onLater={setLater} />
            </Step>

            <Step n={3} title="Your login" hint="You'll be the owner of this workspace.">
              <EmailAuthForm
                mode="signup"
                pendingOrg={pendingOrg}
                onSignedIn={() => nav({ to: "/onboarding", replace: true })}
              />
            </Step>
          </div>

          <p className="mt-10 border-t pt-5 text-xs text-muted-foreground">
            Invited by a colleague? Open the invite link from your email to join their workspace.
          </p>
        </div>
      </main>
    </div>
  );
}
