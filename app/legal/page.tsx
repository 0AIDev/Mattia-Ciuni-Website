import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "Legal Center | Privacy, Terms and Cookies";
const card = socialImages("/og.png", "Legal Center | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Legal Center | Privacy, Terms and Cookies",
  description:
    "Privacy, terms, and cookies for Mattia Ciuni's website: the newsletter, feedback submissions, and the analytics you control.",
  alternates: { canonical: "/legal/", languages: languageAlternates("/legal/") },
  openGraph: {
    type: "website",
    url: "/legal/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Privacy, terms, and cookies for Mattia Ciuni's website: the newsletter, feedback submissions, and the analytics you control.",
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: card.twitter },
};

const sections: LegalSection[] = [
  {
    id: "documents",
    title: "Documents",
    content: (
      <ul className="m-0 list-none space-y-3 p-0">
        <li>
          <Link href="/privacy/" className="article-underline">
            Privacy Policy
          </Link>
          <span className="text-gray-1000"> · what is collected, who processes it, how long it is kept, your rights</span>
        </li>
        <li>
          <Link href="/terms/" className="article-underline">
            Terms of Service
          </Link>
          <span className="text-gray-1000"> · the rules for reading, citing, subscribing and sending feedback</span>
        </li>
        <li>
          <Link href="/cookies/" className="article-underline">
            Cookies
          </Link>
          <span className="text-gray-1000"> · every value stored in your browser, listed by its real name</span>
        </li>
      </ul>
    ),
  },
  {
    id: "what-this-site-does",
    title: "What this site does with your data",
    content: (
      <p>
        Three things are optional: the newsletter stores your email address together with the source you arrived from;
        the feedback form stores your message and, if you add them, your name and email; Google Analytics is off until
        you allow it, and when it is on it measures pages, how you arrived, how long a page stayed open, how far you
        scrolled, and where you went next. Beside them a cookieless counter (Umami) records visits while storing nothing
        about you at all, which is why it asks nothing and the notice never mentions it. Nothing is sold, nothing is
        shared with advertisers, and there are no social pixels.
      </p>
    ),
  },
  {
    id: "machine-readable",
    title: "Reading it with machines",
    content: (
      <p>
        The site is public and meant to be read by agents as well as people: every page has a markdown card,{" "}
        <a href="/llms.txt" className="article-underline">
          /llms.txt
        </a>{" "}
        summarises the site in one fetch, and the discovery files explain how to cite it. Crawling and training are
        permitted, with attribution. The details are in the{" "}
        <Link href="/terms/" className="article-underline">
          Terms of Service
        </Link>
        .
      </p>
    ),
  },
  {
    id: "questions",
    title: "Questions",
    content: (
      <p>
        If something is unclear, or you want data removed, email{" "}
        <a href={`mailto:${site.email}`} className="article-underline">
          {site.email}
        </a>
        .
      </p>
    ),
  },
];

export default function LegalCenterPage() {
  return (
    <LegalPage
      title="Legal Center"
      intro="The short, honest version of how this site is run: what it collects, what you agree to, and what it stores in your browser."
      sections={sections}
    />
  );
}
