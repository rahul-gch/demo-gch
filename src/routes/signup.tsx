import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe2 } from "lucide-react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { CountrySelect } from "@/components/CountrySelect";
import { ENTITY_TYPES } from "@/lib/entity-profiles";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your company workspace — Global Chain Hub" },
      {
        name: "description",
        content: "Register your organization on Global Chain Hub in one short step.",
      },
      { property: "og:title", content: "Create your company workspace — Global Chain Hub" },
      { property: "og:description", content: "Register your organization on Global Chain Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/onboarding", replace: true });
    });
  }, [nav]);

  const pendingOrg =
    orgName.trim().length >= 2 && type && country
      ? { name: orgName.trim(), type, country }
      : null;

  const signupTypes = ENTITY_TYPES.filter((t) => t !== "Seed");

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/40 p-6">
      <div className="w-full max-w-4xl py-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Global Chain Hub</div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Create your company workspace</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tell us about your organization and set up your login. It takes under a minute.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              <section className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Organization
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Cotton Mills"
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Organization type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger aria-label="Organization type">
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
                  <CountrySelect
                    id="org-country"
                    value={country}
                    onChange={setCountry}
                    placeholder="Select country"
                  />
                </div>
              </section>

              <section className="space-y-4 border-t pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your login
                </h2>
                <EmailAuthForm
                  mode="signup"
                  pendingOrg={pendingOrg}
                  onSignedIn={() => nav({ to: "/onboarding", replace: true })}
                />
              </section>
            </div>

            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in
              </Link>
              {" · "}
              Invited by a colleague? Open the invite link from your email.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
