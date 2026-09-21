import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";

export const dynamic = "force-static";

export async function GET() {
  const base = site.url.replace(/\/$/, "");
  const thoughtLinks = posts
    .map((p) => `- [${p.title}](${base}/thoughts/${p.slug}/)`)
    .join("\n");
  const noteLinks = notes
    .map((n) => `- [${n.title}](${base}/notes/${n.slug}/)`)
    .join("\n");

  const text = `# Mattia Ciuni

> Founder & CEO of Payle, the money layer for AI agents. Personal site with bio, live Milan time, principles, now, projects, short thoughts and long-form notes on AI agents, payments and the craft of software.

## Home
- [Home](${base}/): bio, principles, now, projects, thoughts and notes.

## Thoughts
- [Thoughts](${base}/thoughts/): short posts on AI agents, payments and building Payle.
${thoughtLinks}

## Notes
- [Notes](${base}/notes/): longer, slower pieces on the philosophy of building software.
${noteLinks}

## Field notes
- [Voice Notes](${base}/voice-notes/): spoken thoughts, to be published when they are ready.
- [Videos](${base}/videos/): a visual log of building Payle, also published when ready.

## Cards
Every page has a concise machine-readable card in markdown at the same path with .md: [home](${base}/index.md), [thoughts](${base}/thoughts.md), [notes](${base}/notes.md), e.g. [this post](${base}/thoughts/money-layer-for-ai-agents.md).

## Contact
- [Email](mailto:${site.email})
- [Payle](${site.payleUrl}): the money layer for AI agents.
`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}