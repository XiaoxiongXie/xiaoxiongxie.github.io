# Validation

Run from the project root using Quarto or its local Windows installation:

```powershell
.\.tools\quarto\bin\quarto.cmd render
.\.tools\quarto\bin\quarto.cmd run scripts/validate.ts
.\.tools\quarto\bin\quarto.cmd run scripts/check-analytics.ts
.\.tools\quarto\bin\quarto.cmd run scripts/check-indexnow.ts
git diff --check
```

The validator covers internal links and assets, headings, metadata, structured data, bibliography, sitemap, crawler preferences, output hygiene and deployment safeguards. Analytics and IndexNow checks use local fixtures without sending live events or notifications.

Check affected pages at phone and desktop widths. Confirm images load correctly, content does not overflow, the pinned menu works with keyboard and touch, and publication filters and preserved bookmarks work. Test a repository subpath after changing URL handling.

Before committing, review changed source files, documentation and image metadata. Confirm private notes, original documents, local tools and rendered output remain ignored. Keep detailed screenshots and review logs in `.local/`; public notes should contain only concise technical outcomes.

Publication requires a separate, explicitly requested manual workflow on `main`. A successful local build does not establish that the deployed site has changed.

## Latest local check — 14 November 2026

- Render and validation passed: 10 HTML pages, 401 internal links/assets and 10 publication records; metadata, sitemap, crawler policy and workflow checks passed.
- Analytics privacy checks passed (28 assertions); IndexNow safeguard checks passed without external requests.
- The cleaned portrait retains identical decoded pixels, dimensions and ICC profile. Home displays correctly at 390px and 1280px, without horizontal overflow or browser warnings/errors. Local preview loads no remote analytics beacon.
- Private working files and backups are ignored and absent from the generated website.
