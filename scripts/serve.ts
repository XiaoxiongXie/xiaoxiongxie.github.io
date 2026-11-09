// Static preview by default; --watch rebuilds locally and refreshes the browser.
import { siteUrl } from "./common.ts";
import { relative, resolve } from "node:path";
const watch = Deno.args.includes("--watch");
const projectRoot = Deno.cwd();
const port = Number(Deno.args.find(arg => /^\d+$/.test(arg)) || 4200);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose a port from 1024 to 65535.");
let revision = 0;
let building = false;
let pending = false;
const session = crypto.randomUUID();
async function render() {
  pending = true;
  if (building) return;
  building = true;
  try {
    do {
      pending = false;
      console.log("Rendering local website...");
      const windows = Deno.build.os === "windows";
      const bundled = resolve(projectRoot, ".tools/quarto/bin", windows ? "quarto.cmd" : "quarto");
      let quarto = "quarto";
      try { if (Deno.statSync(bundled).isFile) quarto = bundled; } catch { /* Use PATH on other installations. */ }
      // The parent Quarto wrapper already expanded these flags; let the child expand them once.
      const env = { QUARTO_DENO_EXTRA_OPTIONS: (Deno.env.get("QUARTO_DENO_EXTRA_OPTIONS") || "").replace(/--v8-flags=(?:"[^"]*"|\S+)/g, "").trim() };
      const command = windows
        ? new Deno.Command("cmd.exe", { args: ["/d", "/s", "/c", `""${quarto}" render"`], windowsRawArguments: true, cwd: projectRoot, env, stdout: "inherit", stderr: "inherit" })
        : new Deno.Command(quarto, { args: ["render"], cwd: projectRoot, env, stdout: "inherit", stderr: "inherit" });
      const result = await command.spawn().status;
      if (result.success) {
        revision++;
        console.log("Preview updated. Save a source file to update again.");
      } else {
        console.error("Render failed. Fix the error shown above and save again; the browser will refresh after a successful build.");
      }
    } while (pending);
  } finally { building = false; }
}
if (watch) await render();
const root = Deno.realPathSync("_site");
const basePath = siteUrl().pathname;
const versionPath = `${basePath}__local-preview-version`;
const types: Record<string, string> = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json", xml: "application/xml", txt: "text/plain; charset=utf-8", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", woff: "font/woff", woff2: "font/woff2" };
function withReload(html: string, waitForBuild = false) {
  if (!watch) return html;
  // This helper exists only in localhost responses, never in _site or GitHub Pages.
  const script = `<script data-local-preview-reload>
(() => {
  const current = ${JSON.stringify(`${session}:${revision}`)};
  const waiting = ${JSON.stringify(waitForBuild)};
  let checking = false;
  setInterval(async () => {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch(${JSON.stringify(versionPath)}, {cache: 'no-store'});
      if (response.ok) {
        const state = await response.json();
        if (!state.building && (waiting || state.version !== current)) location.reload();
      }
    } catch { /* The local preview may have been stopped. */ }
    finally { checking = false; }
  }, 1000);
})();
</script>`;
  return html.replace("</body>", `${script}\n</body>`);
}
async function notFound(head = false) {
  // Quarto briefly removes output during a rebuild. Keep new tabs recoverable.
  const waiting = watch && building;
  const title = waiting ? "Updating local preview" : "Page not found";
  const message = waiting ? "Your changes are being prepared. This page will refresh automatically." : "The requested page could not be found.";
  let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{max-width:42rem;margin:4rem auto;padding:0 1.5rem;font:1.1rem/1.6 system-ui,sans-serif;color:#172f42;background:#fdfdfb}h1{line-height:1.2}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
  if (!waiting) {
    try { html = await Deno.readTextFile(`${root}/404.html`); }
    catch { /* A missing error page must not turn a 404 into a server error. */ }
  }
  const headers: Record<string, string> = { "content-type": types.html, "cache-control": "no-store" };
  if (waiting) headers["retry-after"] = "1";
  return new Response(head ? null : withReload(html, waiting), { status: waiting ? 503 : 404, headers });
}
Deno.serve({ hostname: "127.0.0.1", port, onListen: () => console.log(`Local ${watch ? "live " : ""}preview: http://127.0.0.1:${port}${basePath}\nKeep this window open. Ctrl+C stops the preview. Nothing is published.`) }, async request => {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  if (watch && url.pathname === versionPath) return Response.json({ version: `${session}:${revision}`, building }, { headers: { "cache-control": "no-store" } });
  if (!url.pathname.startsWith(basePath)) return notFound(request.method === "HEAD");
  try {
    const path = decodeURIComponent(url.pathname.slice(basePath.length));
    let file = Deno.realPathSync(`${root}/${path}`);
    if (file !== root && !file.startsWith(root + (Deno.build.os === "windows" ? "\\" : "/"))) return notFound(request.method === "HEAD");
    if (Deno.statSync(file).isDirectory) {
      if (!url.pathname.endsWith("/")) return Response.redirect(new URL(url.pathname + "/" + url.search, url), 301);
      file += "/index.html";
    }
    const extension = file.split(".").pop()!;
    const body = request.method === "HEAD" ? null : extension === "html" && watch ? withReload(await Deno.readTextFile(file)) : await Deno.readFile(file);
    return new Response(body, { headers: { "content-type": types[extension] || "application/octet-stream", "cache-control": "no-store" } });
  } catch { return notFound(request.method === "HEAD"); }
});

if (watch) {
  const ignored = new Set([".git", ".quarto", ".tools", ".local", ".codex", ".agents", "_site", "_generated", "node_modules", "site_libs"]);
  const relevant = (path: string) => {
    const name = relative(projectRoot, path).replaceAll("\\", "/");
    if (name.split("/").some(part => ignored.has(part))) return false;
    return /\.(qmd|scss|css|ya?ml)$/.test(name) || /^(data|assets|includes|scripts)\//.test(name);
  };
  let timer: number | undefined;
  for await (const event of Deno.watchFs(projectRoot, { recursive: true })) {
    if (event.kind === "access" || !event.paths.some(relevant)) continue;
    clearTimeout(timer);
    timer = setTimeout(() => { void render().catch(error => console.error(error.message)); }, 500);
  }
}
