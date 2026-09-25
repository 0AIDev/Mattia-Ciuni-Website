import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Mattia Ciuni",
  robots: { index: false, follow: false, nocache: true },
};

export default function FeedbackAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
