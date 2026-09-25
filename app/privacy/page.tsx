import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";
import { languageAlternates } from "@/lib/seo";

const pageTitle = "Privacy Policy | Mattia Ciuni";
const card = socialImages("/og.png", "Privacy Policy | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Privacy Policy | What I collect and why",
  description:
    "What this site collects: newsletter subscriptions, feedback submissions, and the analytics you can turn on or off.",
  alternates: { canonical: "/privacy/", languages: languageAlternates("/privacy/") },
  openGraph: {
    type: "website",
    url: "/privacy/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "What this site collects: newsletter subscriptions, feedback submissions, and the analytics you can turn on or off.",
    images: card.og,
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: card.twitter },
};

const sections: LegalSection[] = [
  {
    id: "who-is-responsible",
    title: "Who is responsible",
    content: (
      <>
        <p>
          This is a personal site published by Mattia Ciuni, founder and CEO of Payle. For anything on this page,
          the person responsible for your data is Mattia Ciuni, reachable at{" "}
          <a href={`mailto:${site.email}`} className="article-underline">
            {site.email}
          </a>
          . The site is a personal publishing project: it is not a Payle product page and it does not offer user
          accounts.
        </p>
        <p>
          It is hosted on Cloudflare Pages. There are exactly three places where you can leave something behind: the
          newsletter form, the feedback form, and the analytics choice. Each one is described below.
        </p>
      </>
    ),
  },
  {
    id: "newsletter",
    title: "The newsletter",
    content: (
      <>
        <p>
          The newsletter is optional. When you subscribe I collect your <strong>email address</strong> and the
          information needed to manage the subscription: which channel brought you here (campaign, source, medium,
          landing page and referring domain, the same fields you can read in the URL of an ad or a link), the date and
          time of signup, plus a suppression record if you unsubscribe.
        </p>
        <p>
          The legal basis is your <strong>consent</strong>, given when you submit the form. You use it to receive the
          weekly email, the Welcome email right after signup, and nothing else. Unsubscribing takes one click in any
          email or one email to me.
        </p>
        <p>
          The subscriber record lives in my own database on <strong>Supabase</strong>, with the email address, the
          attribution fields above, the subscription status and the dates. The same address is then kept in
          <strong>Brevo</strong>, which sends the list emails and where the list &ldquo;Mattia Ciuni Newsletter&rdquo;
          lives, and in <strong>Beehiiv</strong>, a second subscription platform I use to keep the list available if one
          provider fails. <strong>Resend</strong> sends the Welcome email right after signup. All four are processors,
          not owners: they cannot use your address for their own marketing, and they act under their own data
          processing terms.
        </p>
        <p>
          The only people who ever see your address are you, me, and those providers. I do not sell it, rent it, share
          it with advertisers, or use it for anything other than this newsletter.
        </p>
      </>
    ),
  },
  {
    id: "feedback",
    title: "The feedback form",
    content: (
      <>
        <p>
          The feedback form in the Feedback section sends me what you write: the <strong>message</strong> (required),
          your <strong>name</strong> and <strong>email</strong> if you choose to add them, the <strong>page</strong> you
          sent it from, and the date and time. Your IP address is used transiently to limit automated traffic and is
          not saved with the feedback. Messages are stored in my own database on <strong>Supabase</strong>, together
          with the index of the review queue; if the database is ever unconfigured the same record goes to Cloudflare
          Workers KV instead, so a submission is never lost to a missing provider. A notification with the text is sent
          through <strong>Brevo</strong> so I can read it on my phone, and if you left an address, a confirmation is
          sent to you through <strong>Resend</strong>.
        </p>
        <p>
          Two things about that confirmation, because they are the kind of detail usually left out: the recipient
          address of every email the site sends is recorded only as a <strong>hash</strong>, in a delivery log that
          exists to prove a message left and to avoid sending it twice; and the confirmation email is a receipt, not a
          subscription. It does not add you to the newsletter.
        </p>
        <p>
          The legal basis is your consent, given by submitting the form, and my legitimate interest in keeping the
          queue free of spam. Rate limiting (three submissions per ten minutes per address) and a hidden anti-bot field
          keep automated traffic out.
        </p>
        <p>
          Reviews are published only after I read them, and you decide how you appear: your name, your name with a
          link, or just an initial. A submission is not confidential correspondence with an expectation of secrecy: if
          you send something you would not want published, say so in the message and I will keep it private. You can ask
          me to delete any submission, published or not, at any time, and I will remove it and its notification.
        </p>
      </>
    ),
  },
  /*
  {
    id: "ai-chat",
    title: "The AI chat",
    content: <p>The site chat is currently disabled. This section remains commented as a record of the future feature.</p>,
  },
  */
  {
    id: "review-dashboard",
    title: "The review dashboard",
    content: (
      <p>
        Feedback and the moderation queue are read in a private dashboard at{" "}
        <code className="font-mono text-[13px]">/admin/feedback/</code>, reachable by me and by Payle&apos;s
        co-founder and CTO, each with their own credential plus a six-digit code from an authenticator app. Access is
        logged there: who acted, on what, when. It is not a public page, it is not indexed, and it is not measured by
        analytics.
      </p>
    ),
  },
  {
    id: "analytics",
    title: "Measurement: three tools, three rules",
    content: (
      <>
        <p>
          Three things measure this site and they are deliberately not the same kind of thing. The first is{" "}
          <strong>Umami</strong>, a counter that runs from the first page view without asking anything: it writes no
          cookie and no identifier on your device, it does not keep your IP address, it does not follow you to other
          sites and it cannot recognise you on a later visit. It counts the page, the referring domain, the country, the
          browser and the device in aggregate form. Since nothing about you is stored, there is nothing to consent to,
          and the notice on this site does not ask about it.
        </p>
        <p>
          Beside those, every event is written to <strong>a copy in my own database</strong>, on Supabase. It is the
          one piece of this that does not depend on a provider staying in business: the measurement of the site cannot
          be lost because a plan changed or a service closed. That copy is anonymous by construction. Your address is
          read once, to compute a one-way fingerprint of that visit and that day, truncated, and is then discarded: the
          fingerprint cannot be reversed, it cannot be linked from one day to the next because the date is part of it,
          and nothing else about your device is kept, not the user agent, not a cookie, not an identifier. What is
          written is the page, the event, the time, the country, whether the device was a phone or a computer, and how
          you arrived. It is kept without a deadline: the whole point of the copy is that nothing is deleted from it.
        </p>
        <p>
          The second is <strong>Microsoft Clarity</strong>, a session-recording and heatmap tool that runs from the
          first page view, like Umami, without asking anything. It records how pages are used: clicks, scrolls, dead
          clicks, rage clicks, and the movement of the mouse on the page, in aggregate heatmaps and per-session
          recordings. It is never used for advertising and Microsoft does not sell its data or run it for ad targeting.
          What it keeps: a session identifier in your browser (the cookies <strong>_clck</strong> and <strong>_clsk</strong>,
          listed on the Cookies page with their durations), your IP address and browser data in truncated, aggregated
          form on Microsoft&apos;s servers, and the interactions listed above. What it never sees: passwords or anything
          typed into any field on this site, which Clarity masks by default, and there are no forms on this site that
          Clarity is allowed to read. If a recording would capture a page containing personal text you submitted, the
          pages that render your own submissions are outside what the recordings replay, and no recording is ever
          linked to a name or an email address. The legal basis is my legitimate interest in understanding how the site
          is used, which does not conflict with your rights because the content you read and the text you type are
          masked and the identifier is not used to follow you anywhere else. You can read exactly what Microsoft
          keeps in Clarity&apos;s own documentation.
        </p>
        <p>
          The third is <strong>Google Analytics 4</strong>, and it is <strong>optional and off until you allow
          it</strong>: it does keep an identifier in your browser, and that identifier is exactly the reason consent is
          required. If you choose &ldquo;Allow&rdquo; in the notice, it receives a measurement of how the site is used.
          Concretely, and completely, that is:
        </p>
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>the <strong>pages you view</strong>, with the kind of content (an article, a note, the home page)</li>
          <li>
            <strong>how you arrived</strong>: the referring domain, the campaign parameters in the link you followed
            (utm_source, utm_medium, utm_campaign, utm_content, utm_term), the click identifiers of paid campaigns when
            they are present, and the page you landed on
          </li>
          <li>the <strong>source of your first visit</strong>, kept in your browser so a later visit is attributed honestly</li>
          <li>
            <strong>how long each page stayed open</strong> and <strong>how far you scrolled</strong> through it, at
            four points: a quarter, half, three quarters, and the end
          </li>
          <li>
            <strong>where you went next</strong>: the page you moved to, and the destination domain when you leave the
            site or close the tab
          </li>
          <li>clicks on internal links and on links that lead outside, with the text of the link</li>
          <li>how many pages the visit contained and how long the visit lasted as a whole</li>
        </ul>
        <p>
          Advertising storage, advertising personalisation and ad user data are explicitly <strong>denied</strong>, no
          advertising features are enabled, and IP addresses are not stored or reported by Analytics: Google uses the
          address at collection time to derive an approximate location and does not retain it. Nothing here is
          personal, nothing is sold, and no measurement is linked to an identity.
        </p>
        <p>
          Campaign attribution follows a strict first-touch and last-touch rule. The first meaningful source is never
          overwritten; a later meaningful campaign updates only last touch. The site records normalized source, medium,
          campaign, content, term, campaign ID, landing pathname, referrer domain and supported click IDs such as
          gclid and fbclid. Query strings are not stored wholesale, and no personal data is put into event parameters.
          A session copy is kept in session storage for the anonymous first-party measurement. The persistent first-touch
          copy is created only after Google Analytics consent.
        </p>
        <p>
          The same events are exposed as a flat, vendor-neutral data layer for a future tag manager. It contains event
          names and operational values such as page type, CTA, form, destination and scroll percentage. It never contains
          names, email addresses, messages, tokens or raw query strings. The active real conversions are newsletter signup
          and feedback submitted. There is no customer, revenue or advertising conversion in this site yet.
        </p>
        <p>
          The purpose is editorial for all of them: knowing which pages are read, which are abandoned halfway, where
          people arrive from and where they leave tells me what to keep writing and what to fix, which is the whole
          point of a site like this one. None of the three is used for advertising, profiling or decisions about you,
          and none is shared with anyone. Google retains its measurement for up to 14 months and acts as an independent
          controller for its own processing, described in Google&apos;s privacy policy; Umami keeps aggregate counts,
          not visits; Microsoft retains Clarity recordings for up to 12 months, under its own data protection terms.
          If you decline Google Analytics, nothing of it is loaded and nothing of it is measured, while the cookieless
          counter and Clarity keep running as described above. You can change your choice at any time by clearing this
          site&apos;s
          browser storage, as described in the{" "}
          <Link href="/cookies/" className="article-underline">
            Cookies
          </Link>{" "}
          page.
        </p>
      </>
    ),
  },
  {
    id: "hosting-logs",
    title: "Hosting and technical logs",
    content: (
      <p>
        The site is served by Cloudflare, which sees the requests needed to deliver a page: IP address, user agent, the
        address requested and the answer. Cloudflare keeps those logs as a service provider for security and
        reliability, and they are not used by this site to build profiles. The newsletter and feedback endpoints log
        only anonymous outcomes (which kind of request, whether it succeeded, how long it took): never an email address,
        a message, an IP address or a provider credential.
      </p>
    ),
  },
  {
    id: "browser-storage",
    title: "What stays in your browser",
    content: (
      <p>
        A few values are stored locally so the site remembers your choices instead of asking again: the newsletter
        state, the analytics choice, the source of your first visit, and a handful of visit counters that measure one
        visit inside one tab (how many pages it has touched, when the current page was opened, and a flag that stops
        the same source from being counted twice). Microsoft Clarity keeps its own session cookies, <strong>_clck</strong> and
        <strong>_clsk</strong>, in the same browser: they are described on the{" "}
        <Link href="/cookies/" className="article-underline">
          Cookies
        </Link>{" "}
        page with their durations. None of them identify you personally, and the complete list is on the{" "}
        <Link href="/cookies/" className="article-underline">
          Cookies
        </Link>{" "}
        page.
      </p>
    ),
  },
  {
    id: "who-else-sees-it",
    title: "Who else is involved",
    content: (
      <p>
        The processors listed above (Cloudflare, Supabase, Resend, Brevo, Beehiiv, Umami for the cookieless counter,
        Microsoft Clarity for session recordings and heatmaps, Google for the optional analytics) are the only third parties involved. They may process data outside the European Union, under their standard contractual
        clauses or an equivalent safeguard. There are no advertising networks, no trackers from social platforms, no
        data brokers, and no sale or rental of personal data ever. If I add a provider, this page is updated before it
        starts processing anything.
      </p>
    ),
  },
  {
    id: "how-long",
    title: "How long it is kept",
    content: (
      <p>
        Newsletter: for as long as you stay subscribed, plus the minimum suppression record needed not to contact you
        again. Feedback: until you ask me to delete it, or while it stays in the review queue; published reviews stay
        published until you ask me to remove them. Email delivery logs: metadata only, with the address hashed.
        Measurement: aggregate counts at Umami, the copy in my own database kept without a deadline because that is the
        reason it exists, session recordings and heatmaps at Microsoft Clarity for up to 12 months, and up to 14 months
        at Google for the optional analytics. Hosting logs: Cloudflare&apos;s own retention period. Nothing is kept
        &ldquo;just in case&rdquo;.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <p>
          You can ask for access to your data, correction, deletion, restriction, portability, or object to the
          processing, and you can withdraw consent at any time without any consequence. Write to{" "}
          <a href={`mailto:${site.email}`} className="article-underline">
            {site.email}
          </a>{" "}
          and I answer within 30 days. Unsubscribing from the newsletter is immediate and needs no explanation.
        </p>
        <p>
          If you believe your data has been handled badly, you can complain to the Italian supervisory authority, the{" "}
          <a href="https://www.garanteprivacy.it/" className="article-underline">
            Garante per la protezione dei dati personali
          </a>
          , or to your local authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <p>
        The site is written for people working in or interested in startups and payments, and it is not addressed to
        children under 16. If you believe a child has sent me data, write to me and I will delete it.
      </p>
    ),
  },
  {
    id: "changes-and-contact",
    title: "Changes and contact",
    content: (
      <p>
        If something changes, this page changes with it and the date at the top moves: there is no small print to spot.
        Questions, or a request to delete something, can go to{" "}
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

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="A straight explanation of what this site collects, why, and what you control. No dark patterns, no data selling, no surprises."
      sections={sections}
    />
  );
}
