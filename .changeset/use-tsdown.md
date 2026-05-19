---
"@spon/payload-forms": patch
---

Fix `Module not found` errors caused by unresolved `@/` path aliases in the published package. Switched build tooling from `@swc/cli` + `tsc` + `copyfiles` to `tsdown`, which resolves all TypeScript path aliases to relative imports during compilation.

Also moves `@tailwindcss/postcss`, `@tanstack/react-form`, `@tanstack/store`, `class-variance-authority`, and `tailwindcss` from dependencies to devDependencies, as they are build-time requirements and not needed by consumers of the package.
