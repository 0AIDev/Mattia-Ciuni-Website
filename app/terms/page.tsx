import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site } from "@/lib/site";

const pageTitle = "Terms of Service | Mattia Ciuni";

export const metadata: Metadata = {
  title: "Terms of Service | Reading and newsletter rules",  description: "Terms for using Mattia Ciuni's website and newsletter.",
  alternates: { canonical: "/terms/" },
  openGraph: {
    type: "website",
    url: "/terms/",
    siteName: "Mattia Ciuni",
    title: pageTitle,
    description: "Terms for using Mattia Ciuni's website and newsletter.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mattia Ciuni" }],
  },
  twitter: { card: "summary_large_image", title: pageTitle, images: ["/og.png"] },
};

const sections: LegalSection[] = [
  {
    id: "using-the-site",
    title: "Using the site",
    content: <p>This site is a personal publishing site by Mattia Ciuni. You may read, link to, and share its public content for lawful purposes. Please do not copy or republish it as your own.</p>,
  },
  {
    id: "newsletter",
    title: "Newsletter",
    content: <p>The Sundays newsletter is optional. Your address is added to the newsletter CRM and a Welcome email is sent after signup. You can unsubscribe at any time. We may pause or change the newsletter, but we will not use your address for unrelated marketing.</p>,
  },
  {
    id: "content",
    title: "Content",
    content: <p>Articles and notes are provided for information and discussion. They are not financial, legal, or investment advice. Links to other websites are provided for context, and those sites have their own terms.</p>,
  },
  {
    id: "availability",
    title: "Availability",
    content: <p>I work to keep the site available and accurate, but I cannot promise that every page or link will always be uninterrupted or error-free.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    content: <p>Questions about these terms can be sent to <a href={`mailto:${site.email}`} className="article-underline">{site.email}</a>.</p>,
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" intro="The simple rules for reading this site and subscribing to the newsletter." sections={sections} />;
}
