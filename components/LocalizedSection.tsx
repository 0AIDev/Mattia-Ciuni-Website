import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeftIcon } from "@/components/ui/arrow-up-left";
import { ChevronRight } from "@/components/icons";
import { FeedbackModalButton } from "@/components/FeedbackForm";
import { NewsletterSection } from "@/components/NewsletterSection";
import { newsletterCopy } from "@/lib/newsletter-copy";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { feedback } from "@/lib/feedback";
import { copy, localeMeta, type Locale } from "@/lib/i18n";

type Section = "about" | "work" | "thoughts" | "notes" | "feedback" | "privacy" | "terms" | "cookies" | "legal" | "newsletter" | "link" | "voice-notes" | "videos";

const sectionNames: Record<Locale, Record<Section, string>> = {
  en: { about: "About", work: "Work", thoughts: "Thoughts", notes: "Notes", feedback: "Feedback", privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookies", legal: "Legal Center", newsletter: "Newsletter", link: "Links", "voice-notes": "Voice Notes", videos: "Videos" },
  it: { about: "Chi sono", work: "Lavoro", thoughts: "Pensieri", notes: "Note", feedback: "Feedback", privacy: "Privacy", terms: "Termini di servizio", cookies: "Cookie", legal: "Centro legale", newsletter: "Newsletter", link: "Link", "voice-notes": "Note vocali", videos: "Video" },
  fr: { about: "À propos", work: "Travail", thoughts: "Réflexions", notes: "Notes", feedback: "Retours", privacy: "Confidentialité", terms: "Conditions", cookies: "Cookies", legal: "Centre juridique", newsletter: "Newsletter", link: "Liens", "voice-notes": "Notes vocales", videos: "Vidéos" },
  es: { about: "Sobre mí", work: "Trabajo", thoughts: "Ideas", notes: "Notas", feedback: "Comentarios", privacy: "Privacidad", terms: "Términos", cookies: "Cookies", legal: "Centro legal", newsletter: "Newsletter", link: "Enlaces", "voice-notes": "Notas de voz", videos: "Vídeos" },
  de: { about: "Über mich", work: "Arbeit", thoughts: "Gedanken", notes: "Notizen", feedback: "Feedback", privacy: "Datenschutz", terms: "Bedingungen", cookies: "Cookies", legal: "Rechtliches", newsletter: "Newsletter", link: "Links", "voice-notes": "Sprachnotizen", videos: "Videos" },
};

const navSections: Section[] = ["about", "work", "thoughts", "notes", "feedback"];

function LegalContent({ locale, section }: { locale: Locale; section: Section }) {
  const text = copy[locale];
  const paragraphs: Record<Section, string[]> = {
    privacy: locale === "it" ? ["Questa pagina descrive come tratto i dati quando visiti il sito.", "Raccolgo solo ciò che serve per rispondere ai feedback, gestire la newsletter e capire in forma aggregata come migliorare il sito. Gli analytics sono soggetti al consenso quando richiesto."] : ["This page describes how information is handled when you visit this site.", "Only information needed for feedback, the newsletter and aggregated product improvement is collected. Analytics are subject to consent where required."],
    terms: locale === "it" ? ["Usando questo sito accetti di rispettare i contenuti pubblicati e le regole descritte qui.", "I contenuti pubblici raccontano il lavoro di Mattia Ciuni e Payle. Non costituiscono consulenza finanziaria, legale o tecnica."] : ["By using this site you agree to respect its public content and the rules described here.", "The public content describes Mattia Ciuni's work and Payle. It is not financial, legal or technical advice."],
    cookies: locale === "it" ? ["Il sito usa storage locale per ricordare preferenze come la lingua e per evitare di mostrare due volte lo stesso suggerimento.", "Gli strumenti analytics soggetti al consenso non partono prima della tua scelta."] : ["This site uses local storage to remember preferences such as language and to avoid showing the same suggestion twice.", "Analytics tools that require consent do not start before you choose."],
    legal: locale === "it" ? ["Qui trovi i documenti legali, i contatti e le informazioni sul sito personale di Mattia Ciuni.", "Per domande scrivi a ceo@usepayle.com."] : ["This page collects the legal documents, contacts and information for Mattia Ciuni's personal site.", "For questions, write to ceo@usepayle.com."],
    newsletter: locale === "it" ? ["Ogni domenica invio una email: cosa ho spedito, cosa si è rotto, cosa ho deciso e perché.", "Niente spam e nessun growth hack. Solo il log della costruzione di Payle."] : ["Every Sunday I send one email: what I shipped, what broke, what I decided and why.", "No spam and no growth hacks. Just the log of building Payle."],
    link: [text.founder],
    "voice-notes": [text.longNotes],
    videos: [text.longNotes],
    about: [text.aboutBody], work: [text.workBody], thoughts: [text.shortThoughts], notes: [text.longNotes], feedback: [text.feedbackBody],
  };
  return <div className="space-y-5 text-text-paragraph">{paragraphs[section].map((paragraph) => <p key={paragraph} className="m-0">{paragraph}</p>)}</div>;
}

export function LocalizedSection({ locale, section }: { locale: Locale; section: Section }) {
  const text = copy[locale];
  const title = sectionNames[locale][section];
  return (
    <main id="content" className="mx-auto w-full min-w-0 max-w-[692px] overflow-x-clip px-5 py-10 leading-relaxed sm:px-6 sm:py-24">
      <header className="mb-16 flex items-center justify-between gap-4 sm:mb-24">
        <div className="flex items-center gap-4"><Link href={`/${locale}/`} aria-label={text.back} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300"><ArrowUpLeftIcon size={16} /></Link><span className="text-sm text-gray-1000">{title}</span></div>
        <Image src={`/flags/${localeMeta[locale].country.toLowerCase()}.svg`} alt={localeMeta[locale].native} className="language-flag language-flag-large" width={32} height={32} unoptimized />
      </header>

      {section === "thoughts" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="mb-5 font-serif text-3xl font-medium sm:text-4xl">{title}</h1><p className="m-0 max-w-[600px] text-text-paragraph">{text.shortThoughts}</p></section>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">{posts.map((post) => <li key={post.slug}><Link href={`/${locale}/thoughts/${post.slug}/`} className="group flex min-w-0 flex-col items-start gap-1.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"><span className="min-w-0 font-serif font-medium">{post.title}</span><span className="flex items-center gap-2 text-sm text-gray-1000">{post.category} · {post.date}<ChevronRight className="h-4 w-4" /></span></Link></li>)}</ul>
      </> : section === "notes" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="mb-5 font-serif text-3xl font-medium sm:text-4xl">{title}</h1><p className="m-0 max-w-[600px] text-text-paragraph">{text.longNotes}</p></section>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">{notes.map((note) => <li key={note.slug}><Link href={`/${locale}/notes/${note.slug}/`} className="group block py-5"><div className="overflow-hidden rounded-xl border border-gray-300 bg-preview-bg"><Image src={`/notes/${note.slug}/cover.png`} alt={note.title} width={1200} height={630} className="h-auto w-full" /></div><div className="mt-3 flex flex-wrap items-baseline justify-between gap-4"><span className="font-serif font-medium">{note.title}</span><span className="flex items-center text-sm text-gray-1000">{note.date}<ChevronRight className="ml-2 h-4 w-4" /></span></div></Link></li>)}</ul>
      </> : section === "feedback" ? <>
        <section className="mb-16 sm:mb-20"><h1 className="max-w-[560px] font-serif text-3xl font-medium leading-tight sm:text-4xl">{locale === "it" ? "Condividi ciò che vedi. Il prodotto migliora. Io lo pubblico." : "You share what you see. It gets better. I publish it."}</h1><p className="mt-5 max-w-[560px] text-text-paragraph">{text.feedbackBody}</p><div className="mt-7"><FeedbackModalButton label={text.sendFeedback} /></div></section>
        <section aria-label={title}><div className="mb-4 flex items-baseline justify-between"><h2 className="font-serif text-xl font-medium">{locale === "it" ? "Cosa dicono le persone" : "What people are saying"}</h2><span className="text-sm text-gray-1000">{feedback.length} published</span></div><div className="grid gap-3">{feedback.map((item) => <div key={item.slug} className="rounded-2xl border border-gray-300 px-5 py-4"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{item.author}</span><span className="text-gray-1000">· {item.date}</span></div><Link href={`/${locale}/feedback/${item.slug}/`} className="mt-1.5 block font-serif text-lg font-medium">{item.title}</Link><p className="mt-1 text-sm text-gray-1000">{item.description}</p></div>)}</div></section>
      </> : section === "newsletter" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-[560px] text-text-paragraph">{newsletterCopy[locale].heading} {newsletterCopy[locale].description}</p></section><NewsletterSection locale={locale} /></>
      : section === "work" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="max-w-[620px] font-serif text-4xl font-medium leading-tight sm:text-5xl">{locale === "it" ? "Costruisco sistemi che permettono al software di agire nel mondo reale." : "I build the systems that let software act in the real world."}</h1><p className="mt-6 max-w-[600px] text-lg text-text-paragraph">{text.workBody}</p></section><section className="mb-16 border-t border-gray-300 pt-8"><h2 className="font-serif text-3xl">Payle</h2><LegalContent locale={locale} section="work" /></section><section className="border-t border-gray-300 pt-8"><h2 className="font-serif text-3xl">Celeste</h2><p className="mt-5 text-text-paragraph">{locale === "it" ? "Prima di Payle ho costruito Celeste, un browser AI. L'esperienza ha mostrato il problema dell'ultimo dieci per cento: l'agente può completare il lavoro ma fermarsi davanti alla carta di credito." : "Before Payle I built Celeste, an AI browser. The experience exposed the last-ten-percent problem: an agent can complete the work and still stop at the credit card form."}</p></section>
      </> : section === "about" ? <><section className="mb-16 sm:mb-24"><h1 className="max-w-[600px] font-serif text-4xl font-medium leading-tight sm:text-5xl">{text.aboutLead}</h1><p className="mt-6 max-w-[600px] text-lg text-text-paragraph">{text.aboutBody}</p></section><section className="mb-16 border-t border-gray-300 pt-8"><h2 className="font-serif text-2xl">{locale === "it" ? "Cosa fa Mattia Ciuni" : "What Mattia Ciuni does"}</h2><LegalContent locale={locale} section="about" /></section></> : <><section className="mb-16 sm:mb-24"><h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{title}</h1><div className="mt-6 max-w-[600px]"><LegalContent locale={locale} section={section} /></div></section></>}

      <nav aria-label={text.language} className="mt-16 border-t border-gray-300">{navSections.map((target) => <Link key={target} href={`/${locale}/${target}/`} className="flex items-center justify-between border-b border-gray-300 py-4"><span className="font-serif text-lg">{sectionNames[locale][target]}</span><span className="text-gray-1000">→</span></Link>)}</nav>
    </main>
  );
}
