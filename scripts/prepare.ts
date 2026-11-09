import { escapeHtml as h, jsonLd, publications, siteUrl } from "./common.ts";

const base = siteUrl();
const pubs = publications();
const profile = JSON.parse(Deno.readTextFileSync("data/profile.json"));
Deno.mkdirSync("_generated", { recursive: true });
let portrait = "";
if (profile.portrait !== null) {
  if (typeof profile.portrait !== "string" || !/^assets\/[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|webp)$/.test(profile.portrait) || profile.portrait.includes("..")) throw new Error("Use a local JPG, PNG or WebP portrait in assets/.");
  if (!Deno.statSync(profile.portrait).isFile || !profile.portraitAlt?.trim()) throw new Error("The portrait must exist and have descriptive alt text.");
  portrait = `<img class="profile-portrait" src="/${h(profile.portrait)}" alt="${h(profile.portraitAlt)}" width="176" height="211" decoding="async">`;
}
Deno.writeTextFileSync("_generated/portrait.html", portrait);
if (!Array.isArray(profile.links) || profile.links.length === 0) throw new Error("Add verified professional profiles in data/profile.json.");
const profileUrls = new Set<string>();
for (const link of profile.links) {
  if (!link.label?.trim() || new URL(link.url).protocol !== "https:" || profileUrls.has(link.url)) throw new Error("Profile links must have labels and distinct HTTPS URLs.");
  profileUrls.add(link.url);
}
Deno.writeTextFileSync("_generated/profile-links.html", `<ul class="profile-links" aria-label="Academic and professional profiles">${profile.links.map((link: {label: string; url: string}) => `<li><a href="${h(link.url)}">${h(link.label)}</a></li>`).join("")}</ul>`);
const person = {
  "@context": "https://schema.org", "@type": "Person", "@id": `${base}#person`,
  name: "Xiaoxiong Xie", honorificPrefix: "Dr", url: base.href,
  ...(profile.portrait ? { image: new URL(profile.portrait, base).href } : {}),
  jobTitle: "Lecturer in Building Engineering",
  affiliation: { "@type": "CollegeOrUniversity", name: "University of Plymouth", url: "https://www.plymouth.ac.uk/" },
  email: "mailto:xiaoxiong.xie@plymouth.ac.uk",
  knowsAbout: ["Urban–building climate interactions", "Building energy simulation", "Urban climate modelling", "SUEWS–EnergyPlus coupling", "Climate-resilient retrofit", "Natural ventilation", "Low-carbon heating and cooling", "Urban thermal exposure"],
  sameAs: [...profileUrls]
};
Deno.writeTextFileSync("_generated/person.html", jsonLd(person) + "\n" + jsonLd({
  "@context": "https://schema.org", "@type": "WebSite", "@id": `${base}#website`,
  url: base.href, name: "Xiaoxiong Xie", inLanguage: "en-GB", publisher: { "@id": person["@id"] }
}));
const topics = [...new Set(pubs.flatMap(p => p.topics))].sort();
const years = [...new Set(pubs.map(p => p.year))];
const options = (values: unknown[]) => values.map(v => `<option value="${h(v)}">${h(v)}</option>`).join("");
const controls = `<div id="publication-controls" class="publication-controls" role="search" aria-label="Filter publications" hidden>
  <div class="filter-grid"><div><label for="publication-search">Search title, author or keyword</label><input type="search" id="publication-search" autocomplete="off" placeholder="e.g. heat pumps"></div>
  <div><label for="publication-year">Year</label><select id="publication-year"><option value="">All years</option>${options(years)}</select></div>
  <div><label for="publication-topic">Research topic</label><select id="publication-topic"><option value="">All topics</option>${options(topics)}</select></div></div>
  <div class="filter-bottom"><button type="button" id="publication-reset">Reset filters</button></div>
</div><p id="publication-count" role="status" aria-live="polite">${pubs.length} publications</p>
<p id="publication-empty" hidden>No publications match these filters. Try a different term or reset the filters.</p>`;
const articles = pubs.map(p => `<article class="publication" id="${h(p.id)}" data-year="${p.year}" data-topics="${h(JSON.stringify(p.topics))}">
<span class="publication-year">${p.year}</span>
<h2><a href="https://doi.org/${h(p.doi)}">${h(p.title)}</a></h2>
<p class="authors">${p.authors.map((a: string) => a === "Xiaoxiong Xie" ? `<strong>${h(a)}</strong>` : h(a)).join("; ")}.</p>
<p class="venue"><em>${h(p.journal)}</em>, ${h(p.volume)}, ${p.article ? `article ${h(p.article)}` : h(p.pages)} (${p.year}).</p>
${p.summary ? `<p class="publication-summary">${h(p.summary)}</p>` : ''}
<p class="publication-topics"><span class="topic-label">Topics:</span> ${p.topics.map((topic: string) => `<a href="/publications/?topic=${encodeURIComponent(topic)}">${h(topic)}</a>`).join('<span aria-hidden="true"> · </span>')}</p>
<p class="publication-links"><a href="https://doi.org/${h(p.doi)}">DOI: ${h(p.doi)}</a>${p.explainer ? ` · <a href="/${h(p.explainer)}">Read the research explainer</a>` : ''}</p>
</article>`).join("\n");
const scholarlyArticles = pubs.map(p => ({
  "@type": "ScholarlyArticle", "@id": `https://doi.org/${p.doi}`, headline: p.title, name: p.title,
  author: p.authors.map((name: string) => ({ "@type": "Person", name, ...(name === "Xiaoxiong Xie" ? { "@id": `${base}#person` } : {}) })),
  datePublished: String(p.year), identifier: p.doi, url: `https://doi.org/${p.doi}`,
  isPartOf: { "@type": "PublicationVolume", volumeNumber: p.volume, isPartOf: { "@type": "Periodical", name: p.journal } },
  ...(p.pages ? { pagination: p.pages } : { pagination: p.article }),
  keywords: p.topics.join(", "), description: p.summary,
  sameAs: p.source
}));
Deno.writeTextFileSync("_generated/publications.html", controls + articles + jsonLd({ "@context": "https://schema.org", "@graph": scholarlyArticles }));
// Research reading cards share their bibliographic facts with Publications.
for (const p of pubs) {
  Deno.writeTextFileSync(`_generated/paper-${p.id}.html`, `<article class="research-paper" aria-label="Supporting publication">
<p class="publication-meta">${p.year} · ${h(p.journal)}</p>
<p class="paper-title"><a href="/publications/#${h(p.id)}">${h(p.title)}</a></p>
<p class="paper-access"><a href="https://doi.org/${h(p.doi)}">DOI: ${h(p.doi)}</a></p>
</article>`);
}
console.log(`Prepared ${pubs.length} verified publication records and structured data.`);
