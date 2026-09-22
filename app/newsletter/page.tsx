import type { Metadata } from "next";
import { NewsletterSection } from "@/components/NewsletterSection";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "One email a week: what I shipped, what broke, what I decided and why. Building Payle in public.",
  alternates: { canonical: "/newsletter/" },
};

export default function Page() {
  return (
    <main
      id="content"
      className="mx-auto w-full min-w-0 max-w-[692px] px-6 pt-24 sm:pt-32"
    >
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-serif text-[28px] font-medium leading-[1.15] text-gray-1200">
          Newsletter
        </h1>
        <p className="mt-4 text-[15px] leading-[1.75] text-text-paragraph">
          One email a week: what I shipped, what broke, what I decided and why.
          Building Payle in public, from Italy to San Francisco.
        </p>
        <NewsletterSection />
      </div>
    </main>
  );
}
