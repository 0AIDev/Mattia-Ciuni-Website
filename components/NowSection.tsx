"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

export default function NowSection() {
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    const update = () =>
      setUpdated(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      );
    update();
  }, []);

  return (
    <section aria-labelledby="now" className="mb-16 sm:mb-24">
      <h2 id="now" className="mb-2 font-serif text-3xl font-medium">Now</h2>
      <p className="m-0 mb-1 text-text-paragraph">
        Building{" "}
        <a
          href={site.companyUrl}
          rel="noopener noreferrer"
          className="article-underline"
        >
          Know Computer
        </a>,{" "}
        a personal context layer for the AI era. Dogfooding it every day.
      </p>
      <p className="m-0 text-sm text-gray-1000">
        Last updated: {updated || "…"}
      </p>
    </section>
  );
}