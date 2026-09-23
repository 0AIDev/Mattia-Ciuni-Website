import Image from "next/image";
import Link from "next/link";
import { HistoryBackButton } from "@/components/HistoryBackButton";
import { ChevronRight } from "@/components/icons";
import { FeedbackModalButton } from "@/components/FeedbackForm";
import { NewsletterSection } from "@/components/NewsletterSection";
import { newsletterCopy } from "@/lib/newsletter-copy";
import { posts } from "@/lib/posts";
import { notes } from "@/lib/notes";
import { feedback } from "@/lib/feedback";
import { copy, localeMeta, type Locale } from "@/lib/i18n";
import { uiCopy } from "@/lib/i18n-ui";

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
  const ui = uiCopy[locale];
  const paragraphs: Record<Section, string[]> = {
    privacy: ui.legal.privacy,
    terms: ui.legal.terms,
    cookies: ui.legal.cookies,
    legal: ui.legal.legal,
    newsletter: ui.legal.newsletter,
    link: [text.founder],
    "voice-notes": [text.longNotes],
    videos: [text.longNotes],
    about: [text.aboutBody], work: [text.workBody], thoughts: [text.shortThoughts], notes: [text.longNotes], feedback: [text.feedbackBody],
  };
  return <div className="space-y-5 text-text-paragraph">{paragraphs[section].map((paragraph) => <p key={paragraph} className="m-0">{paragraph}</p>)}</div>;
}

export function LocalizedSection({ locale, section }: { locale: Locale; section: Section }) {
  const text = copy[locale];
  const ui = uiCopy[locale];
  const title = sectionNames[locale][section];
  return (
    <main id="content" className="mx-auto w-full min-w-0 max-w-[692px] overflow-x-clip px-5 py-10 leading-relaxed sm:px-6 sm:py-24">
      <header className="mb-16 flex items-center justify-between gap-4 sm:mb-24">
        <div className="flex items-center gap-4"><HistoryBackButton fallbackHref={`/${locale}/`} fallbackLabel={text.back} /><span className="text-sm text-gray-1000">{title}</span></div>
        <Image src={`/flags/${localeMeta[locale].country.toLowerCase()}.svg`} alt={localeMeta[locale].native} className="language-flag language-flag-large" width={32} height={32} unoptimized />
      </header>

      {section === "thoughts" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="mb-5 font-serif text-3xl font-medium sm:text-4xl">{title}</h1><p className="m-0 max-w-[600px] text-text-paragraph">{text.shortThoughts}</p></section>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">{posts.map((post) => <li key={post.slug}><Link href={`/${locale}/thoughts/${post.slug}/`} className="group flex min-w-0 flex-col items-start gap-1.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"><span className="min-w-0 font-serif font-medium">{post.title}</span><span className="flex items-center gap-2 text-sm text-gray-1000">{post.category} · {post.date}<ChevronRight className="h-4 w-4" /></span></Link></li>)}</ul>
      </> : section === "notes" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="mb-5 font-serif text-3xl font-medium sm:text-4xl">{title}</h1><p className="m-0 max-w-[600px] text-text-paragraph">{text.longNotes}</p></section>
        <ul className="m-0 list-none divide-y divide-gray-300 p-0">{notes.map((note) => <li key={note.slug}><Link href={`/${locale}/notes/${note.slug}/`} className="group block py-5"><div className="overflow-hidden rounded-xl border border-gray-300 bg-preview-bg"><Image src={`/notes/${note.slug}/cover.png`} alt={note.title} width={1200} height={630} className="h-auto w-full" /></div><div className="mt-3 flex flex-wrap items-baseline justify-between gap-4"><span className="font-serif font-medium">{note.title}</span><span className="flex items-center text-sm text-gray-1000">{note.date}<ChevronRight className="ml-2 h-4 w-4" /></span></div></Link></li>)}</ul>
      </> : section === "feedback" ? <>
        <section className="mb-16 sm:mb-20"><h1 className="max-w-[560px] font-serif text-3xl font-medium leading-tight sm:text-4xl">{ui.feedbackHero}</h1><p className="mt-5 max-w-[560px] text-text-paragraph">{text.feedbackBody}</p><div className="mt-7"><FeedbackModalButton label={text.sendFeedback} locale={locale} /></div></section>
        <section aria-label={title}><div className="mb-4 flex items-baseline justify-between"><h2 className="font-serif text-xl font-medium">{ui.whatPeopleSay}</h2><span className="text-sm text-gray-1000">{feedback.length} {ui.published}</span></div><div className="grid gap-3">{feedback.map((item) => <div key={item.slug} className="rounded-2xl border border-gray-300 px-5 py-4"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{item.author}</span><span className="text-gray-1000">· {item.date}</span></div><Link href={`/${locale}/feedback/${item.slug}/`} className="mt-1.5 block font-serif text-lg font-medium">{item.title}</Link><p className="mt-1 text-sm text-gray-1000">{item.description}</p></div>)}</div></section>
      </> : section === "newsletter" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-[560px] text-text-paragraph">{newsletterCopy[locale].heading} {newsletterCopy[locale].description}</p></section><NewsletterSection locale={locale} /></>
      : section === "work" ? <>
        <section className="mb-16 sm:mb-24"><h1 className="max-w-[620px] font-serif text-4xl font-medium leading-tight sm:text-5xl">{ui.workHero}</h1><p className="mt-6 max-w-[600px] text-lg text-text-paragraph">{text.workBody}</p></section><section className="mb-16 border-t border-gray-300 pt-8"><h2 className="font-serif text-3xl">Payle</h2><LegalContent locale={locale} section="work" /></section><section className="border-t border-gray-300 pt-8"><h2 className="font-serif text-3xl">{ui.celeste}</h2><p className="mt-5 text-text-paragraph">{ui.celesteBody}</p></section>
      </> : section === "about" ? <><section className="mb-16 sm:mb-24"><h1 className="max-w-[600px] font-serif text-4xl font-medium leading-tight sm:text-5xl">{text.aboutLead}</h1><p className="mt-6 max-w-[600px] text-lg text-text-paragraph">{text.aboutBody}</p></section><section className="mb-16 border-t border-gray-300 pt-8"><h2 className="font-serif text-2xl">{ui.aboutWhat}</h2><LegalContent locale={locale} section="about" /></section></> : <><section className="mb-16 sm:mb-24"><h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">{title}</h1><div className="mt-6 max-w-[600px]"><LegalContent locale={locale} section={section} /></div></section></>}

      <nav aria-label={text.language} className="mt-16 border-t border-gray-300">{navSections.map((target) => <Link key={target} href={`/${locale}/${target}/`} className="flex items-center justify-between border-b border-gray-300 py-4"><span className="font-serif text-lg">{sectionNames[locale][target]}</span><span className="text-gray-1000">→</span></Link>)}</nav>
    </main>
  );
}
