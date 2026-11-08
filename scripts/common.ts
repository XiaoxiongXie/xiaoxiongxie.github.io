import { parse } from "stdlib/yaml";

export function config() {
  return parse(Deno.readTextFileSync("_quarto.yml")) as any;
}
export function siteUrl(): URL {
  const url = new URL(config().website["site-url"]);
  if (url.protocol !== "https:" || url.search || url.hash) throw new Error("site-url must be a public HTTPS base URL.");
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
export function jsonLd(value: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`;
}
export function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
// UTF-8 BibTeX, using the same verified records as the visible publication list.
export function bibliography(entries: any[]): string {
  const tex = (value: unknown) => String(value).replace(/[\\{}%&#_$]/g, character => character === "\\" ? "\\textbackslash{}" : `\\${character}`);
  return entries.map(p => {
    const fields = {
      title: `{${tex(p.title)}}`, author: p.authors.map(tex).join(" and "),
      year: String(p.year), journal: tex(p.journal), volume: tex(p.volume),
      pages: tex(p.pages || p.article).replace(/[–—]/g, "--"), doi: p.doi, url: `https://doi.org/${p.doi}`
    };
    return `@article{${p.id},\n${Object.entries(fields).map(([key, value]) => `  ${key} = {${value}}`).join(",\n")}\n}`;
  }).join("\n\n") + "\n";
}
export function publications(): any[] {
  const entries = JSON.parse(Deno.readTextFileSync("data/publications.json"));
  const ids = new Set();
  const dois = new Set();
  for (const p of entries) {
    for (const key of ["id", "title", "authors", "year", "journal", "volume", "doi", "topics", "source", "verified"]) {
      if (!p[key]) throw new Error(`Publication missing ${key}: ${p.id ?? "unknown"}`);
    }
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id) || dois.has(p.doi)) throw new Error(`Duplicate or invalid publication: ${p.id}`);
    if (!/^10\.\d{4,9}\/.+/.test(p.doi)) throw new Error(`Invalid DOI: ${p.doi}`);
    if (!Array.isArray(p.authors) || !p.authors.includes("Xiaoxiong Xie")) throw new Error(`Check authors: ${p.id}`);
    if (!Array.isArray(p.topics) || !Number.isInteger(p.year) || typeof p.selected !== "boolean") throw new Error(`Check fields: ${p.id}`);
    if (!p.article && !p.pages) throw new Error(`Missing article number or pages: ${p.id}`);
    ids.add(p.id); dois.add(p.doi);
  }
  return entries.sort((a: any, b: any) => b.year - a.year);
}
export function htmlFiles(directory: string): string[] {
  const result: string[] = [];
  for (const entry of Deno.readDirSync(directory)) {
    if (entry.isDirectory && entry.name !== "site_libs") result.push(...htmlFiles(`${directory}/${entry.name}`));
    else if (entry.isFile && entry.name.endsWith(".html")) result.push(`${directory}/${entry.name}`);
  }
  return result.sort();
}
export function cleanPath(path: string): string { return path.replace(/(^|\/)index\.html$/, "$1"); }
