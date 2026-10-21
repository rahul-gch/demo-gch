# Project rules
- Reuse the shared GchLogo for onboarding branding so sign-in, registration, and setup stay consistent.
- Derive onboarding stages and progressive profile completion from entity-profiles, batch questions in onboarding-sections, and persist partial answers through existing authenticated profile functions to preserve old data and permissions.
- Keep registration choices separate from legacy entity definitions so retiring a signup type never invalidates saved organization profiles.
- Compose organization overview summaries in the workspace index route and keep recommendations in ActionQueue so shared signals are not rendered twice.