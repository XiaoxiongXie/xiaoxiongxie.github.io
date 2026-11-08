// Runs in GitHub's supplied JavaScript runtime; no package installation or visitor script.
import { readFile } from 'node:fs/promises';

export function indexNowPayload(siteUrl, key, sitemap) {
  const base = new URL(siteUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('Expected a public HTTPS site base.');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  if (!/^[a-f0-9]{32}$/.test(key)) throw new Error('Invalid IndexNow verification key.');
  const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  const urlList = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1].trim())))];
  if (!urlList.length || urlList.length > 10000) throw new Error('Sitemap must contain between 1 and 10,000 URLs.');
  for (const value of urlList) {
    const url = new URL(value);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.username || url.password || url.search || url.hash || url.pathname.endsWith('/404.html')) {
      throw new Error(`URL outside the canonical public page set: ${value}`);
    }
  }
  return { host: base.host, key, keyLocation: new URL(`${key}.txt`, base).href, urlList };
}

export async function notifyIndexNow(siteUrl, { fetchImpl = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const key = (await readFile(new URL('../data/indexnow-key.txt', import.meta.url), 'utf8')).trim();
  const base = new URL(siteUrl);
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  // Validate the base/key before requests, and verify the deployed ownership file before submitting.
  const proof = indexNowPayload(base.href, key, `<loc>${base.href}</loc>`);
  const get = async url => {
    const response = await fetchImpl(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    if (response.status !== 200) throw new Error(`HTTP ${response.status} reading ${url}`);
    return response.text();
  };
  for (let attempt = 0; ; attempt++) {
    try {
      if ((await get(proof.keyLocation)).trim() !== key) throw new Error('Published ownership file does not match this checkout.');
      break;
    } catch (error) {
      if (attempt >= 4) throw error;
      await pause(2000 * 2 ** attempt);
    }
  }
  const payload = indexNowPayload(base.href, key, await get(new URL('sitemap.xml', base).href));
  const response = await fetchImpl('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(30000)
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}; notification was not accepted.`);
  return { status: response.status, count: payload.urlList.length, message: response.status === 202 ? 'URLs received; ownership validation pending. This does not mean indexed.' : 'URLs received successfully. This does not mean indexed.' };
}
