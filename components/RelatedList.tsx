import Link from "next/link";
import { ChevronRight } from "@/components/icons";

export interface RelatedItem {
  slug: string;
  href: string;
  title: string;
  meta: string;
}

export function RelatedList({
  id,
  heading,
  items,
  className = "mt-24",
}: {
  id: string;
  heading: string;
  items: RelatedItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="mb-2 font-medium">
        {heading}
      </h2>
      <ul className="m-0 list-none divide-y divide-gray-300 p-0">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={item.href}
              className="group flex items-baseline justify-between gap-4 py-3.5"
            >
              <span className="font-serif font-[450]">{item.title}</span>
              <span className="flex items-center gap-2 whitespace-nowrap text-gray-1000">
                {item.meta}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
