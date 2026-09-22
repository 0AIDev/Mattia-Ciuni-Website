"use client";

import { site } from "@/lib/site";
import { track } from "@/lib/analytics";
import { MailCheckIcon } from "@/components/ui/mail-check";

export default function CopyEmail() {
  return (
    <span className="whitespace-nowrap">
      <a
        href={`mailto:${site.email}`}
        onClick={() => track("email_click", { destination: "email", content_kind: "home" })}
        className="article-underline inline-flex items-center gap-1.5"
      >
        <MailCheckIcon size={15} className="inline-flex shrink-0" />
        {site.email}
      </a>
    </span>
  );
}