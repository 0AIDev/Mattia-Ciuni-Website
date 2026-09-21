import { site } from "@/lib/site";
import { MailCheckIcon } from "@/components/ui/mail-check";

export default function CopyEmail() {
  return (
    <span className="whitespace-nowrap">
      <a
        href={`mailto:${site.email}`}
        className="article-underline inline-flex items-center gap-1.5"
      >
        <MailCheckIcon size={15} className="inline-flex shrink-0" />
        {site.email}
      </a>
    </span>
  );
}