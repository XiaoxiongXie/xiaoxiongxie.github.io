// No network calls: exercise ownership verification and submission failure handling.
import { indexNowPayload, notifyIndexNow } from "./notify-indexnow.mjs";
const key = Deno.readTextFileSync("data/indexnow-key.txt").trim();
const base = "https://example.org/research-site/";
const sitemap = `<urlset><url><loc>${base}</loc></url><url><loc>${base}research/</loc></url></urlset>`;
const assert = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };
const expectFailure = async (fn: () => unknown, label: string) => {
  try { await fn(); } catch { return; }
  throw new Error(`Expected rejection: ${label}`);
};
const payload = indexNowPayload(base, key, sitemap);
assert(payload.keyLocation === `${base}${key}.txt` && payload.urlList.length === 2, "Subpath ownership scope incorrect");
for (const url of ["https://elsewhere.org/", "https://example.org/outside/", `${base}?topic=filter`, `${base}404.html`]) {
  await expectFailure(() => indexNowPayload(base, key, `<loc>${url}</loc>`), url);
}
await expectFailure(() => indexNowPayload(base, key, "<urlset/>"), "empty sitemap");
await expectFailure(() => indexNowPayload("http://example.org/", key, sitemap), "HTTP base");
let submissions = 0;
const fakeFetch = (status: number, proof = key) => async (url: string, options: any) => {
  if (options.method === "POST") {
    submissions++;
    assert(url === "https://api.indexnow.org/indexnow", "Unexpected notification endpoint");
    assert(JSON.stringify(JSON.parse(options.body)) === JSON.stringify(payload), "Incorrect submitted payload");
    return new Response("", { status });
  }
  return new Response(url.endsWith("sitemap.xml") ? sitemap : proof);
};
for (const status of [200, 202]) {
  const result = await notifyIndexNow(base, { fetchImpl: fakeFetch(status), pause: async () => {} });
  assert(result.status === status && result.count === 2, "Acceptance status not preserved");
}
await expectFailure(() => notifyIndexNow(base, { fetchImpl: fakeFetch(429), pause: async () => {} }), "rate limited response");
const before = submissions;
await expectFailure(() => notifyIndexNow(base, { fetchImpl: fakeFetch(200, "wrong key"), pause: async () => {} }), "ownership proof mismatch");
assert(submissions === before, "Submitted URLs before verifying ownership");
console.log("PASS: IndexNow host/subpath boundaries, 200/202 handling, rejection handling and ownership gate; no external requests.");
