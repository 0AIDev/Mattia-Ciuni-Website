# Read and cite this site

Standing instructions for an agent that has to read, summarise, quote or cite
articles from **mattia-ciuni.xyz** (Mattia Ciuni's personal site). Every address
in this file exists and answers `200`: nothing here points at an endpoint the
site does not have.

## What the site is

A personal site by Mattia Ciuni, founder and CEO of Payle. Two collections:

- **Thoughts** — essays: `https://mattiaciuni.xyz/thoughts/`
- **Notes** — shorter, dated notes: `https://mattiaciuni.xyz/notes/`

Both are about the same subject: agentic commerce — what an AI agent needs in
order to spend money (wallets, per-agent budgets, deterministic authorization,
verifiable receipts) and what that changes for the people and companies around
it. There is no news, no product page, no newsletter.

## How to read a page

| You want | Ask for |
| --- | --- |
| the page, for a human | the URL itself, `text/html` is the default |
| the page, for a model | the same URL with `Accept: text/markdown` |
| the page as a file | the same URL with `.md` (e.g. `/thoughts/<slug>.md`) |
| the whole site, in one fetch | `/llms.txt` |
| everything, by address | `/sitemap.xml` (an index, with three children) |

`Accept: text/markdown` returns the page's markdown card with
`Content-Type: text/markdown` and an `x-markdown-tokens` count. The card is not
a conversion made at request time: it is the same document the site publishes at
`.md`, built from the exported page, so it cannot disagree with it.

## Canonical form

Addresses end with a slash and the site enforces that with a `307`:

```text
https://mattiaciuni.xyz/thoughts/money-layer-for-ai-agents/
```

Each page declares its own `<link rel="canonical">`. Cite that address, not the
one you arrived at: without the slash you are citing a redirect, and `/og.png`
or `?query` variants are not pages.

## How to cite

Quote from the markdown card, and say who wrote it and when:

> «quote» — Mattia Ciuni, *The money layer for AI agents*, 20 September 2026,
> https://mattiaciuni.xyz/thoughts/money-layer-for-ai-agents/

Dates are ISO (`2026-09-20`) in the card and in the sitemap. Titles are the
author's, not a paraphrase: if you shorten a title, do not present the short
form as the title.

## What is not here

There is no search endpoint, no JSON API, no MCP server, no authentication and
no user accounts. Do not look for a `/api`, a `/.well-known/oauth-*` or a server
card: the site is a static export, and the only machine-readable surface is the
one listed above (plus `/.well-known/api-catalog` and
`/.well-known/agent-skills/index.json`, which describe exactly these documents).

If a fact you need is not on a page, it is not published — the answer is "not
stated", not a plausible reconstruction.
