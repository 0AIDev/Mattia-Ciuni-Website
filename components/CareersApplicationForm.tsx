"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import type { CareerQuestion } from "@/lib/careers/jobs";

const initial = { full_name: "", email: "", country_timezone: "", github_url: "", portfolio_url: "", artifact_link: "", artifact_description: "", motivation: "", custom_answers: {} as Record<string, string>, cv_filename: "", cv_base64: "", website: "" };

/**
 * Da dove arriva il candidato. Il link del feed di ogni board porta
 * `?utm_source=<board>`; senza UTM si deriva dall'hostname del referrer. Il
 * valore è una **dritta**, non un dato fidato: il server lo confina alla
 * allowlist di `validation.ts` prima di scriverlo. Qui si può mentire; lì no.
 */
function applicationSourceHint(): string {
  if (typeof window === "undefined") return "";
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) return utm.trim().toLowerCase().slice(0, 40);
  if (document.referrer) {
    try { return new URL(document.referrer).hostname.replace(/^www\./, "").slice(0, 40); } catch { /* referrer malformato: si lascia al server */ }
  }
  return "";
}
type Values = typeof initial;
type FieldErrors = Partial<Record<keyof Values, string>>;
function MinimalArrow({ direction = "right" }: { direction?: "left" | "right" }) { return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d={direction === "left" ? "m12.5 4-6 6 6 6" : "m7.5 4 6 6-6 6"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

const fieldClass = "box-border min-h-12 w-full max-w-full min-w-0 appearance-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-[15px] text-gray-1200 outline-none transition-[border-color,background-color,box-shadow] placeholder:text-gray-1000 hover:border-gray-400 hover:bg-white focus:border-gray-1200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-1200/8";
function validHttps(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }

function formCopy() {
  const common = { fullName: "Full name", email: "Email", timeZone: "Time zone", github: "GitHub (optional)", portfolio: "Portfolio (optional)", artifactLink: "Link to your artifact", artifactDescription: "Artifact description", motivation: "Why Payle, why you", cv: "CV / résumé (PDF, max 5 MB)", cvDropTitle: "Drop your PDF here", cvDropHint: "PDF only, up to 5 MB", cvChoose: "Choose a PDF", cvRemove: "Remove file", next: "Continue →", back: "Back", submit: "Submit application →", submitting: "Submitting...", almost: "Almost done.", verify: "Check your inbox to verify your email.", expires: "The verification link expires after 48 hours.", tooMany: "Too many applications from this network today. Try again tomorrow.", duplicate: "You've already applied for this role.", failed: "The application could not be submitted. Check the fields and try again.", timeout: "The request took too long. Try again shortly.", check: "Check the fields marked below.", required: "This field is required.", invalidUrl: "Enter a valid HTTPS URL.", cvType: "Choose a PDF file.", cvSize: "The PDF must be 5 MB or smaller.", timePlaceholder: "Your time zone", step: "Step" };
  return common;
  /* Legacy locale branches intentionally unreachable: applications are English-only. */
  if (false) return { ...common, fullName: "Nome e cognome", timeZone: "Fuso orario", github: "GitHub (facoltativo)", portfolio: "Portfolio (facoltativo)", artifactLink: "Link al tuo artefatto", artifactDescription: "Descrizione dell'artefatto", motivation: "Perché Payle, perché tu", cv: "CV / curriculum (PDF, max 5 MB)", cvDropTitle: "Trascina qui il tuo PDF", cvDropHint: "Solo PDF, massimo 5 MB", cvChoose: "Scegli un PDF", cvRemove: "Rimuovi file", next: "Continua →", back: "Indietro", submit: "Invia candidatura →", submitting: "Invio...", almost: "Quasi fatto.", verify: "Controlla la posta per verificare l'email.", expires: "Il link di verifica scade dopo 48 ore.", tooMany: "Troppe candidature da questa rete oggi. Riprova domani.", duplicate: "Hai già inviato la candidatura per questo ruolo.", failed: "La candidatura non è stata inviata. Controlla i campi e riprova.", timeout: "La richiesta ha impiegato troppo. Riprova tra poco.", check: "Controlla i campi indicati.", required: "Questo campo è obbligatorio.", invalidUrl: "Inserisci un URL HTTPS valido.", cvType: "Scegli un file PDF.", cvSize: "Il PDF deve essere di massimo 5 MB.", timePlaceholder: "Il tuo fuso orario", step: "Passo" };
  if (false) return { ...common, fullName: "Nom complet", timeZone: "Fuseau horaire", github: "GitHub (facultatif)", portfolio: "Portfolio (facultatif)", artifactLink: "Lien vers votre artefact", artifactDescription: "Description de l'artefact", motivation: "Pourquoi Payle, pourquoi vous", cv: "CV (PDF, 5 Mo max.)", cvDropTitle: "Déposez votre PDF ici", cvDropHint: "PDF uniquement, 5 Mo maximum", cvChoose: "Choisir un PDF", cvRemove: "Supprimer le fichier", next: "Continuer →", back: "Retour", submit: "Envoyer la candidature →", submitting: "Envoi...", almost: "Presque terminé.", verify: "Consultez votre boîte mail pour vérifier votre adresse.", expires: "Le lien de vérification expire après 48 heures.", tooMany: "Trop de candidatures depuis ce réseau aujourd'hui. Réessayez demain.", duplicate: "Vous avez déjà postulé pour ce rôle.", failed: "La candidature n'a pas pu être envoyée. Vérifiez les champs et réessayez.", timeout: "La requête a pris trop de temps. Réessayez bientôt.", check: "Vérifiez les champs indiqués.", required: "Ce champ est obligatoire.", invalidUrl: "Saisissez une URL HTTPS valide.", cvType: "Choisissez un fichier PDF.", cvSize: "Le PDF doit faire 5 Mo ou moins.", timePlaceholder: "Votre fuseau horaire", step: "Étape" };
  if (false) return { ...common, fullName: "Nombre completo", timeZone: "Zona horaria", github: "GitHub (opcional)", portfolio: "Portfolio (opcional)", artifactLink: "Enlace a tu artefacto", artifactDescription: "Descripción del artefacto", motivation: "Por qué Payle, por qué tú", cv: "CV (PDF, máx. 5 MB)", cvDropTitle: "Suelta tu PDF aquí", cvDropHint: "Solo PDF, hasta 5 MB", cvChoose: "Elegir un PDF", cvRemove: "Quitar archivo", next: "Continuar →", back: "Atrás", submit: "Enviar candidatura →", submitting: "Enviando...", almost: "Casi terminado.", verify: "Revisa tu correo para verificarlo.", expires: "El enlace de verificación caduca en 48 horas.", tooMany: "Demasiadas candidaturas desde esta red hoy. Inténtalo mañana.", duplicate: "Ya has solicitado este puesto.", failed: "No se pudo enviar la candidatura. Revisa los campos e inténtalo de nuevo.", timeout: "La solicitud tardó demasiado. Inténtalo de nuevo pronto.", check: "Revisa los campos indicados.", required: "Este campo es obligatorio.", invalidUrl: "Introduce una URL HTTPS válida.", cvType: "Elige un PDF.", cvSize: "El PDF debe tener 5 MB o menos.", timePlaceholder: "Tu zona horaria", step: "Paso" };
  return common;
}

export function CareersApplicationForm({ jobSlug, questions = [] }: { jobSlug: string; questions?: CareerQuestion[] }) {
  const text = formCopy();
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const steps = useMemo(() => ["identity", "timeZone", "links", "artifact", "description", "motivation", ...questions.map((question) => question.id), "cv"], [questions]);

  useEffect(() => {
    const raw = Number(new URLSearchParams(window.location.search).get("step") || "0");
    setStep(Number.isFinite(raw) ? Math.max(0, Math.min(raw, steps.length - 1)) : 0);
  }, [steps.length]);

  useEffect(() => {
    track("application_step_view", { job_slug: jobSlug, step: step + 1, total_steps: steps.length });
    const field = stepPanelRef.current?.querySelector<HTMLElement>("input:not([type=file]), textarea");
    field?.focus({ preventScroll: true });
  }, [jobSlug, step, steps.length]);

  function update(name: keyof Values, value: string) { setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); }
  function updateCustomAnswer(id: string, value: string) { track("application_custom_answer", { job_slug: jobSlug, question_id: id, answer_length: value.length }); setValues((current) => ({ ...current, custom_answers: { ...current.custom_answers, [id]: value } })); setErrors((current) => ({ ...current, [`custom_${id}`]: undefined })); }
  async function readCv(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setErrors({ cv_filename: text.cvType }); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors({ cv_filename: text.cvSize }); return; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    track("application_cv_selected", { job_slug: jobSlug, filename_extension: "pdf", bytes: file.size });
    update("cv_filename", file.name);
    update("cv_base64", btoa(binary));
  }
  function removeCv() { track("application_cv_removed", { job_slug: jobSlug }); update("cv_filename", ""); update("cv_base64", ""); if (fileInputRef.current) fileInputRef.current.value = ""; }
  function go(next: number) { track("application_step_change", { job_slug: jobSlug, from_step: step + 1, to_step: next + 1, direction: next > step ? "next" : "back" }); setStep(next); router.replace(`${pathname}?step=${next}`, { scroll: false }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function validateCurrent() {
    const next: FieldErrors = {};
    if (step === 0) { if (values.full_name.trim().length < 2) next.full_name = text.required; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) next.email = text.required; }
    if (step === 1 && values.country_timezone.trim().length < 2) next.country_timezone = text.required;
    if (step === 2) { if (values.github_url && !validHttps(values.github_url)) next.github_url = text.invalidUrl; if (values.portfolio_url && !validHttps(values.portfolio_url)) next.portfolio_url = text.invalidUrl; }
    if (step === 3 && !validHttps(values.artifact_link)) next.artifact_link = text.invalidUrl;
    if (step === 4 && values.artifact_description.trim().length < 300) next.artifact_description = text.required;
    if (step === 5 && values.motivation.trim().length < 200) next.motivation = text.required;
    const questionIndex = step - 6;
    if (questionIndex >= 0 && questionIndex < questions.length) {
      const question = questions[questionIndex];
      const answer = values.custom_answers[question.id] || "";
      if ((question.required && !answer.trim()) || answer.trim().length < question.minimum) next[`custom_${question.id}` as keyof Values] = text.required;
      if (question.type === "url" && answer && !validHttps(answer)) next[`custom_${question.id}` as keyof Values] = text.invalidUrl;
    }
    if (step === steps.length - 1 && (!values.cv_filename || !values.cv_base64)) next.cv_filename = text.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateCurrent()) return;
    setState("submitting"); setMessage(""); track("form_submit", { form_id: "careers_application", job_slug: jobSlug });
    try {
      const response = await fetch("/api/careers/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_slug: jobSlug, ...values, source: applicationSourceHint() }) });
      const data = (await response.json().catch(() => ({}))) as { code?: string; fields?: FieldErrors };
      if (!response.ok) { setErrors(data.fields || {}); setState("error"); setMessage(response.status === 429 ? text.tooMany : data.code === "duplicate" ? text.duplicate : text.failed); return; }
      setState("success"); setMessage(text.verify); track("form_success", { form_id: "careers_application", job_slug: jobSlug, source: applicationSourceHint() || "direct" });
    } catch { setState("error"); setMessage(text.timeout); }
  }
  if (state === "success") return <div role="status" className="border-y border-gray-300 py-8"><h2 className="font-serif text-3xl">{text.almost}</h2><p className="mt-3 text-text-paragraph">{message}</p><p className="mt-3 text-sm text-gray-1000">{text.expires}</p></div>;

  const input = (name: keyof Values, label: string, props: Record<string, string> = {}) => <label className="block"><span className="mb-2 block text-[13px] font-medium text-gray-1100">{label}</span><input {...props} name={name} value={typeof values[name] === "string" ? values[name] : ""} onChange={(event) => update(name, event.target.value)} className={fieldClass} />{errors[name] ? <span className="mt-2 block text-sm text-red-700">{errors[name]}</span> : null}</label>;
  const content = [
    <div key="identity" className="grid gap-5 sm:grid-cols-2">{input("full_name", text.fullName, { type: "text", autoComplete: "name" })}{input("email", text.email, { type: "email", autoComplete: "email" })}</div>,
    input("country_timezone", text.timeZone, { type: "text", placeholder: text.timePlaceholder }),
    <div key="links" className="grid gap-5 sm:grid-cols-2">{input("github_url", text.github, { type: "url", placeholder: "https://github.com/..." })}{input("portfolio_url", text.portfolio, { type: "url", placeholder: "https://..." })}</div>,
    input("artifact_link", text.artifactLink, { type: "url", placeholder: "https://..." }),
    <label key="description" className="block"><span className="mb-2 block text-[13px] font-medium text-gray-1100">{text.artifactDescription}</span><textarea name="artifact_description" value={values.artifact_description} onChange={(event) => update("artifact_description", event.target.value)} rows={8} maxLength={6000} className={`${fieldClass} min-h-40 resize-y rounded-xl`} /><span className="mt-2 block text-xs text-gray-1000">{values.artifact_description.length} / 300 minimum</span>{errors.artifact_description ? <span className="mt-2 block text-sm text-red-700">{errors.artifact_description}</span> : null}</label>,
    <label key="motivation" className="block"><span className="mb-2 block text-[13px] font-medium text-gray-1100">{text.motivation}</span><textarea name="motivation" value={values.motivation} onChange={(event) => update("motivation", event.target.value)} rows={7} maxLength={4000} className={`${fieldClass} min-h-36 resize-y rounded-xl`} /><span className="mt-2 block text-xs text-gray-1000">{values.motivation.length} / 200 minimum</span>{errors.motivation ? <span className="mt-2 block text-sm text-red-700">{errors.motivation}</span> : null}</label>,
    ...questions.map((question) => <label key={question.id} className="block"><span className="mb-2 block text-[13px] font-medium text-gray-1100">{question.label}{question.required ? " *" : ""}</span>{question.type === "textarea" ? <textarea value={values.custom_answers[question.id] || ""} onChange={(event) => updateCustomAnswer(question.id, event.target.value)} rows={6} className={`${fieldClass} min-h-32 resize-y rounded-xl`} /> : <input type={question.type === "number" ? "number" : question.type === "url" ? "url" : "text"} inputMode={question.type === "number" ? "numeric" : undefined} min={question.type === "number" ? 0 : undefined} step={question.type === "number" ? 1 : undefined} value={values.custom_answers[question.id] || ""} onChange={(event) => updateCustomAnswer(question.id, event.target.value)} className={fieldClass} />}{question.minimum ? <span className="mt-2 block text-xs text-gray-1000">Minimum {question.minimum} characters</span> : null}{errors[`custom_${question.id}` as keyof Values] ? <span className="mt-2 block text-sm text-red-700">{errors[`custom_${question.id}` as keyof Values]}</span> : null}</label>),
    <div key="cv" className="block"><span className="mb-2 block text-[13px] font-medium text-gray-1100">{text.cv}</span><div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void readCv(event.dataTransfer.files?.[0]); }} className={`rounded-3xl border border-dashed p-5 transition-colors sm:p-7 ${isDragging ? "border-gray-1200 bg-gray-100" : "border-gray-400 bg-gray-50"}`}><div className="flex flex-col items-center text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm" aria-hidden="true">↑</span><p className="mt-4 text-sm font-medium text-gray-1200">{values.cv_filename || text.cvDropTitle}</p><p className="mt-1 text-xs text-gray-1000">{text.cvDropHint}</p><input ref={fileInputRef} id="career-cv" type="file" accept="application/pdf,.pdf" onChange={(event) => void readCv(event.target.files?.[0])} className="sr-only" /><div className="mt-5 flex flex-wrap items-center justify-center gap-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full bg-gray-1200 px-4 py-2 text-xs font-medium text-white">{text.cvChoose}</button>{values.cv_filename ? <button type="button" onClick={removeCv} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs text-gray-1000">{text.cvRemove}</button> : null}</div></div></div>{errors.cv_filename ? <span className="mt-2 block text-sm text-red-700">{errors.cv_filename}</span> : null}</div>,
  ];
  return <form onSubmit={submit} noValidate aria-busy={state === "submitting"} className="min-w-0 space-y-7"><input name="website" value={values.website} onChange={(event) => update("website", event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" /><div className="space-y-3"><div className="flex items-center justify-between gap-4 text-xs font-medium text-gray-1000"><span>{text.step} {step + 1} / {steps.length}</span><span>{Math.round(((step + 1) / steps.length) * 100)}%</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"><span className="block h-full rounded-full bg-gray-1200 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div><div ref={stepPanelRef} className="min-w-0">{content[step]}</div>{message && state === "error" ? <p role="alert" className="text-sm text-gray-1000">{message}</p> : null}<div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gray-200 bg-white/95 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur"><button type="button" disabled={step === 0 || state === "submitting"} onClick={() => go(step - 1)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-1000 transition-colors hover:bg-gray-100 hover:text-gray-1200 disabled:invisible"><MinimalArrow direction="left" />{text.back}</button>{step < steps.length - 1 ? <button type="button" onClick={() => validateCurrent() && go(step + 1)} className="flex items-center gap-2 rounded-full bg-gray-1200 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-1000"><span>{text.next.replace(" →", "")}</span><MinimalArrow /></button> : <button type="submit" disabled={state === "submitting"} className="flex items-center gap-2 rounded-full bg-gray-1200 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-1000 disabled:opacity-50"><span>{state === "submitting" ? text.submitting : text.submit.replace(" →", "")}</span>{state !== "submitting" ? <MinimalArrow /> : null}</button>}</div></form>;
}
