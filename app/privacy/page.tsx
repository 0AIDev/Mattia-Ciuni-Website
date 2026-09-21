import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Mattia Ciuni handles newsletter subscriptions and personal data.",
  alternates: { canonical: "/privacy/" },
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
    content: <p>We use your email address to send the newsletter, confirm your subscription, and process unsubscribe requests. The legal basis is your consent, given through double opt-in.</p>,
  },
  {
    id: "who-processes-it",
    title: "Who processes it",
    content: <p>Your email is processed by Buttondown as our newsletter delivery provider. We do not sell your data, use it for advertising, or build a profile about you. No data sharing, ever.</p>,
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: <p>You can unsubscribe at any time using the link in every email. You can also ask for access, correction, or deletion by emailing <a href={`mailto:${site.email}`} className="article-underline">{site.email}</a>.</p>,
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
