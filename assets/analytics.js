// Optional Cloudflare Web Analytics. All network access is gated locally first.
(() => {
  "use strict";
  const source = document.currentScript;
  const token = source?.dataset.cloudflareToken;
  if (!token || !/^[a-f0-9]{32}$/i.test(token)) return;
  let site;
  try { site = new URL(source.dataset.siteUrl); } catch { return; }
  const liveSite = site.protocol === "https:" && location.origin === site.origin && location.pathname.startsWith(site.pathname);
  const preferenceKey = `xx-analytics:${site.origin}${site.pathname}`;
  const browserOptOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";
  let storageAvailable = true;
  function enabled() {
    try { return !browserOptOut && localStorage.getItem(preferenceKey) !== "off"; }
    catch { storageAvailable = false; return false; }
  }
  const toggle = document.getElementById("analytics-toggle");
  const status = document.getElementById("analytics-status");
  function updateControl() {
    const on = enabled();
    if (!toggle || !status) return;
    toggle.hidden = false;
    toggle.disabled = browserOptOut || !storageAvailable;
    toggle.textContent = on ? "Turn off analytics in this browser" : "Turn on analytics in this browser";
    status.textContent = browserOptOut ? "Analytics are off because of your browser’s privacy preference."
      : !storageAvailable ? "Analytics are off because this browser cannot access preferences."
      : !liveSite ? "Analytics stay off during local preview."
      : on ? "Analytics are on. Your choice is saved in this browser."
      : "Analytics are off. Your choice is saved in this browser.";
  }
  updateControl();
  toggle?.addEventListener("click", () => {
    try {
      if (enabled()) localStorage.setItem(preferenceKey, "off");
      else localStorage.removeItem(preferenceKey);
    } catch { storageAvailable = false; }
    updateControl();
  });
  // Keep an open preferences page in sync with other tabs.
  window.addEventListener("storage", event => {
    if (event.key === preferenceKey || event.key === null) updateControl();
  });
  // The preferences page never loads the beacon, so changing one's choice
  // cannot itself trigger a measurement. Redirects and error pages are excluded.
  const noindex = /\bnoindex\b/i.test(document.querySelector('meta[name="robots"]')?.content || "");
  if (!liveSite || toggle || noindex || !enabled()) return;
  if (document.querySelector("script[data-cf-beacon]")) return;
  const beacon = document.createElement("script");
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.setAttribute("data-cf-beacon", JSON.stringify({ token, spa: false }));
  document.head.appendChild(beacon);
})();
