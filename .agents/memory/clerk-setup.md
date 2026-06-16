---
name: Clerk auth setup
description: How Clerk was wired into MediBridge; fix for the null useEffect runtime error with @clerk/themes in Vite.
---

## Rule
When adding @clerk/react + @clerk/themes to a Vite project, the Vite config must have BOTH `resolve.dedupe: ["react","react-dom"]` AND `optimizeDeps.include: ["react","react-dom","@clerk/react"]`. The dedupe alone is not enough — without the optimizeDeps entry, @clerk/themes can trigger "Cannot read properties of null (reading 'useEffect')" at runtime.

**Why:** @clerk/themes ships CJS that references React. Vite's optimizer needs to pre-bundle @clerk/react alongside the canonical React chunks to prevent a second React instance from being resolved at runtime.

**How to apply:** Any time Clerk is added to a Vite app, add both config entries before the first run.

## Other notes
- `cssLayerName: "clerk"` is Tailwind v4 only. This project uses Tailwind v4 with @tailwindcss/vite.
- The "development keys" console warning from Clerk is a red herring — it's expected in dev.
- Dashboard route is protected with `<Show when="signed-in">` inline in the Router.
- `publishableKeyFromHost` must be imported from `@clerk/react/internal` (not @clerk/shared).
