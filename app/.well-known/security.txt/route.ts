import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = [
    "Contact: mailto:" + site.email,
    "Preferred-Languages: en, it",
    "Canonical: " + site.url + "/.well-known/security.txt",
    "Expires: 2027-09-22T00:00:00.000Z",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
