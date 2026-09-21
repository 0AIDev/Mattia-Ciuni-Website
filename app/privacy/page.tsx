import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";
import { socialImages } from "@/lib/social";

const pageTitle = "Privacy Policy | Mattia Ciuni";
const card = socialImages("/og.png", "Privacy Policy | Mattia Ciuni");

export const metadata: Metadata = {
  title: "Privacy Policy | What I collect and why",
  description:
    "How Mattia Ciuni handles newsletter subscriptions, feedback submissions, the AI chat and analytics.",
  alternates: { canonical: "/privacy/" },
  openGraph: {
    type: "website",
    url: "/privacy/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description:
      "How Mattia Ciuni handles newsletter subscriptions, feedback submissions, the AI chat and analytics.",
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
          It is hosted on Cloudflare Pages. There are exactly four places where you can leave something behind: the
          newsletter form, the feedback form, the AI chat, and the analytics choice. Each one is described below.
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
          Three services process this data on my behalf: <strong>Resend</strong>, which sends the Welcome email and the
          notification emails for feedback; <strong>Brevo</strong>, which keeps the subscriber list
          (&ldquo;Mattia Ciuni Newsletter&rdquo;) and the contacts I write to; and <strong>Beehiiv</strong>, a second
          subscription platform I use to keep the same list available if one provider fails. All three are processors,
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
          sent it from, the date and time, and the <strong>first two numbers of your IP address</strong> (used only
          against abuse and never shown to anyone). Messages are stored in Cloudflare Workers KV, my own storage, and a
          notification with the text is emailed to me so I can read it.
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
  {
    id: "ai-chat",
    title: "The AI chat",
    content: (
      <>
        <p>
          The <strong>Ask Mattia Ciuni AI</strong> chat answers questions about this site and about{" "}
          <a href={site.payleUrl} className="article-underline">
            usepayle.com
          </a>
          . What you type, the address of the page you are on, and the passages of this site that match your question
          are sent to this site&apos;s own endpoint (<code>/api/chat</code>) so the answer can be assembled. If the
          generative model is enabled on the deployment, that same text is processed by{" "}
          <strong>Cloudflare Workers AI</strong>, running inside Cloudflare; no other provider receives it and nothing
          you type is used to train a model.
        </p>
        <p>
          Your conversation is <strong>not</strong> stored on the server. It lives in your browser only, as the
          &ldquo;New chat&rdquo; history you can read after reloading the page, and it disappears when you press
          &ldquo;New chat&rdquo; or clear your browser data. Please do not paste confidential information into the
          chat: it is a convenience tool, not a private channel.
        </p>
        <p>
          Answers are put together from what is published on this site and may be incomplete or wrong. They are not
          advice and they are not statements of fact about Payle beyond what the pages themselves say.
        </p>
      </>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    content: (
      <>
        <p>
          Analytics are <strong>optional and off until you allow them</strong>. If you choose &ldquo;Allow&rdquo; in
          the notice, Google Analytics 4 receives anonymous measurement of this site: pages viewed, the referring
          domain, campaign parameters in the link you arrived from, outbound and CTA clicks, and the source of your
          first visit, kept in your browser. Advertising storage, advertising personalisation and ad user data are
          explicitly <strong>denied</strong>, and IP addresses are anonymised.
        </p>
        <p>
          The purpose is editorial: knowing which pages are read tells me what to keep writing. Google retains this
          measurement for up to 14 months and acts as an independent controller for its own processing, described in
          Google&apos;s privacy policy. If you decline, nothing is loaded and nothing is measured. You can change your
          choice at any time by clearing this site&apos;s browser storage, as described in the{" "}
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
        reliability, and they are not used by this site to build profiles. The newsletter, feedback and chat endpoints
        log only anonymous outcomes (which kind of request, whether it succeeded, how long it took): never an email
        address, a message, an IP address or a provider credential.
      </p>
    ),
  },
  {
    id: "browser-storage",
    title: "What stays in your browser",
    content: (
      <p>
        A few values are stored locally so the site remembers your choices instead of asking again: the newsletter
        state, the analytics choice, your first visit source, the chat history, and a session flag for the traffic
        source event. None of them identify you and none of them leave your device on their own. The complete list is
        on the{" "}
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
        The processors listed above (Cloudflare, Resend, Brevo, Beehiiv, Google for optional analytics) are the only
        third parties involved. They may process data outside the European Union, under their standard contractual
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
        published until you ask me to remove them. Analytics: up to 14 months at Google. Hosting logs: Cloudflare&apos;s
        own retention period. Nothing is kept &ldquo;just in case&rdquo;.
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
