# Xiaoxiong Xie — Academic Website

Source for [xiaoxiongxie.github.io](https://xiaoxiongxie.github.io/), built with Quarto and hosted on GitHub Pages.

## Preview locally

On Windows, double-click `preview.cmd`, then open <http://127.0.0.1:4200/>. Leave the preview window open while editing; saving a source file rebuilds the site and refreshes the browser. Close the window or press Ctrl+C to stop. Previewing does not publish anything or send analytics.

Quarto **1.11.9** is pinned for local and GitHub Actions builds. On a fresh Windows checkout, install the portable release with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-quarto.ps1
```

Alternatively, install [Quarto](https://quarto.org/docs/get-started/) and use the commands below with `quarto` on PATH. Site builds require no additional packages.

## Edit and check

| File | Content |
| --- | --- |
| `index.qmd` | Profile, research focus and contact |
| `research/index.qmd` | Research questions, methods, figures and supporting papers |
| `research/heat-pumps/index.qmd` | Heat-pump explainer |
| `data/publications.json` | Verified publication records; shared by Publications and research cards |
| `projects/index.qmd` | Short funded-project entries |
| `teaching/index.qmd` | Modules, supervision and guest teaching |
| `background/index.qmd` | Experience, education, awards and service |
| `data/profile.json` | Professional links, portrait path and alt text |
| `styles.scss`, `_quarto.yml` | Design, navigation and site configuration |
| `docs/content-sources.md` | Public references and image licences |

Add publications by following an existing record: preserve the verified title, complete author order, journal issue year, DOI and source URL. Keep figure attribution and version-specific licences. Use only authorised photographs and remove personal metadata before adding them. Project and biography details must be verified and approved for publication.

Run these checks from the repository folder before committing:

```powershell
.\.tools\quarto\bin\quarto.cmd render
.\.tools\quarto\bin\quarto.cmd run scripts/validate.ts
.\.tools\quarto\bin\quarto.cmd run scripts/check-analytics.ts
.\.tools\quarto\bin\quarto.cmd run scripts/check-indexnow.ts
git diff --check
```

Review affected pages on phone and desktop widths. See [validation](docs/validation.md) and the [content checklist](docs/audit.md). Edit source files, not the generated `_site` directory.

## Commit and publish with GitHub Desktop

1. Select `xiaoxiongxie.github.io` and the `main` branch.
2. Review **Changes**, select the intended source files, enter a short summary and click **Commit to main**.
3. Click **Push origin**. This updates the repository, but does **not** deploy the website.
4. When ready to publish, open the [deployment workflow](https://github.com/XiaoxiongXie/xiaoxiongxie.github.io/actions/workflows/publish.yml): **Run workflow → main → Publish the website publicly → Run workflow**.
5. Wait for the build and deployment to succeed, then check the live website. Search notifications run after successful deployment.

[Settings → Pages](https://github.com/XiaoxiongXie/xiaoxiongxie.github.io/settings/pages) should use **GitHub Actions** as its source. Keep manual deployment enabled and automatic push deployment disabled.

## Privacy and maintenance

All tracked files and their history are public, including documentation and comments. Keep private documents, detailed working notes and backups in ignored `.local/` storage or outside the repository. Back them up privately: a fresh clone will not include them. Do not force-add ignored files or commit credentials, tools or rendered output.

Cloudflare is the only analytics provider. Its public beacon token is in `data/analytics.json`; setting it to `null` disables analytics. Local previews and the privacy page do not send analytics. See [analytics maintenance](docs/analytics.md) for the browser opt-out and checks.

Keep search verification values and crawler preferences intact. See [search discovery](docs/search-discovery.md) before changing search or AI-training settings. Changing `site-url` requires rebuilding and checking canonicals, sitemap and repository-subpath links. Preserve the old About and award redirects.

Project conventions are in [AGENTS.md](AGENTS.md). Third-party figures retain their individual licences; the portrait is not covered by an open-content licence.
