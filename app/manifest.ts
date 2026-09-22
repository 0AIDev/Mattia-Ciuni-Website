import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mattia Ciuni | Founder & CEO at Payle",
    short_name: "Mattia",
    description:
      "Founder & CEO of Payle, the money layer for AI agents.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFCFC",
    theme_color: "#FCFCFC",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
