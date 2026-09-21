import { ArrowUpRightIcon } from "@/components/ui/static-icons";
import { LinkedinIcon } from "@/components/ui/static-icons";
import { MailCheckIcon } from "@/components/ui/static-icons";

export function GhassenLinks() {
  return (
    <p className="mt-10 w-full text-sm text-gray-1000">
      Ghassen Jemai is on{" "}
      <a
        href="https://beamerboi.github.io/"
        rel="noopener noreferrer"
        className="article-underline inline-flex items-center gap-1.5"
      >
        beamerboi.github.io <ArrowUpRightIcon size={14} className="inline-flex shrink-0" />
      </a>
      , on{" "}
      <a
        href="https://www.linkedin.com/in/ghassen-jemai/"
        rel="noopener noreferrer"
        className="article-underline inline-flex items-center gap-1.5"
      >
        <LinkedinIcon size={15} className="inline-flex shrink-0" />
        LinkedIn
      </a>
      , and at{" "}
      <a
        href="mailto:ghassen@usepayle.com"
        className="article-underline inline-flex items-center gap-1.5"
      >
        <MailCheckIcon size={15} className="inline-flex shrink-0" />
        ghassen@usepayle.com
      </a>
      .
    </p>
  );
}
