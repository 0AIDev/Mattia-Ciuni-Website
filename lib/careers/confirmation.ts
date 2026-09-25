// Messaggi di conferma per ruolo, separati dai dati completi dei ruoli
// (lib/careers/jobs.ts): questa mappa finisce nel bundle client della pagina di
// conferma e non deve trascinarsi dietro le descrizioni dei ruoli. Usata anche
// dall'email di verifica (functions/api/careers/apply.ts), così pagina ed email
// non possono divergere. Mai em-dashes nel copy pubblicato.
export interface RoleConfirmation {
  title: string;
  body: string;
  /** Riga extra dentro l'email di verifica, specifica del ruolo. */
  emailLine: string;
}

const roleConfirmations: Record<string, RoleConfirmation> = {
  "agent-runtime-founding-engineer": {
    title: "Application confirmed.",
    body: "Application confirmed for Founding Engineer, Agent Runtime. You built something real to get here, so I will treat it the same way: I read everything personally, usually within a few days.",
    emailLine: "The runtime is the layer the whole gate exists for, so I read runtime applications first.",
  },
  "ml-engineer-risk": {
    title: "Application confirmed.",
    body: "Application confirmed for ML Engineer, Risk & Trust. You dug through a ledger for planted fraud, so here is the same honesty in return: I read everything personally, usually within a few days.",
    emailLine: "The risk layer is the hardest modeling problem we have, so I read risk applications first.",
  },
};

const fallback: RoleConfirmation = {
  title: "Application confirmed.",
  body: "Your application is in. I read everything personally, usually within a few days.",
  emailLine: "I read everything personally, usually within a few days.",
};

export function confirmationForSlug(slug: string | undefined | null): RoleConfirmation {
  if (!slug) return fallback;
  return roleConfirmations[slug] ?? fallback;
}
