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

> Mattia Ciuni is an Italian founder and the founder and CEO of Know Computer, a personal context layer for the AI era. He previously built Celeste, an AI browser, and worked on financial infrastructure for AI agents through Payle, Ceilya and Noesia; that work continues through Know Layer. This personal site answers who Mattia Ciuni is and what Mattia Ciuni does: building context and intelligence layers for computers and AI.

## About Mattia Ciuni
- [Mattia Ciuni](${base}/): founder and CEO of Know Computer, working on personal context, memory, intelligence augmentation and controlled actions for AI.
- Common searches: who is Mattia Ciuni, what does Mattia Ciuni do, Mattia Ciuni Know Computer, CEO of Know Computer.

## Home
- [Home](${base}/): bio, principles, now, projects, thoughts and notes.
- [About Mattia Ciuni](${base}/about/): identity, work, Know Computer and the background behind the site.
- [Work by Mattia Ciuni](${base}/work/): the relationship between Know Computer, Celeste, Payle, Ceilya, Noesia and the topics Mattia writes about.

## Thoughts
- [Thoughts](${base}/thoughts/): short posts on context, AI and building in public.
${thoughtLinks}

## Notes
- [Notes](${base}/notes/): longer, slower pieces on the philosophy of building software.
${noteLinks}

## Feedback
- [Feedback](${base}/feedback/): public exchanges where engineers attacked the architecture in public, and what the attacks changed. Readers can send their own feedback by email; it gets reviewed, and if it holds, it gets published.
${feedback.map((f) => `- [${f.title}](${base}/feedback/${f.slug}/)`).join("\n")}

## Field notes
- [Voice Notes](${base}/voice-notes/): spoken thoughts, to be published when they are ready.
- [Videos](${base}/videos/): a visual log of building, thinking and changing my mind, also published when ready.

## Cards
Every page has a concise machine-readable card in markdown at the same path with .md: [home](${base}/index.md), [thoughts](${base}/thoughts.md), [notes](${base}/notes.md), e.g. [this post](${base}/thoughts/money-layer-for-ai-agents.md).

## Contact
- [Email](mailto:${site.email})
- [Know Computer](${site.companyUrl}): a personal context layer for the AI era.
`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}