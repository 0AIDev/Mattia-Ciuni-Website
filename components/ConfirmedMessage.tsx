"use client";

import { useEffect, useState } from "react";
import { confirmationForSlug } from "@/lib/careers/confirmation";

// Il messaggio di conferma è per ruolo, ma la pagina è esportata statica
// (niente searchParams lato server). Lo slug arriva dal redirect dell'endpoint
// di verifica (?job=slug) e si legge lato client: la pagina è noindex, il
// contenuto di default è quello generico.
export function ConfirmedMessage() {
  const [confirmation, setConfirmation] = useState(() => confirmationForSlug(null));

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("job");
    setConfirmation(confirmationForSlug(slug));
  }, []);

  return (
    <>
      <h1 className="font-serif text-4xl">{confirmation.title}</h1>
      <p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-gray-1100">{confirmation.body}</p>
      <p className="mt-8 text-gray-1200">Mattia</p>
    </>
  );
}
