# Site RAG chat

The site includes a small sticky **Ask Mattia's site** chat on every page.

## What it does

- Searches the generated `public/rag/index.json` content index on every request.
- Uses only published pages from this site and the `usepayle.com` product link.
- Uses the current path to suggest contextual questions.
- Returns source links with each answer.
- Understands navigation requests such as “open the note about idempotency” and moves the visitor to the matching page.
- Falls back to deterministic local retrieval when no model binding is configured.

The index is regenerated after every build from the exported Markdown cards, so new articles and notes are available automatically after deployment. It is intentionally not a general web search or an external assistant.

## Cloudflare Pages setup

For natural-language answers, add a Workers AI binding to the Pages project:

- binding name: `AI`
- model: `@cf/meta/llama-3.2-1b-instruct`

The RAG implementation remains in `functions/api/chat.ts` as a commented-out future feature. The public Ask Mattia Ciuni AI interface and route are currently disabled site-wide; re-enable them only after reviewing the privacy policy and production limits.

The function never receives provider credentials, newsletter data, or arbitrary browsing requests. It limits questions to 500 characters, retrieves at most four sources, and asks the model to answer only from that context.

## Local checks

`npm run dev` runs Next's browser development server, not Cloudflare Pages Functions. That is why `/api/chat` returns 404 in that mode. To test the complete site, including the RAG Function and its local fallback, use:

```bash
npm run preview
```

Then open `http://localhost:8787/`. This builds the current content first, so newly added Thoughts and Notes are included in `out/` before Wrangler serves them.

For normal UI work, `npm run dev` is still fine. If a page list looks stale after changing a registry, stop the server, remove `.next`, and restart it; the source registries are `lib/posts.ts` and `lib/notes.ts`.

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/verify.js
```

No commit or deployment is required to develop the feature locally. The generated `out/rag/index.json` and `public/rag/index.json` are build artifacts.
