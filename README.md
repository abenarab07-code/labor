# Laboratoire Dr Tarfaya

Premium public website and clinic operations foundation for Dr Tarfaya in El Bouni, Annaba.

The public experience positions the clinic as more than a generic analysis counter: it connects medical analyses, specialist hematology interpretation and a clear patient next step.

## Brand idea

**Votre sang raconte. Nous savons le lire.**

The visual system evolves the supplied droplet, microscope and orbit concept into a cleaner **Diagnostic Field**: a circular lens that can represent a cell, a scan, a pathway or clinical focus.

Full messaging, visual identity, logo rules, image direction and interface tokens are documented in [`docs/brand-guidelines.md`](docs/brand-guidelines.md).

## Public experience

- High-impact scientific hero with French and Arabic clarification.
- Medical analysis, specialist hematology and consultation pathways.
- Original generated scientific campaign imagery.
- Authentic Dr Tarfaya concept video integrated with a real video frame poster.
- Clear pre-analysis preparation journey.
- Safe medical language: no invented accreditation, timing, rating or guaranteed diagnosis.
- Direct phone, WhatsApp and appointment-request routes.
- Responsive navigation and mobile sticky actions.
- Existing operational admin foundation retained and rebranded.

## Technology

- TanStack Start / TanStack Router
- React 19 + TypeScript
- Tailwind CSS 4
- Motion
- Supabase
- Vite / Nitro

## Run locally

The original project uses Bun:

```bash
bun install
bun run dev
```

It also runs with pnpm:

```bash
pnpm install
pnpm run dev
```

Production verification:

```bash
pnpm exec tsc --noEmit
pnpm run build
```

## Environment

Create a local `.env` file. Do not commit it.

```text
SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

The public home page renders without Supabase credentials. Appointment submission and admin operations require a configured Supabase project and the existing migrations under `supabase/migrations/`.

## Key files

- `src/components/site/LaboratoryHome.tsx` - public brand experience
- `src/components/site/Logo.tsx` - responsive logo lockup
- `src/styles.css` - production design tokens and UI foundation
- `src/content/clinic.ts` - verified clinic contact details
- `src/content/services.ts` - analysis and hematology service architecture
- `docs/brand-guidelines.md` - brand source of truth
- `docs/image-prompts.md` - exact prompts used for the generated campaign imagery
- `assets/design-tokens.json` - portable token reference

## Content verification before launch

The client report did not provide exact opening times, an email address, a Google Maps pin, accreditation data, turnaround times, testimonials or social profiles. The website therefore does not invent them. Confirm these items with Dr Tarfaya before production launch.
