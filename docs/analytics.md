# Cloudflare Web Analytics

Cloudflare Web Analytics is the site's only analytics provider. GitHub Pages remains the host. This guide covers configuration, privacy controls and maintenance; dashboard access remains private.

## Account and setup

1. Sign up at <https://dash.cloudflare.com/sign-up> or use an existing account. A long-term personal email avoids depending on an employer's account. GitHub social login is supported, but Cloudflare documents that changing the GitHub primary email affects that login route. Account creation, email verification and authentication remain with the owner.
2. In the account dashboard, open **Web Analytics** (use dashboard search if needed), then **Add a site**.
3. Enter the hostname `xiaoxiongxie.github.io` without a scheme or path, then **Done**.
4. Open **Manage site** and copy the JavaScript snippet. This site uses manual installation for a site not proxied through Cloudflare. Do not onboard DNS, buy a domain, connect the GitHub repository or create a Cloudflare Pages project.
5. Save only its `data-cf-beacon` token in `data/analytics.json`. It is a public site identifier embedded in HTML, not an API credential. `null` disables both the integration and its generated disclosure.
6. Build, validate, review, then publish using the existing manual GitHub Actions process when the owner requests publication. Creating a Cloudflare entry alone does not install the beacon.

Official references, checked 10 November 2026:
- [Cloudflare account login](https://developers.cloudflare.com/fundamentals/user-profiles/login/)
- [Manual Web Analytics installation](https://developers.cloudflare.com/web-analytics/get-started/)
- [Module beacon and disabling SPA measurement](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)

## Privacy and scope

The Quarto pre-render hook generates a deferred local loader with the public token and `site-url`. It loads only Cloudflare's official `https://static.cloudflareinsights.com/beacon.min.js` module, with `spa: false` for this multi-page site. No other third-party scripts, fonts, widgets or analytics are allowed.

The loader checks the exact HTTPS origin and site base path before any Cloudflare request. Local previews, alternate hosts, error/redirect pages with `noindex`, and the existing privacy/preferences page do not load the beacon. That preferences page therefore does not send an analytics event when someone changes their choice.

The existing Accessibility & privacy page contains a short disclosure, provider/privacy links and a keyboard-accessible opt-out. No new page or consent banner was added. The local loader honours Global Privacy Control and Do Not Track as additional privacy choices. It stores only an explicitly selected opt-out (`off`) in localStorage, scoped to the site base URL. Re-enabling removes that value. Clearing browser storage resets this choice; it does not apply across browsers or devices. Choices govern subsequent page loads, and do not erase data already received. If storage cannot be read, analytics remain off.

Cloudflare describes its Web Analytics as cookie-free and without visitor fingerprinting. The beacon still makes third-party network requests and sends page/referrer and performance information for processing; do not describe it as collecting no data. Use the aggregate reports only to understand and improve this website, not to identify visitors or profile individuals.

The UK ICO's current statistical-purpose exception is conditional: it requires clear information and a simple, free means to object. Cookie-free does not by itself remove transparency obligations or resolve every jurisdiction's requirements. Keep this implementation-specific review here rather than adding lengthy legal commentary to public research pages.

- [Cloudflare Web Analytics privacy approach](https://www.cloudflare.com/web-analytics/)
- [Beacon fields and processing](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [ICO: statistical purposes exception](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)

## Validation and deployment check

Run with Quarto's bundled Deno; no extra package installation is required:

```powershell
.\.tools\quarto\bin\quarto.cmd render
.\.tools\quarto\bin\quarto.cmd run scripts/validate.ts
.\.tools\quarto\bin\quarto.cmd run scripts/check-analytics.ts
```

Check the existing privacy page at desktop and mobile widths. Confirm that local preview makes no request to `static.cloudflareinsights.com` or `cloudflareinsights.com`. The offline safeguards test exercises the real loader without executing the remote beacon, including production/subpath eligibility, opt-out persistence, storage failures and privacy signals. It creates no real analytics traffic.

After an authorised deployment, check the public HTML for the configured local loader. Visit a public content page normally and check Web Analytics for the first report; Cloudflare says data can take a few minutes to appear. Dashboard receipt requires the owner's account and cannot be inferred from an HTTP 200 for the script alone. Script blocking, privacy choices and failed requests can reduce counts; do not repeatedly generate test visits to make the totals rise.

In Cloudflare Web Analytics, select this hostname and date range. **Page views** counts measured page loads; **Visits** uses incoming referrer/navigation events and is not a deduplicated count of people. The private dashboard can also show popular pages, referrers and performance information. Do not publish dashboard access or account credentials.

- [Metric definitions](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)
- [Known limits, blockers and data retention](https://developers.cloudflare.com/web-analytics/faq/)

## Disable or change

Set `cloudflareToken` to `null`, rebuild and validate, then publish the change. The generated loader, disclosure and preference control disappear together. Site content, hosting and search/training crawler rules are independent of this setting. Switching to another hostname requires updating the Cloudflare site registration as well as Quarto's `site-url`.
