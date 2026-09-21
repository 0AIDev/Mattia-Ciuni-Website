import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { feedback } from "@/lib/feedback";

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

> Mattia Ciuni is an Italian founder and the founder and CEO of Payle, the money layer for AI agents. He previously built Celeste, an AI browser. This personal site answers who Mattia Ciuni is and what Mattia Ciuni does: building payments infrastructure for software that acts on behalf of people.

## About Mattia Ciuni
- [Mattia Ciuni](${base}/): founder and CEO of Payle, working on AI agents, agentic commerce, payments infrastructure and fintech.
- Common searches: who is Mattia Ciuni, what does Mattia Ciuni do, Mattia Ciuni Payle, CEO of Payle.

## Home
- [Home](${base}/): bio, principles, now, projects, thoughts and notes.
- [About Mattia Ciuni](${base}/about/): identity, work, Payle and the background behind the site.

## Thoughts
- [Thoughts](${base}/thoughts/): short posts on AI agents, payments and building Payle.
${thoughtLinks}

## Notes
- [Notes](${base}/notes/): longer, slower pieces on the philosophy of building software.
${noteLinks}

## Feedback
- [Feedback](${base}/feedback/): public exchanges where engineers attacked Payle's architecture, and what the attacks changed. Readers can send their own feedback by email; it gets reviewed, and if it holds, it gets published.
${feedback.map((f) => `- [${f.title}](${base}/feedback/${f.slug}/)`).join("\n")}

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