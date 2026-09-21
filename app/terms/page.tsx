import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";

const pageTitle = "Terms of Service | Mattia Ciuni";
const card = socialImages("/og.png", "Terms of Service | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Terms of Service | Reading and newsletter rules",
  description:
    "Terms for using Mattia Ciuni's website: reading and citing the content, the newsletter, feedback submissions and the AI chat.",
  alternates: { canonical: "/terms/" },
  openGraph: {
    type: "website",
    url: "/terms/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Terms for using Mattia Ciuni's website: reading and citing the content, the newsletter, feedback submissions and the AI chat.",
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: card.twitter },
};

const sections: LegalSection[] = [
  {
    id: "using-the-site",
    title: "Using the site",
    content: (
      <p>
        This is a personal publishing site by Mattia Ciuni. You can read it, link to it, quote it and share it. You do
        not need an account, there is nothing to buy, and there is no paywall. What follows is the short version of the
        rules for the few things you can do here beyond reading.
      </p>
    ),
  },
  {
    id: "content-and-ai",
    title: "The content, and using it with AI",
    content: (
      <>
        <p>
          Everything published here is{" "}
          <strong>© Mattia Ciuni, all rights reserved</strong>. Quote it with attribution, link to the original, and do
          not republish whole articles as your own or sell them. Machine-readable versions exist on purpose: every page
          has a markdown card at the same address with <code className="font-mono text-[13px]">.md</code>, the whole
          site is summarised in{" "}
          <a href="/llms.txt" className="article-underline">
            /llms.txt
          </a>
          , and the discovery files describe how to cite it correctly.
        </p>
        <p>
          Crawling and training are deliberately permitted: the site declares{" "}
          <code className="font-mono text-[13px]">Content-Signal: ai-train=yes, search=yes, ai-input=yes</code> in{" "}
          <a href="/robots.txt" className="article-underline">
            /robots.txt</a>, because the writing is meant to circulate. What I ask in return is simple: state where the
          words came from. A model answering about my work should cite the page, not reproduce the whole page, and
          should not present a paraphrase as a quotation.
        </p>
      </>
    ),
  },
  {
    id: "newsletter",
    title: "The newsletter",
    content: (
      <p>
        Subscribing is optional and free. Your address joins the subscriber list, a Welcome email is sent right after
        signup, and one email a week follows. Unsubscribing takes one click in any email. I may pause or change the
        newsletter, but I will not use your address for unrelated marketing, and I will never sell it. What is stored
        and who processes it is described in the{" "}
        <Link href="/privacy/" className="article-underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: "feedback-submissions",
    title: "Feedback submissions",
    content: (
      <>
        <p>
          When you send feedback through the form, you keep the words: they stay yours. You also give me permission to
          publish that text on this site, in full or in part, after review, keeping it in your voice and crediting you
          as your name, your name with a link, or an initial, whichever you choose.
        </p>
        <p>
          Send only what is yours to send: no third-party confidential material, no personal data about other people,
          nothing unlawful or abusive, no advertising. I read everything and publish selectively; publishing is not
          automatic and not guaranteed. I can decline or remove a submission, and you can ask me to delete yours at any
          time, whether or not it has been published. A submission is not a contract, a job application, or confidential
          correspondence: if you are working on something sensitive, open a conversation by email first.
        </p>
      </>
    ),
  },
  {
    id: "ai-chat",
    title: "The AI chat",
    content: (
      <p>
        Ask Mattia Ciuni AI answers questions about this site and about Payle using the published content, and it can be
        wrong, incomplete or out of date. It is a reading aid, not a source of truth, not advice, and not a channel for
        anything confidential. Its history stays in your browser. Use it as a starting point, then read the page it
        points you to.
      </p>
    ),
  },
  {
    id: "no-advice",
    title: "No advice, and whose views these are",
    content: (
      <p>
        Articles and notes are personal writing for information and discussion. They are not financial, legal,
        investment or tax advice, and nothing here is an offer to buy or sell anything. This is my personal site: the
        opinions are mine, and what I write about Payle is my own view as its founder, not a company statement or a
        commitment on Payle&apos;s behalf. Links to other sites are provided for context and those sites have their own
        terms.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    content: (
      <p>
        I work to keep the site available and accurate, and I edit pages when something is wrong or outdated. I cannot
        promise that every page, link or feature will always be available or error-free, and features like the AI chat
        may change or be removed. Material corrections are visible in the page itself rather than hidden in a changelog.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    content: (
      <p>
        The site is provided as it is. To the extent the law allows, I am not liable for decisions taken on the basis of
        what you read here, for interruptions in availability, or for damage caused by third-party services the site
        links to or relies on. Nothing in these terms limits rights you have as a consumer where the law grants them.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    content: (
      <p>
        These terms are governed by Italian law, and the courts of Italy have jurisdiction, without prejudice to the
        protection your local consumer law gives you. If a clause turns out to be unenforceable, the rest stays in
        force.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these terms, a takedown request, or a correction can go to{" "}
        <a href={`mailto:${site.email}`} className="article-underline">
          {site.email}
        </a>
        . The other documents are in the{" "}
        <Link href="/legal/" className="article-underline">
          Legal Center
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for reading this site, subscribing to the newsletter, sending feedback and using the AI chat. Short, because there is not much to it."
      sections={sections}
    />
  );
}
