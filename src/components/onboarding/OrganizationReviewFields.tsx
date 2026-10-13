import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ProfileCoreFields } from "@/lib/profile-score";

export interface OrganizationReviewValues extends ProfileCoreFields {
  name: string;
  country: string;
  description: string;
  website: string;
  city: string;
}

export function OrganizationReviewFields({ values, entityType, onChange }: {
  values: OrganizationReviewValues;
  entityType: string;
  onChange: (values: OrganizationReviewValues) => void;
}) {
  const update = (key: keyof OrganizationReviewValues, value: string) => onChange({ ...values, [key]: value });
  return <div className="grid gap-6 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="review-name">Organization name</Label><Input id="review-name" value={values.name} maxLength={120} onChange={(e) => update("name", e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="review-type">Organization type</Label><Input id="review-type" value={entityType} readOnly className="bg-muted" /></div>
    <div className="space-y-2"><Label htmlFor="review-country">Country</Label><Input id="review-country" value={values.country} maxLength={80} onChange={(e) => update("country", e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="review-city">City / region</Label><Input id="review-city" value={values.city} maxLength={80} onChange={(e) => update("city", e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="review-website">Website</Label><Input id="review-website" type="url" value={values.website} maxLength={255} placeholder="https://" onChange={(e) => update("website", e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="review-description">Organization description</Label><Textarea id="review-description" rows={3} value={values.description} maxLength={4000} onChange={(e) => update("description", e.target.value)} /></div>
  </div>;
}