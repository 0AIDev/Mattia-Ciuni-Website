# SEO page-by-page audit

Generated from the static export on 2026-09-22. This is the repository/export audit. Run node scripts/audit-seo.mjs --site=https://mattiaciuni.pages.dev after deployment for a network-level check; DNS, Cloudflare headers, cache and Search Console are not provable from the export alone.

## Executive summary

The audit found **24 public HTML pages**. Every public page is checked for a title, canonical, Open Graph image, H1, structured data, image alt text and sitemap membership. The admin area is intentionally excluded from indexing and from this table. A CHECK is a prompt for review, not an automatic ranking failure: empty content pages such as Videos and Voice Notes can legitimately have no item-level schema when they are awaiting recordings.

## Page inventory

| URL | title | canonical | schema | OG image | sitemap | images/alt | internal links |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [/about/](/about/) | PASS About Mattia Ciuni | Founder &amp; CEO of Payle | Mattia C | PASS | PASS ProfilePage | PASS | PASS | 0 / all alt | 16 |
| [/cookies/](/cookies/) | PASS Cookies Policy | Browser storage on this site | Mattia Ciu | PASS | CHECK none | PASS | CHECK | 0 / all alt | 16 |
| [/feedback/a-stranger-redesigned-my-pitch-in-one-comment/](/feedback/a-stranger-redesigned-my-pitch-in-one-comment/) | PASS A stranger redesigned my pitch in one comment | Mattia Ciu | PASS | PASS Article, BreadcrumbList | PASS | PASS | 0 / all alt | 16 |
| [/feedback/](/feedback/) | PASS Feedback on Payle | Mattia Ciuni | PASS | PASS Blog | PASS | PASS | 0 / all alt | 17 |
| [/](/) | PASS Mattia Ciuni | Founder, CEO of Payle and AI Payments Build | PASS | PASS Person, WebSite, Organization | PASS | PASS | 9 / all alt | 29 |
| [/legal/](/legal/) | PASS Legal Center | Privacy, Terms and Cookies | Mattia Ciuni | PASS | CHECK none | PASS | CHECK | 0 / all alt | 17 |
| [/notes/about-the-name/](/notes/about-the-name/) | PASS About the name | Mattia Ciuni | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 21 |
| [/notes/honestly-im-excited/](/notes/honestly-im-excited/) | PASS Honestly? I&#x27;m excited. | Mattia Ciuni | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 21 |
| [/notes/idempotent-payments-for-ai-agents/](/notes/idempotent-payments-for-ai-agents/) | PASS Why AI agents need idempotent payments | Mattia Ciuni | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 22 |
| [/notes/](/notes/) | PASS Notes on AI, payments and software | Mattia Ciuni | PASS | CHECK none | PASS | PASS | 8 / all alt | 24 |
| [/notes/on-boring-systems/](/notes/on-boring-systems/) | PASS On boring systems | Mattia Ciuni | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 21 |
| [/notes/the-agentic-economy-is-a-trust-problem/](/notes/the-agentic-economy-is-a-trust-problem/) | PASS The agentic economy is a trust problem, not a technology p | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 22 |
| [/notes/the-moment-my-ai-agent-asked-for-my-credit-card/](/notes/the-moment-my-ai-agent-asked-for-my-credit-card/) | PASS The moment my AI agent asked for my credit card | Mattia C | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 22 |
| [/notes/what-a-security-audit-taught-me/](/notes/what-a-security-audit-taught-me/) | PASS The wall in my code: what a security audit taught me that  | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 21 |
| [/notes/what-interviews-teach-me-about-people-and-my-own-company/](/notes/what-interviews-teach-me-about-people-and-my-own-company/) | PASS What interviews teach me about people (and my own company) | PASS | PASS Article, BreadcrumbList | PASS | PASS | 1 / all alt | 22 |
| [/privacy/](/privacy/) | PASS Privacy Policy | What I collect and why | Mattia Ciuni | PASS | CHECK none | PASS | CHECK | 0 / all alt | 16 |
| [/terms/](/terms/) | PASS Terms of Service | Reading and newsletter rules | Mattia C | PASS | CHECK none | PASS | CHECK | 0 / all alt | 18 |
| [/thoughts/artifact-based-hiring/](/thoughts/artifact-based-hiring/) | PASS Artifact-based hiring: ship code before titles | Mattia Ci | PASS | PASS BlogPosting, BreadcrumbList | PASS | PASS | 1 / all alt | 21 |
| [/thoughts/finding-ghassen-the-co-founder-question-answered-in-three-weeks/](/thoughts/finding-ghassen-the-co-founder-question-answered-in-three-weeks/) | PASS Finding Ghassen: the co-founder question, answered in thre | PASS | PASS BlogPosting, BreadcrumbList | PASS | PASS | 1 / all alt | 22 |
| [/thoughts/](/thoughts/) | PASS Thoughts on AI agents and payments | Mattia Ciuni | PASS | PASS Blog | PASS | PASS | 0 / all alt | 19 |
| [/thoughts/money-layer-for-ai-agents/](/thoughts/money-layer-for-ai-agents/) | PASS The money layer for AI agents | Mattia Ciuni | PASS | PASS BlogPosting, BreadcrumbList | PASS | PASS | 1 / all alt | 24 |
| [/videos/](/videos/) | PASS Videos | Building Payle in public | Mattia Ciuni | PASS | PASS CollectionPage | PASS | PASS | 0 / all alt | 16 |
| [/voice-notes/](/voice-notes/) | PASS Voice Notes | Spoken, unedited | Mattia Ciuni | PASS | CHECK none | PASS | PASS | 0 / all alt | 16 |
| [/work/](/work/) | PASS Work by Mattia Ciuni | Payle, Celeste and AI Payments | Ma | PASS | PASS CollectionPage | PASS | PASS | 0 / all alt | 16 |

## What to fix first

1. **Keep the homepage and `/work/` as entity hubs.** They should explain the relationship between Mattia Ciuni, Payle, Celeste and the real subjects of the writing. Do not create thin pages for every keyword permutation.
2. **Keep article URLs stable.** A title change does not justify changing a slug. If a URL must move, add a permanent redirect and update the canonical, sitemap, feed and internal links together.
3. **Use one primary intent per article.** A pillar can mention many related terms, but supporting pieces should answer a narrower real question and link back to the pillar with descriptive anchor text.
4. **Validate the live origin.** Run the live audit after each production deploy and inspect the homepage, /work/, one Thought, one Note, /feedback/, /robots.txt, /sitemap.xml and /.well-known/security.txt from the actual domain.
5. **Use Search Console for indexing, not invented automation.** Submit the sitemap, inspect representative URLs, and request indexing only for genuinely new or materially updated pages. No script can force a first position.

## Schema and entity plan

The homepage and About page are the authoritative Person surfaces. The Work page is a CollectionPage and ItemList connecting Payle and Celeste to the real work. Thoughts and Notes should remain Article or BlogPosting pages with Mattia as author, stable dates and related links. Feedback is a public record of user perspective, not a claim that every contributor is an employee or co-author. Keep sameAs limited to profiles actually controlled by Mattia; never add a profile merely because a keyword strategy would benefit from it.

## Verification commands

Commands:
npm run build
node scripts/audit-seo.mjs
node scripts/check-live.mjs --site=https://mattiaciuni.pages.dev
node scripts/verify.js


The live checker verifies DNS, sitemap child maps, page status, canonical ownership and OG image reachability. Search Console coverage, external backlinks, Core Web Vitals from real users and Google ranking remain external measurements.
