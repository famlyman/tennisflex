<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Next.js 16 Key Breaking Changes (v15 → v16)

| Change | Details |
|---|---|
| **Async Request APIs** | `params`, `searchParams`, `cookies()`, `headers()` are Promises — sync access removed |
| **`middleware` → `proxy`** | File renamed, export renamed to `proxy`, uses `NextProxy` type |
| **Turbopack default** | No `--turbopack` flag needed; use `--webpack` to opt out |
| **`experimental.turbopack`** → `turbopack` | Config promoted to top-level |
| **`experimental.dynamicIO`** → `cacheComponents` | `cacheComponents: true` enables PPR + `'use cache'` |
| **`cacheLife`/`cacheTag` stable** | Remove `unstable_` prefix from imports |
| **`revalidateTag` requires 2nd arg** | Must pass `cacheLife` profile (e.g. `'max'`) |
| **`updateTag` (new)** | Read-your-writes cache invalidation (Server Actions only) |
| **`next lint` removed** | Use ESLint CLI directly |
| **ESLint flat config default** | `eslint.config.*` instead of `.eslintrc` |
| **`next/legacy/image` deprecated** | Use `next/image` |
| **`images.domains` deprecated** | Use `images.remotePatterns` |
| **Parallel routes need `default.js`** | Build fails without it |
| **Image metadata params/id async** | `opengraph-image`, `icon`, `sitemap` params are Promises |
| **React Compiler stable** | `reactCompiler: true` in config (not default) |
| **`unstable_instant`** | New route segment config for instant navigation validation (requires `cacheComponents`) |
| **Concurrent dev/build** | Separate output dirs (`.next/dev`) |
<!-- END:nextjs-agent-rules -->
