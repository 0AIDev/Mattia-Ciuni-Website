import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookies",
  description: "A clear summary of cookies and local browser storage used on this site.",
  alternates: { canonical: "/cookies/" },
};

const sections: LegalSection[] = [
  {
    id: "what-we-use",
    title: "What we use",
    content: <p>This site does not use advertising cookies or third-party tracking cookies. The newsletter form uses local browser storage to remember that you have subscribed.</p>,
  },
  {
    id: "why-it-is-used",
    title: "Why it is used",
    content: <p>The local preference prevents the newsletter form from asking for the same subscription again on a later visit. It stays in your browser and is not sent to us.</p>,
  },
  {
    id: "your-choice",
    title: "Your choice",
    content: <p>You can remove this preference by clearing site data in your browser or choosing “Use another email” in the newsletter section. The site remains usable without it.</p>,
  },
  {
    id: "changes",
    title: "Changes",
    content: <p>If the technologies used by this site change, this page will be updated with a clear explanation.</p>,
  },
];

export default function CookiesPage() {
  return <LegalPage title="Cookies" intro="A plain-language summary of the small amount of browser storage this site uses." sections={sections} />;
}
