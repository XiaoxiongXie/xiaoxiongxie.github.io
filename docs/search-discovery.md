# Search discovery and submission

Push deployment is disabled; a successful manually confirmed deployment runs the IndexNow notification. Account verification and indexing reports require the owner's Search Console and Bing Webmaster Tools accounts.

Website: <https://xiaoxiongxie.github.io/>. Sitemap: <https://xiaoxiongxie.github.io/sitemap.xml>.

## What the website handles

The public HTML contains the content, descriptive headings, titles, descriptions and structured data. Canonicals and the sitemap use the actual published URL. `robots.txt` allows Googlebot, Bingbot and OAI-SearchBot. The retired About page is excluded from search and the sitemap. Check actual crawl and indexing outcomes in the search consoles.

The workflow now includes an IndexNow notification after deployment. The site publishes its verification file and the workflow sends the canonical URLs from the sitemap to `https://api.indexnow.org/indexnow`. The response is recorded in the Actions summary. This notifies participating search engines, including Bing; receipt is not an indexing decision. Google and ChatGPT Search are handled separately below.

## Google: one-time owner action

1. Sign in to [Google Search Console](https://search.google.com/search-console) using your own account.
2. Choose **Add property → URL prefix** and enter `https://xiaoxiongxie.github.io/`. Use the URL-prefix option: the `github.io` parent DNS belongs to GitHub.
3. Choose **HTML tag** under the verification methods. Store the tag in `includes/search-verification.html`, included in the generated HTML head through `_quarto.yml`. This public ownership token is not a password, login code or analytics script. It must be deployed before verification can succeed.
4. Once the tag is present on the live homepage, click **Verify** in Search Console. Keep the tag in the site permanently while you use this verification method.
5. Select the verified property and open **Sitemaps**. Submit `sitemap.xml` (full URL above if the interface asks for one) and check the processing status.
6. Open **URL inspection**, inspect `https://xiaoxiongxie.github.io/`, and choose **Request indexing**. Prioritise the Research and heat-pump explainer URLs if submitting more pages. The sitemap covers the full public site.
7. Review **Page indexing** and **Performance** later. Allow time for processing; an accepted request does not guarantee inclusion or ranking. Repeated submissions do not force indexing.

Verification and sitemap submission require access to your Google account; they are not completed merely by publishing the sitemap or verification tag. The [official verification instructions](https://support.google.com/webmasters/answer/9008080?hl=en), [sitemap submission instructions](https://support.google.com/webmasters/answer/7451001) and [URL inspection guide](https://support.google.com/webmasters/answer/9012289?hl=en) explain the controls. A sitemap can be discovered from `robots.txt` even before Search Console setup, but submission provides account-level reporting.

## Bing: verify and monitor

1. Sign in to [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Add `https://xiaoxiongxie.github.io/`. If Google is already verified, you may choose **Import from Google Search Console**; review the access Bing requests and select this website. Alternatively choose manual verification and send its `msvalidate.01` HTML meta tag for deployment.
3. Under **Sitemaps**, submit `https://xiaoxiongxie.github.io/sitemap.xml` if it was not imported.
4. Use **URL Inspection** to check the homepage, and the **IndexNow** report to monitor accepted notifications and crawl/index outcomes.

IndexNow notifications can work without a Bing Webmaster Tools account; the account gives you verification, diagnostics and reports. See [Bing's setup guide](https://blogs.bing.com/webmaster/2025/6/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility/), [sitemap help](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed) and [IndexNow protocol](https://www.indexnow.org/documentation). Import only this site if choosing the Google Search Console route; manual HTML-tag verification remains an alternative.

## AI search and training preferences

The owner's preference, confirmed on **9 November 2026**, is to remain discoverable while opting out of AI training. The source policy uses the provider controls below. Deployment and recrawling are required before providers can discover changes; these settings are not a claim that every provider has applied them.

| Provider | Search/retrieval | Training preference and scope |
| --- | --- | --- |
| OpenAI | Allow `OAI-SearchBot` and `ChatGPT-User` | Disallow `GPTBot`. Search and training controls are independent. |
| Anthropic | Allow `Claude-SearchBot` and `Claude-User` | Disallow `ClaudeBot`. This applies to future training collection under Anthropic's policy. |
| Perplexity | Allow `PerplexityBot` and `Perplexity-User` | Its documentation describes these as search/user-retrieval agents, not foundation-model training crawlers. |
| Google | Keep `Googlebot` allowed | Disallow `Google-Extended`. This also restricts grounding in Gemini Apps and specified Vertex AI services, but does not affect Google Search inclusion or ranking. |
| Apple | Keep `Applebot` allowed | Disallow `Applebot-Extended`, the separate generative-model training control. |
| Common Crawl | Disallow `CCBot` | Exclude future collection into its public corpus, which is also used by third parties for model training. |

Provider references checked on 9 November 2026: [OpenAI](https://developers.openai.com/api/docs/bots), [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended), [Apple](https://support.apple.com/en-gb/119829), [Common Crawl controls](https://www.commoncrawl.org/ccbot) and [corpus uses](https://www.commoncrawl.org/about).

### Bing / Copilot transition

The Bing-only meta tag in `includes/ai-preferences.html` combines `noarchive`, `ai-training:disallow` and `ai-grounding:allow`. **As of 9 November 2026**, `noarchive` is the current training opt-out and also excludes content from Bing's AI answers; ordinary Bing search remains available. Do not add `nocache`: it weakens that exclusion. See [Microsoft's current controls](https://blogs.bing.com/webmaster/2023/9/Announcing-new-options-for-webmasters-to-control-usage-of-their-content-in-Bing-Chat/).

Microsoft says the independent controls begin **1 February 2027**, on recrawl, superseding legacy tags when detected. The prepared setting then rejects training and permits grounding. Do not claim it is effective today. The owner wants grounding allowed, so no temporary grounding restriction is requested in Bing Webmaster Tools. See [Microsoft's transition dates and controls](https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/).

### Shared preference and limitations

`User-agent: __usage_ai-training` with `Disallow: /` supplements the explicit provider groups. This is an emerging shared usage signal, not a universally implemented crawler identity. Anthropic announced a gradual rollout from 30 October 2026; Microsoft specifies February 2027, and [Google plans support in 2027](https://developers.google.com/search/blog/2026/10/ai-training-control). Keep provider-specific controls for current coverage.

These signals rely on provider compliance. They cannot prevent every scraper, revoke already acquired copies or govern copies hosted by publishers, institutional repositories and other third parties. A user-triggered page visit is also distinct from search indexing. No general ChatGPT/Claude submission portal or guaranteed inclusion mechanism is established by the cited crawler documentation; preserve accurate content, the sitemap and genuine academic profile links.

## Genuine academic links and follow-up

Where you can edit your existing institutional profile, ORCID record and GitHub profile, add the homepage as your personal academic website. This helps people and crawlers follow a consistent identity across genuine sources. Do not create artificial backlinks or promotional claims. Editing institutional/ORCID profiles requires your account access and is not part of the automated website deployment.

Use the search consoles' inspection reports to distinguish **discovered**, **crawled** and **indexed**. A `site:` search can be a quick secondary check, but missing results alone do not establish an indexing problem. No indexing deadline or recommendation by an AI system is guaranteed.
