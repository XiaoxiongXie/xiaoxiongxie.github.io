import { escapeHtml as h, jsonLd, publications, siteUrl } from "./common.ts";

const base = siteUrl();
const pubs = publications();
Deno.mkdirSync("_generated", { recursive: true });
const person = {
  "@context": "https://schema.org", "@type": "Person", "@id": `${base}#person`,
  name: "Xiaoxiong Xie", honorificPrefix: "Dr", url: base.href,
  jobTitle: "Lecturer in Building Engineering",
  affiliation: { "@type": "CollegeOrUniversity", name: "University of Plymouth", url: "https://www.plymouth.ac.uk/" },
  email: "mailto:xiaoxiong.xie@plymouth.ac.uk",
  knowsAbout: ["Urban–building climate interactions", "Building energy simulation", "Urban climate modelling", "SUEWS–EnergyPlus coupling", "Climate-resilient retrofit", "Natural ventilation", "Low-carbon heating and cooling", "Urban thermal exposure"],
  sameAs: ["https://www.plymouth.ac.uk/staff/xiaoxiong-xie", "https://researchportal.plymouth.ac.uk/en/persons/xiaoxiong-xie/", "https://orcid.org/0000-0003-2280-1768", "https://www.edrc.ac.uk/people/profile/dr-xiaoxiong-xie/"]
};
Deno.writeTextFileSync("_generated/person.html", jsonLd(person) + "\n" + jsonLd({
  "@context": "https://schema.org", "@type": "WebSite", "@id": `${base}#website`,
  url: base.href, name: "Xiaoxiong Xie", inLanguage: "en-GB", publisher: { "@id": person["@id"] }
}));
const topics = [...new Set(pubs.flatMap(p => p.topics))].sort();
const years = [...new Set(pubs.map(p => p.year))];
const options = (values: unknown[]) => values.map(v => `<option value="${h(v)}">${h(v)}</option>`).join("");
const controls = `<p class="citation-download"><a href="/publications.bib" download="xiaoxiong-xie-publications.bib">Download all ${pubs.length} citations (BibTeX)</a> <span>— full author lists and DOI links; UTF-8 format.</span></p>
<div id="publication-controls" class="publication-controls" role="search" aria-label="Filter publications" hidden>
  <div class="filter-grid"><div><label for="publication-search">Search title, author or keyword</label><input type="search" id="publication-search" autocomplete="off" placeholder="e.g. heat pumps"></div>
  <div><label for="publication-year">Year</label><select id="publication-year"><option value="">All years</option>${options(years)}</select></div>
  <div><label for="publication-topic">Research topic</label><select id="publication-topic"><option value="">All topics</option>${options(topics)}</select></div></div>
  <div class="filter-bottom"><label class="checkbox-label" for="publication-selected"><input id="publication-selected" type="checkbox"> Selected publications only</label><button type="button" id="publication-reset">Reset filters</button></div>
</div><p id="publication-count" role="status" aria-live="polite">${pubs.length} publications</p>
<p id="publication-empty" hidden>No publications match these filters. Try a different term or reset the filters.</p>`;
const articles = pubs.map(p => `<article class="publication" id="${h(p.id)}" data-year="${p.year}" data-selected="${p.selected}" data-topics="${h(JSON.stringify(p.topics))}">
<span class="publication-year">${p.year}</span>${p.selected ? '<span class="selected-label">Selected</span>' : ''}
<h2><a href="https://doi.org/${h(p.doi)}">${h(p.title)}</a></h2>
<p class="authors">${p.authors.map((a: string) => a === "Xiaoxiong Xie" ? `<strong>${h(a)}</strong>` : h(a)).join("; ")}.</p>
<p class="venue"><em>${h(p.journal)}</em>, ${h(p.volume)}, ${p.article ? `article ${h(p.article)}` : h(p.pages)} (${p.year}).</p>
${p.summary ? `<p class="publication-summary">${h(p.summary)}</p>` : ''}
<p class="publication-topics"><span class="topic-label">Topics:</span> ${p.topics.map((topic: string) => `<a href="/publications/?topic=${encodeURIComponent(topic)}">${h(topic)}</a>`).join('<span aria-hidden="true"> · </span>')}</p>
<p class="publication-links"><a href="https://doi.org/${h(p.doi)}">DOI: ${h(p.doi)}</a> · <a href="${h(p.source)}">Institutional record</a>${p.explainer ? ` · <a href="/${h(p.explainer)}">Read the research explainer</a>` : ''}</p>
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
const featured = pubs.filter(p => p.selected).map(p => `<article class="featured-publication"><span class="publication-year">${p.year}</span><div><h3><a href="/publications/#${h(p.id)}">${h(p.title)}</a></h3><p>${h(p.journal)} · ${h(p.summary)}</p></div></article>`).join("\n");
Deno.writeTextFileSync("_generated/featured.html", '<div class="featured-publications">' + featured + '</div>');
console.log(`Prepared ${pubs.length} verified publication records and structured data.`);
