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
        Building the{" "}
        <a
          href={site.payleUrl}
          rel="noopener noreferrer"
          className="article-underline"
        >
          money layer for AI agents
        </a>{" "}
        at Payle. Applying to YC, relocating to San Francisco.
      </p>
      <p className="m-0 text-sm text-gray-1000">
        Last updated: {updated || "…"}
      </p>
    </section>
  );
}