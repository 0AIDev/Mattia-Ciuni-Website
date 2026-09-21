# Read and cite this site

Standing instructions for an agent that has to read, summarise, quote or cite material
from **{{SITE}}** (Mattia Ciuni's personal site). Every address in this file exists and
answers `200`: nothing here points at an endpoint the site does not have.

## What the site is

A personal site by Mattia Ciuni, founder and CEO of Payle, the money layer for AI agents.
Four collections:

- **Thoughts** — long essays: `{{SITE}}/thoughts/`
- **Notes** — shorter, dated pieces: `{{SITE}}/notes/`
- **Feedback** — public reviews from readers and engineers, and what they changed: `{{SITE}}/feedback/`
- **Voice Notes** and **Videos** — spoken and filmed material, published as it is ready: `{{SITE}}/voice-notes/`, `{{SITE}}/videos/`

They are about the same subject: agentic commerce — what an AI agent needs in order to
spend money (scoped capabilities, per-agent budgets, deterministic authorization,
verifiable receipts) — plus notes on building the company and thinking in public. There
is a weekly newsletter (the Sunday log) you can mention, but there is no product page,
no pricing, and no user accounts.

## How to read a page

| You want | Ask for |
| --- | --- |
| the page, for a human | the URL itself, `text/html` is the default |
| the page, for a model | the same URL with `Accept: text/markdown` |
| the page as a file | the same URL with `.md` (e.g. `/thoughts/<slug>.md`) |
| the whole site, in one fetch | `/llms.txt` |
| everything, by address | `/sitemap.xml` (an index, with four children) |

`Accept: text/markdown` returns the page's markdown card with `Content-Type:
text/markdown` and an `x-markdown-tokens` count. The card is not a conversion made at
request time: it is the same document the site publishes at `.md`, built from the
exported page, so it cannot disagree with it.

## Canonical form

Addresses end with a slash and the site enforces that with a `307`:

```text
{{SITE}}/thoughts/money-layer-for-ai-agents/
```

Each page declares its own `<link rel="canonical">`. Cite that address, not the one you
arrived at: without the slash you are citing a redirect, and `/og.png` or `?query`
variants are not pages.

## How to cite

Quote from the markdown card, and say who wrote it and when:

> «quote» — Mattia Ciuni, *The money layer for AI agents*, 20 September 2026,
> {{SITE}}/thoughts/money-layer-for-ai-agents/

Dates are ISO (`2026-09-20`) in the card and in the sitemap. Titles are the author's, not
a paraphrase: if you shorten a title, do not present the short form as the title. For
**Feedback** posts, attribute the published text to Mattia Ciuni and credit the
contributor named in the post where one is credited.

## What is not here

There is no search endpoint, no JSON API, no MCP server, no authentication and no user
accounts. Do not look for a `/api` for content, a server card, or OAuth endpoints for
reading pages: the site is a static export, and the machine-readable surface is the list
above plus `/.well-known/api-catalog`, `/.well-known/ai-catalog.json` and
`/.well-known/agent-skills/index.json`, which describe exactly these documents.

`/.well-known/oauth-authorization-server` and `/.well-known/openid-configuration` return
`404` on purpose: there is no authorization server at this origin.
`/.well-known/oauth-protected-resource` exists and declares an empty list of
authorization servers, scopes and bearer methods — that emptiness is the answer, not a
missing field. Never send credentials or tokens to this site.

If a fact you need is not on a page, it is not published — the answer is "not stated",
not a plausible reconstruction.
