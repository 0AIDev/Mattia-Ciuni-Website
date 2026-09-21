import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const pageTitle = "Legal Center | Privacy, Terms and Cookies";

export const metadata: Metadata = {
  title: "Legal Center | Privacy, Terms and Cookies",
  description: "Privacy, terms, and cookies for Mattia Ciuni's website.",
  alternates: { canonical: "/legal/" },
  openGraph: {
    type: "website",
    url: "/legal/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description: "Privacy, terms, and cookies for Mattia Ciuni's website.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni" }],
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: ["/og.png"] },
};

const sections: LegalSection[] = [
  {
    id: "documents",
    title: "Documents",
    content: (
      <ul className="m-0 list-none space-y-3 p-0">
        <li><Link href="/privacy/" className="article-underline">Privacy Policy</Link><span className="text-gray-1000"> · how personal data is handled</span></li>
        <li><Link href="/terms/" className="article-underline">Terms of Service</Link><span className="text-gray-1000"> · the rules for using the site</span></li>
        <li><Link href="/cookies/" className="article-underline">Cookies</Link><span className="text-gray-1000"> · browser storage and preferences</span></li>
      </ul>
    ),
  },
  {
    id: "newsletter",
    title: "Newsletter",
    content: <p>The Sundays newsletter stores subscribers in Brevo and sends the Welcome email with Resend. You can unsubscribe at any time from the link in every email. See the <Link href="/privacy/" className="article-underline">Privacy Policy</Link> for details.</p>,
  },
  {
    id: "questions",
    title: "Questions",
    content: <p>If something is unclear, email <a href="mailto:ceo@usepayle.com" className="article-underline">ceo@usepayle.com</a>.</p>,
  },
];

export default function LegalCenterPage() {
  return <LegalPage title="Legal Center" intro="The short version of the rules and policies for this site." sections={sections} />;
}
