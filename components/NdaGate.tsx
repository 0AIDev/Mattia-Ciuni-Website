"use client";

import { useEffect, useState } from "react";

export function NdaGate() {
  const [state, setState] = useState<"checking" | "invalid">("checking");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) {
      window.setTimeout(() => setState("invalid"), 0);
      return;
    }
    fetch(`/api/nda?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          setState("invalid");
          return;
        }
        const data = (await response.json()) as { redirect?: string };
        if (data.redirect === "https://payle.up.railway.app/s/3XUuxQ1sgeDTXC") {
          window.location.replace(data.redirect);
          return;
        }
        setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, []);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6 text-center">
      {state === "checking" ? (
        <p className="text-sm text-gray-1000">Opening your document…</p>
      ) : (
        <div>
          <h1 className="font-serif text-3xl text-gray-1200">This link is not available.</h1>
          <p className="mt-3 text-sm text-gray-1000">Ask the sender for a new NDA link.</p>
        </div>
      )}
    </main>
  );
}
