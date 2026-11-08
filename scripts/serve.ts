// Preview exactly the rendered Pages output, without injecting live-reload scripts.
import { siteUrl } from "./common.ts";
const root = Deno.realPathSync("_site");
const basePath = siteUrl().pathname;
const port = Number(Deno.args[0] || 4200);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose a port from 1024 to 65535.");
const types: Record<string, string> = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json", xml: "application/xml", txt: "text/plain; charset=utf-8", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", woff: "font/woff", woff2: "font/woff2" };
async function notFound() { return new Response(await Deno.readFile(`${root}/404.html`), { status: 404, headers: { "content-type": types.html } }); }
Deno.serve({ hostname: "127.0.0.1", port, onListen: () => console.log(`Local preview: http://127.0.0.1:${port}${basePath} (Ctrl+C to stop)`) }, async request => {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  if (!url.pathname.startsWith(basePath)) return notFound();
  try {
    const path = decodeURIComponent(url.pathname.slice(basePath.length));
    let file = Deno.realPathSync(`${root}/${path}`);
    if (file !== root && !file.startsWith(root + (Deno.build.os === "windows" ? "\\" : "/"))) return notFound();
    if (Deno.statSync(file).isDirectory) {
      if (!url.pathname.endsWith("/")) return Response.redirect(new URL(url.pathname + "/" + url.search, url), 301);
      file += "/index.html";
    }
    return new Response(request.method === "HEAD" ? null : await Deno.readFile(file), { headers: { "content-type": types[file.split(".").pop()!] || "application/octet-stream", "cache-control": "no-store" } });
  } catch { return notFound(); }
});
