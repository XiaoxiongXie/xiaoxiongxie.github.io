// Exercise the actual browser loader with an in-memory DOM. No external request
// or real analytics event is made; no additional runtime/package is needed.
const code = Deno.readTextFileSync("assets/analytics.js");
const execute = new Function("document", "location", "navigator", "window", "localStorage", code);
const token = "0123456789abcdef0123456789abcdef";
const base = "https://xiaoxiongxie.github.io/";
let checks = 0;
function assert(ok: unknown, message: string) {
  checks++;
  if (!ok) throw new Error(message);
}
function run(options: any = {}) {
  const site = options.site || base;
  const values: Map<string, string> = options.values || new Map();
  const requests: any[] = [];
  const listeners: Record<string, Function> = {};
  const button: any = { hidden: true, addEventListener: (name: string, fn: Function) => { listeners[name] = fn; } };
  const status: any = {};
  const document = {
    currentScript: { dataset: { cloudflareToken: options.token ?? token, siteUrl: site } },
    getElementById: (id: string) => options.controls ? (id === "analytics-toggle" ? button : status) : null,
    querySelector: (selector: string) => selector.includes("robots") ? { content: options.noindex ? "noindex, follow" : "" } : options.duplicate ? {} : null,
    createElement: () => ({ setAttribute(name: string, value: string) { this[name] = value; } }),
    head: { appendChild: (element: any) => requests.push(element) }
  };
  const storage = {
    getItem: (key: string) => { if (options.storageBlocked) throw new Error("Blocked"); return values.get(key) || null; },
    setItem: (key: string, value: string) => { if (options.storageBlocked) throw new Error("Blocked"); values.set(key, value); },
    removeItem: (key: string) => values.delete(key)
  };
  execute(document, new URL(options.url || site), { doNotTrack: options.dnt, globalPrivacyControl: options.gpc },
    { addEventListener: (name: string, fn: Function) => { listeners[name] = fn; } }, storage);
  return { requests, values, button, status, click: () => listeners.click(), listeners };
}
const normal = run();
assert(normal.requests.length === 1, "Public page must request one beacon.");
assert(normal.requests[0].src === "https://static.cloudflareinsights.com/beacon.min.js" && normal.requests[0].type === "module", "Only the official module beacon may load.");
assert(JSON.stringify(JSON.parse(normal.requests[0]["data-cf-beacon"])) === JSON.stringify({ token, spa: false }), "Beacon must use the site's public token with SPA measurement disabled.");
assert(normal.values.size === 0, "Default visits must not create stored identifiers or preferences.");
for (const url of ["http://127.0.0.1:4200/", "http://localhost:4200/", "file:///tmp/index.html", "https://other.github.io/", "https://xiaoxiongxie.github.io:8443/", "http://xiaoxiongxie.github.io/"]) {
  assert(run({ url }).requests.length === 0, `Analytics must stay off at ${url}`);
}
for (const options of [{ token: "" }, { token: "not-a-site-token" }, { dnt: "1" }, { gpc: true }, { storageBlocked: true }, { noindex: true }, { duplicate: true }]) {
  assert(run(options).requests.length === 0, `Analytics must stay off: ${JSON.stringify(options)}`);
}
const key = `xx-analytics:${base}`;
const values = new Map([[key, "off"]]);
assert(run({ values }).requests.length === 0, "Saved opt-out must prevent the beacon request.");
const control = run({ controls: true });
assert(control.requests.length === 0 && !control.button.hidden, "Privacy page must show a control without loading the beacon.");
control.click();
assert(control.values.get(key) === "off" && control.status.textContent.startsWith("Analytics are off"), "Opt-out must persist and be announced.");
assert(run({ values: control.values }).requests.length === 0, "Navigation after opting out must remain unmeasured.");
control.click();
assert(control.values.size === 0 && run({ values: control.values }).requests.length === 1, "Re-enabling must allow subsequent page loads.");
assert(control.requests.length === 0, "Changing a preference must not itself send analytics.");
assert(run({ controls: true, storageBlocked: true }).button.disabled, "Blocked storage must fail closed with a disabled preference control.");
assert(run({ controls: true, gpc: true }).button.disabled, "The page must not override the browser's privacy choice.");
const subpath = `${base}project/`;
assert(run({ site: subpath, url: `${subpath}research/` }).requests.length === 1, "Project-site pages must be measurable.");
assert(run({ site: subpath, url: `${base}projects/` }).requests.length === 0, "A similarly named sibling path is not part of the site.");
const scoped = run({ site: subpath, controls: true });
scoped.click();
assert(scoped.values.get(`xx-analytics:${subpath}`) === "off", "Preference storage must be scoped to a project site.");
console.log(`Analytics privacy checks passed (${checks} assertions; no network requests).`);
