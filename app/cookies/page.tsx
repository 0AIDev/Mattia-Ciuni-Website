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
          <span className="text-gray-1000">· {item.body}</span>
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
          banner because there is nothing to sell you: the notice you see once asks permission for Google Analytics,
          the only tool here that keeps an identifier in your browser.
        </p>
        <p>
          What the site stores by itself is small and functional: your own choices, kept in your own browser so the
          site stops asking, plus three counters that measure one visit inside one tab. Everything is listed below by
          its real name, so you can find it and delete it.
        </p>
        <p>
          The cookieless counter (Umami) is the one exception to the “only with your consent” rule, and it earns
          it by writing nothing at all: no cookie, no local storage, no session value, no identifier on your device.
          That is why it starts on the first page view and why the notice does not mention it.
        </p>
      </>
    ),
  },
  {
    id: "always-on",
    title: "Always on, and it holds no identity",
    content: (
      <>
        <StorageList
          items={[
            {
              name: "mattia-ciuni-newsletter-subscribed",
              body: "remembers that you already subscribed, so the newsletter section shows the confirmation instead of the form again. Local storage, no expiry, removed when you use “Use another email” or clear site data.",
            },
            {
              name: "mattia-ciuni-analytics-consent",
              body: "your answer to the Google Analytics notice. Local storage, no expiry, deleted when you clear site data, after which the notice appears again.",
            },
            {
              name: "mattia-ciuni-consent-event-v1",
              body: "a session marker that prevents the analytics consent choice from being counted twice in one visit. Session storage, deleted when you close the tab.",
            },
            {
              name: "mattia-ciuni-page-enter",
              body: "the moment the page you are reading was opened, so its duration can be written when you move on. Session storage: it disappears when you close the tab and it is empty in a new one.",
            },
            {
              name: "mattia-ciuni-session-pages",
              body: "how many pages this visit has touched, used to read a visit as a path instead of isolated pages. Session storage, deleted with the tab.",
            },
            {
              name: "mattia-ciuni-session-start",
              body: "when this visit began, so the length of the whole visit can be measured when you leave. Session storage, deleted with the tab.",
            },
          ]}
        />
        <p className="mt-4">
          The last three exist because the duration of a page cannot be measured after the fact: they are numbers on a
          clock, not facts about you, and they never leave your browser as anything but totals attached to a page.
        </p>
      </>
    ),
  },
  {
    id: "analytics-only",
    title: "Only if you allow Google Analytics",
    content: (
      <>
        <p>
          These appear after you choose “Allow” and disappear if you clear your choice. Declining means none of them is
          ever created and no Analytics script is loaded: the count of visits continues, without any of this.
        </p>
        <StorageList
          items={[
            {
              name: "_ga, _ga_G-YQS0R94ZQP",
              body: "Google Analytics cookies, set by Google, used to tell a returning visit from a new one and to group one visit together. Up to 13 months.",
            },
            {
              name: "mattia-ciuni-attribution-session-v2",
              body: "the current, first and last campaign snapshot for this tab: normalized source, medium, campaign, content, term, campaign ID, landing path, referrer domain and supported click IDs. Session storage, deleted with the tab.",
            },
            {
              name: "mattia-ciuni-first-touch-v2 / mattia-ciuni-last-touch-v2",
              body: "first and last campaign snapshots. The first-touch persistent copy is created only after Google Analytics consent; the session copy exists for the anonymous first-party measurement. No raw query string is stored.",
            },
            {
              name: "mattia-ciuni-first-touch",
              body: "legacy first-touch key from the previous implementation. It is no longer written and disappears when site data is cleared.",
            },
            {
              name: "mattia-ciuni-traffic-source-sent-v2",
              body: "a session value that stops the same source event from being counted twice while you browse. Deleted when you close the tab.",
            },
            {
              name: "mattia-ciuni-page-view-sent-v2",
              body: "a session value that prevents duplicate page-view events during one visit. Deleted when you close the tab.",
            },
          ]}
        />
        <p className="mt-4">
          Nothing here follows you to other websites: there are no advertising identifiers, no pixels, no 
          cross-site profiles, and every key above is readable and deletable from your browser.
        </p>
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
        expires after 12 hours and logging out deletes it on the server. Normal
        visitors never receive it. Neither counter measures anything inside
        `/admin`.
      </p>
    ),
  },
  {
    id: "your-choice",
    title: "Changing your choice",
    content: (
      <p>
        Your answer lives in this browser: clear this site&apos;s local storage (in every major browser: site settings →
        cookies and site data → delete) and reload the page, and the notice will ask again. The same clearing removes
        the newsletter state and the first-touch record, and closing the tab empties the visit counters. The site works
        perfectly without any of them. Declining stops Google Analytics only: the cookieless count of visits is not
        something you can switch off from the browser, so it is described in full on the{" "}
        <Link href="/privacy/" className="article-underline">
          Privacy Policy
        </Link>{" "}
        page instead.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third parties",
    content: (
      <p>
        The only third-party code that can set anything is Google Analytics, and only with your consent. Umami is
        loaded too, and it is the reason nothing of it appears in the lists above: it receives the page you are on and
        a signature of your browser, and returns nothing to your device. The copy of the measurement in my own database
        is not in those lists either, and for the same reason: the page sends it on its way out and nothing is written
        here or read back. Everything else runs on this site&apos;s own domain or on Cloudflare, which serves the pages.
        There are no pixels, no social embeds, no advertising identifiers.          What each provider does with the data is
        described in the{" "}
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
