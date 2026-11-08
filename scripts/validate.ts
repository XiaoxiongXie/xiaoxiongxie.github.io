// Dependency-free build checks, executed with the Deno runtime bundled in Quarto.
import { config, siteUrl, publications, htmlFiles, cleanPath } from "./common.ts";
import { parse } from "stdlib/yaml";
import { indexNowPayload } from "./notify-indexnow.mjs";
const base = siteUrl();
const output = "_site";
const errors: string[] = [];
const assert = (ok: unknown, message: string) => { if (!ok) errors.push(message); };
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const files = htmlFiles(output);
const documents = new Map(files.map(file => [file.slice(output.length + 1), Deno.readTextFileSync(file)]));
const titles = new Set();
const descriptions = new Set();
const schemasByPage = new Map<string, any[]>();
let links = 0;
for (const [path, html] of documents) {
  const label = `${path}: `;
  const canonical = new URL(cleanPath(path), base).href;
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1];
  assert(title && !titles.has(title), label + "missing or duplicate title"); titles.add(title);
  assert(description && !descriptions.has(description), label + "missing or duplicate description"); descriptions.add(description);
  assert((html.match(/<h1\b/g) || []).length === 1, label + "expected one H1");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert(new Set(ids).size === ids.length, label + "duplicate HTML IDs");
  if (path !== "404.html") assert(!/<meta[^>]*name="(?:robots|googlebot|bingbot)"[^>]*content="[^"]*noindex/i.test(html), label + "public page blocks indexing");
  assert(/<html[^>]*lang="en/i.test(html), label + "missing document language");
  assert(/name="viewport"/.test(html), label + "missing responsive viewport");
  assert(html.includes('id="quarto-document-content"') && html.includes('id="quarto-skip-link"'), label + "missing main content or skip link");
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)];
  assert(canonicals.length === 1 && decode(canonicals[0][1]) === canonical, label + "incorrect canonical URL");
  assert(html.includes(`property="og:url" content="${canonical}"`), label + "incorrect Open Graph URL");
  assert(/property="og:title"/.test(html) && /property="og:description"/.test(html), label + "missing Open Graph metadata");
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => {
    try { return JSON.parse(m[1]); } catch { errors.push(label + "invalid JSON-LD"); return {}; }
  });
  schemasByPage.set(path, schemas);
  assert(schemas.some(s => s["@type"] === "Person" && s["@id"] === `${base}#person`), label + "missing Person structured data");
  assert(schemas.some(s => s["@type"] === "WebSite" && s["@id"] === `${base}#website` && s.url === base.href), label + "missing WebSite identity");
  const page = schemas.find(s => s["@id"] === canonical);
  assert(page?.name === decode(title || "") && page?.description === decode(description || ""), label + "page schema differs from visible metadata");
  assert(page?.url === canonical && page?.isPartOf?.["@id"] === `${base}#website`, label + "page schema does not link to its canonical and website");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = decode(match[1]);
    if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) continue;
    const url = new URL(raw, new URL(path, base));
    if (url.origin !== base.origin) continue;
    if (!url.pathname.startsWith(base.pathname)) { errors.push(label + `link escapes site base: ${raw}`); continue; }
    let target = decodeURIComponent(url.pathname.slice(base.pathname.length));
    if (!target || target.endsWith("/")) target += "index.html";
    links++;
    try { assert(Deno.statSync(`${output}/${target}`).isFile, label + `not a file: ${raw}`); }
    catch { errors.push(label + `missing internal target: ${raw}`); continue; }
    if (url.hash && documents.has(target)) {
      const anchor = decodeURIComponent(url.hash.slice(1));
      assert(documents.get(target)!.includes(`id="${anchor}"`), label + `missing fragment: ${raw}`);
    }
  }
  // External links are intentional; remotely loaded scripts, frames and tracking are not.
  assert(!/<(?:script|iframe)\b[^>]*src="https?:/i.test(html), label + "third-party script or frame");
  assert(!/<link\b[^>]*(?:href="https?:[^\"]+")[^>]*rel="stylesheet"/i.test(html), label + "remote stylesheet");
  assert(!/googletagmanager|google-analytics\.com|plausible\.io\/js/.test(html), label + "tracking script found");
}
const sitemap = Deno.readTextFileSync(`${output}/sitemap.xml`);
const indexNowKey = Deno.readTextFileSync("data/indexnow-key.txt").trim();
const notification = indexNowPayload(base.href, indexNowKey, sitemap);
assert(Deno.readTextFileSync(`${output}/${indexNowKey}.txt`).trim() === indexNowKey, "Missing or incorrect IndexNow ownership file");
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1])).sort();
const expected = [...documents.keys()].filter(p => p !== "404.html").map(p => new URL(cleanPath(p), base).href).sort();
assert(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), "Sitemap namespace missing");
assert(JSON.stringify(locations) === JSON.stringify(expected), "Sitemap does not match public pages");
assert(JSON.stringify([...notification.urlList].sort()) === JSON.stringify(expected), "IndexNow payload differs from public canonical URLs");
const robots = Deno.readTextFileSync(`${output}/robots.txt`);
assert(robots.includes(`Sitemap: ${base}sitemap.xml`), "Incorrect robots sitemap URL");
for (const bot of ["*", "Googlebot", "Bingbot", "OAI-SearchBot"]) assert(robots.includes(`User-agent: ${bot}\nAllow: /`), `Missing crawler allowance: ${bot}`);
assert(Deno.statSync(`${output}/.nojekyll`).isFile, "Missing .nojekyll");
const pubs = publications();
const pubHtml = documents.get("publications/index.html") || "";
for (const p of pubs) assert(pubHtml.includes(`id="${p.id}"`) && pubHtml.includes(`https://doi.org/${p.doi}`), `Publication missing from HTML: ${p.id}`);
const pubSchema = [...pubHtml.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(s => s["@graph"]);
assert(pubSchema?.["@graph"]?.length === pubs.length, "Publication schema count differs from visible records");
for (const p of pubs) {
  const article = pubSchema?.["@graph"]?.find((entry: any) => entry["@id"] === `https://doi.org/${p.doi}`);
  assert(article?.["@type"] === "ScholarlyArticle" && article?.name === p.title && article?.headline === p.title, `Schema title mismatch: ${p.id}`);
  assert(JSON.stringify(article?.author?.map((a: any) => a.name)) === JSON.stringify(p.authors), `Schema authors/order mismatch: ${p.id}`);
  assert(article?.datePublished === String(p.year) && article?.identifier === p.doi, `Schema year or DOI mismatch: ${p.id}`);
  assert(article?.isPartOf?.volumeNumber === p.volume && article?.isPartOf?.isPartOf?.name === p.journal, `Schema journal/volume mismatch: ${p.id}`);
  assert(article?.pagination === (p.pages || p.article) && article?.sameAs === p.source, `Schema locator/source mismatch: ${p.id}`);
}
const collection = schemasByPage.get("publications/index.html")?.find(s => s["@type"] === "CollectionPage");
const list = collection?.mainEntity;
assert(list?.["@type"] === "ItemList" && list?.numberOfItems === pubs.length, "Missing publication collection");
assert(JSON.stringify(list?.itemListElement?.map((item: any) => item.item["@id"])) === JSON.stringify(pubs.map(p => `https://doi.org/${p.doi}`)), "Collection does not reference the displayed publications in order");
const profile = schemasByPage.get("about/index.html")?.find(s => s["@type"] === "ProfilePage");
assert(profile?.mainEntity?.["@id"] === `${base}#person`, "ProfilePage must identify Xiaoxiong Xie");
const explainerPage = schemasByPage.get("research/heat-pumps/index.html")?.find(s => s.mainEntity?.["@type"] === "Article");
assert(explainerPage?.mainEntity?.citation?.["@id"] === "https://doi.org/10.1016/j.scs.2024.105811", "Explainer does not cite the original scholarly article");
assert(explainerPage?.about?.name === "Air-source heat pumps and urban microclimates", "Explainer schema has the wrong subject");
const bib = Deno.readTextFileSync(`${output}/publications.bib`);
assert((bib.match(/^@article\{/gm) || []).length === pubs.length, "BibTeX record count differs");
for (const p of pubs) assert(bib.includes(`@article{${p.id},`) && bib.includes(`doi = {${p.doi}}`), `Missing downloadable citation: ${p.id}`);
assert(pubHtml.includes('download="xiaoxiong-xie-publications.bib"'), "Missing citation download link");
const search = JSON.parse(Deno.readTextFileSync(`${output}/search.json`));
assert(search.some((entry: any) => entry.href.includes("publications/")), "Publications missing from local search index");
const workflow = parse(Deno.readTextFileSync(".github/workflows/publish.yml")) as any;
assert(workflow.on.push.branches.includes("main"), "Workflow does not deploy main");
assert(workflow.jobs.deploy.needs === "build", "Deploy job must depend on build");
assert(workflow.jobs.deploy.permissions.pages === "write" && workflow.jobs.deploy.permissions["id-token"] === "write", "Missing Pages/OIDC permissions");
assert(workflow.jobs.deploy.environment.name === "github-pages", "Missing Pages environment");
assert(workflow.jobs["notify-search-engines"]?.needs === "deploy", "Search notification must wait for successful deployment");
assert(workflow.jobs.deploy.if.includes("github.event_name != 'pull_request'") && workflow.jobs.deploy.if.includes("github.ref == 'refs/heads/main'"), "Deployment must be restricted to main and exclude pull requests");
assert(workflow.jobs.deploy.steps.some((step: any) => step.uses === "actions/deploy-pages@v4"), "Missing official Pages deployment action");
const steps = workflow.jobs.build.steps;
const renderIndex = steps.findIndex((step: any) => step.run === "quarto render");
const validateIndex = steps.findIndex((step: any) => step.run === "quarto run scripts/validate.ts");
const uploadIndex = steps.findIndex((step: any) => step.uses === "actions/upload-pages-artifact@v4");
assert(renderIndex >= 0 && validateIndex > renderIndex && uploadIndex > validateIndex, "Build must validate after rendering and before uploading");
for (const action of ["actions/checkout@v6", "quarto-dev/quarto-actions/setup@v2", "actions/configure-pages@v5", "actions/upload-pages-artifact@v4"]) assert(steps.some((s: any) => s.uses === action), `Missing workflow action: ${action}`);
assert(config().project.render.length === documents.size, "Unexpected number of rendered pages");
if (errors.length) { console.error(errors.join("\n")); Deno.exit(1); }
console.log(`PASS: ${files.length} pages, ${links} internal links/assets, ${pubs.length} publications, metadata, structured data, sitemap, crawler rules and workflow configuration.`);
