import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mattia Ciuni | Founder & CEO at Know Computer",
    short_name: "Mattia",
    description:
      "Founder & CEO of Know Computer, a personal context layer for the AI era.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFCFC",
    theme_color: "#FCFCFC",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
