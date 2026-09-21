import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Mattia Ciuni handles Sundays newsletter subscriptions.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <main id="content" className="mx-auto max-w-[692px] px-6 pb-24 pt-16 sm:pt-24">
      <nav aria-label="Breadcrumb" className="mb-16 text-sm text-gray-1000">
        <Link href="/">Home</Link> <span aria-hidden="true">·</span> <span aria-current="page">Privacy</span>
      </nav>
      <article>
        <h1 className="mb-6 font-serif text-4xl font-medium leading-tight text-gray-1200">Privacy</h1>
        <div className="space-y-5 text-text-paragraph">
          <p>Sundays collects one thing: your email address.</p>
          <p>Why: to send you one weekly email about what I shipped, what broke, what I decided and why.</p>
          <p>Your email is handled by Buttondown to deliver the newsletter. No sale, profiling, or advertising data sharing. No data sharing, ever.</p>
          <p>You can cancel through the unsubscribe link in every email, or email <a href={`mailto:${site.email}`}>{site.email}</a> and ask me to remove you.</p>
          <p>Double opt-in is always on: your subscription is not active until you click the confirmation link.</p>
        </div>
        <p className="mt-12 text-sm text-gray-1000"><Link href="/">Back home</Link></p>
      </article>
    </main>
  );
}
