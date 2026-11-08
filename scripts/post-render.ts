import { siteUrl, htmlFiles, cleanPath, escapeHtml as h, decodeHtml, jsonLd, publications, bibliography } from "./common.ts";

const base = siteUrl();
const output = (Deno.env.get("QUARTO_PROJECT_OUTPUT_DIR") || "_site").replaceAll("\\", "/").replace(/\/$/, "");
const urls: string[] = [];
const pubs = publications();
for (const file of htmlFiles(output)) {
  const relative = file.slice(output.length + 1);
  const canonical = new URL(cleanPath(relative), base).href;
  let html = Deno.readTextFileSync(file);
  // Keep a single canonical and a matching Open Graph URL, including directory-index URLs.
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g, "");
  html = html.replace(/<meta\b[^>]*property="og:url"[^>]*>\s*/g, "");
  html = html.replace(/<script\b[^>]*id="page-schema"[^>]*>[\s\S]*?<\/script>\s*/g, "");
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Xiaoxiong Xie");
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || "");
  const page: any = {
    "@context": "https://schema.org", "@type": "WebPage", "@id": canonical,
    url: canonical, name: title, description, inLanguage: "en-GB",
    isPartOf: { "@id": `${base}#website` }, about: { "@id": `${base}#person` }
  };
  if (relative === "about/index.html") {
    page["@type"] = "ProfilePage";
    page.mainEntity = { "@id": `${base}#person` };
  } else if (relative === "publications/index.html") {
    page["@type"] = "CollectionPage";
    page.mainEntity = {
      "@type": "ItemList", numberOfItems: pubs.length,
      itemListElement: pubs.map((p, index) => ({ "@type": "ListItem", position: index + 1, item: { "@id": `https://doi.org/${p.doi}` } }))
    };
  } else if (relative === "research/heat-pumps/index.html") {
    const paper = pubs.find(p => p.id === "xie-2024-heat-pumps");
    page.about = { "@type": "Thing", name: "Air-source heat pumps and urban microclimates" };
    page.mainEntity = {
      "@type": "Article", "@id": `${canonical}#explainer`, headline: title, description,
      inLanguage: "en-GB", author: { "@id": `${base}#person` }, about: page.about,
      mainEntityOfPage: { "@id": canonical },
      citation: { "@type": "ScholarlyArticle", "@id": `https://doi.org/${paper.doi}`, name: paper.title, url: `https://doi.org/${paper.doi}` }
    };
  } else if (relative === "research/index.html") {
    page.about = ["Urban–building climate interactions", "Climate-resilient retrofit", "Building energy modelling", "Urban thermal exposure"].map(name => ({ "@type": "Thing", name }));
    page.author = { "@id": `${base}#person` };
  }
  const schema = jsonLd(page).replace('<script ', '<script id="page-schema" ');
  html = html.replace("</head>", `<link rel="canonical" href="${h(canonical)}">\n<meta property="og:url" content="${h(canonical)}">\n${schema}\n</head>`);
  Deno.writeTextFileSync(file, html);
  if (relative !== "404.html") urls.push(canonical);
}
// No fabricated last-modified dates: regenerate from the pages that actually exist.
Deno.writeTextFileSync(`${output}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${h(url)}</loc></url>`).join("\n")}\n</urlset>\n`);
const robots = Deno.readTextFileSync("robots.txt").replace(/^Sitemap:.*$/m, `Sitemap: ${base}sitemap.xml`);
Deno.writeTextFileSync(`${output}/robots.txt`, robots);
Deno.writeTextFileSync(`${output}/.nojekyll`, "");
Deno.writeTextFileSync(`${output}/publications.bib`, bibliography(pubs));
console.log(`Finalised canonical URLs, structured data, robots.txt and sitemap (${urls.length} pages).`);
