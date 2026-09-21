import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";

const pageTitle = "Cookies Policy | Mattia Ciuni";
// La card si dichiara con lo stesso helper del resto del sito: mancava il `type`,
// quindi l'`og:image:type` non arrivava nell'HTML e la card era incompleta.
const card = socialImages("/og.png", "Cookies Policy | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Cookies Policy | Browser storage on this site",
  description:
    "Every cookie, local storage key and session value this site uses, what each one is for, and how to change your choice.",
  alternates: { canonical: "/cookies/" },
  openGraph: {
    type: "website",
    url: "/cookies/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "Every cookie, local storage key and session value this site uses, what each one is for, and how to change your choice.",
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: card.twitter },
};

function StorageList({ items }: { items: { name: string; body: string }[] }) {
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {items.map((item) => (
        <li key={item.name}>
          <span className="font-mono text-[13px] text-gray-1200">{item.name}</span>{" "}
          <span className="text-gray-1000">— {item.body}</span>
        </li>
      ))}
    </ul>
  );
}

const sections: LegalSection[] = [
  {
    id: "the-short-version",
    title: "The short version",
    content: (
      <>
        <p>
          This site sets no advertising cookies and no tracking cookies from social platforms. There is no cookie
          banner because there is nothing to sell you: the notice you see once asks permission for optional analytics
          only.
        </p>
        <p>
          What the site does store is small and functional: your own choices, kept in your own browser, so the site
          stops asking. Everything is listed below by its real name, so you can find it and delete it.
        </p>
      </>
    ),
  },
  {
    id: "always-on",
    title: "Storage that works without analytics",
    content: (
      <StorageList
        items={[
          {
            name: "mattia-ciuni-newsletter-subscribed",
            body: "remembers that you already subscribed, so the newsletter section shows the confirmation instead of the form again. Local storage, no expiry, removed when you use “Use another email” or clear site data.",
          },
          {
            name: "mattia-ciuni-ai-chat",
            body: "the conversation you have with Ask Mattia Ciuni AI, stored in your browser so you can come back to it. It never leaves your device; “New chat” deletes it.",
          },
          {
            name: "mattia-ciuni-analytics-consent",
            body: "your answer to the analytics notice. Local storage, no expiry, deleted when you clear site data, after which the notice appears again.",
          },
        ]}
      />
    ),
  },
  {
    id: "analytics-only",
    title: "Only if you allow analytics",
    content: (
      <>
        <p>
          These appear after you choose “Allow” and disappear if you clear your choice. Declining means none of them is
          ever created and no analytics script is loaded.
        </p>
        <StorageList
          items={[
            {
              name: "_ga, _ga_G-YQS0R94ZQP",
              body: "Google Analytics cookies, set by Google, used to tell a returning visit from a new one. Up to 13 months.",
            },
            {
              name: "mattia-ciuni-first-touch",
              body: "the source, medium and campaign of your first visit to this site, kept locally so later visits can be attributed honestly. No expiry.",
            },
            {
              name: "mattia-ciuni-traffic-source-sent",
              body: "a session value that stops the same source event from being counted twice while you browse. Deleted when you close the tab.",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "admin",
    title: "The private dashboard",
    content: (
      <p>
        The feedback review dashboard at{" "}
        <code className="font-mono text-[13px]">/admin/feedback/</code> is mine, not a public page. When I log in
        there, Cloudflare sets one session cookie,{" "}
        <code className="font-mono text-[13px]">__Host-mattia_feedback_admin</code> — HttpOnly, Secure, SameSite=Strict,
        and it carries a random session id, not the long-lived admin secret. It
        expires after 4 hours and logging out deletes it on the server. Normal
        visitors never receive it.
      </p>
    ),
  },
  {
    id: "your-choice",
    title: "Changing your choice",
    content: (
      <p>
        Analytics consent lives in this browser: clear this site&apos;s local storage (in every major browser: site
        settings → cookies and site data → delete) and reload the page, and the notice will ask again. The same
        clearing removes the newsletter state, the chat history and the first-touch record. The site works perfectly
        without any of them.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third parties",
    content: (
      <p>
        The only third-party code that can set anything is Google Analytics, and only with your consent. Everything
        else runs on this site&apos;s own domain or on Cloudflare, which serves the pages. There are no pixels, no
        social embeds, no advertising identifiers. What each provider does with the data is described in the{" "}
        <Link href="/privacy/" className="article-underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    content: (
      <p>
        If a new technology is added, it appears on this page first, with its real name and its purpose. Questions can
        go to{" "}
        <a href={`mailto:${site.email}`} className="article-underline">
          {site.email}
        </a>
        .
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      intro="Every value this site stores in your browser, listed by name, with what it is for and how to remove it."
      sections={sections}
    />
  );
}
