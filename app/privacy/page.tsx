import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

const pageTitle = "Privacy Policy | Mattia Ciuni";

export const metadata: Metadata = {
  title: "Privacy Policy | What I collect and why",
  description: "How Mattia Ciuni handles newsletter subscriptions and personal data.",
  alternates: { canonical: "/privacy/" },
  openGraph: {
    type: "website",
    url: "/privacy/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description: "How Mattia Ciuni handles newsletter subscriptions and personal data.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni" }],
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: ["/og.png"] },
};

const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    content: <p>For the Sundays newsletter, we collect your email address and the information needed to manage your subscription. We do not ask for your name.</p>,
  },
  {
    id: "why-we-collect-it",
    title: "Why we collect it",
    content: <p>We use your email address to send the newsletter, deliver the Welcome email, and process unsubscribe requests. The legal basis is your consent, given when you submit the form.</p>,
  },
  {
    id: "who-processes-it",
    title: "Who processes it",
    content: <p>Your email is stored in Brevo as the newsletter CRM and processed by Resend to send the Welcome email after signup. We do not sell your data or use it for unrelated advertising. Newsletter attribution such as campaign, referrer domain, and landing page is stored to understand which channels bring useful readers. No data sharing, ever.</p>,
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: <p>You can unsubscribe at any time using the link in every email. You can also ask for access, correction, or deletion by emailing <a href={`mailto:${site.email}`} className="article-underline">{site.email}</a>. Google Analytics is optional and is loaded only after you choose “Allow” in the analytics notice; it uses anonymised measurement and does not receive the newsletter email address.</p>,
  },
  {
    id: "analytics",
    title: "Analytics and measurement",
    content: <p>If you allow analytics, Google Analytics receives anonymous page, referrer, campaign, and interaction events. You can clear the analytics choice from your browser storage at any time. The site does not use advertising personalisation.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    content: <p>Questions about privacy can be sent to <a href={`mailto:${site.email}`} className="article-underline">{site.email}</a>. For the other legal documents, visit the <Link href="/legal/" className="article-underline">Legal Center</Link>.</p>,
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" intro="A short explanation of what I collect, why I collect it, and what you control." sections={sections} />;
}
