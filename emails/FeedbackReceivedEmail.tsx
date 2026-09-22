import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

export type FeedbackReceivedEmailProps = {
  name?: string;
  pageUrl?: string;
  submittedAt?: string;
  message?: string;
  feedbackUrl?: string;
};

const siteUrl = "https://mattiaciuni.pages.dev";
const siteEmail = "ceo@usepayle.com";

// I tre esiti possibili, così come sono scritti. La freccia è un'immagine
// (public/mail-arrow.png): in posta un'icona inline nel testo non è affidabile.
const OUTCOMES = [
  {
    lead: "It changes something",
    body: "It goes into the work, and (if you consent) into the public Feedback series with your credit.",
  },
  {
    lead: "It's a feature request",
    body: "It goes into the backlog with a written decision.",
  },
  {
    lead: "It needs a conversation",
    body: "I'll reply to this email directly.",
  },
];

/**
 * Confirmation sent to the person who submitted feedback.
 *
 * Shape of the message: a rounded image header (email-header.png, with the
 * logo baked in and the whole block linking to the feedback page), the content
 * block, then the signature. Same grammar as the cover images on the site.
 */
export function FeedbackReceivedEmail({
  name = "",
  feedbackUrl = `${siteUrl}/feedback/`,
}: FeedbackReceivedEmailProps) {
  // Il nome c'è solo se la persona l'ha lasciato: senza, il titolo resta
  // pulito e non inventa un destinatario.
  const who = name.trim();

  // Il grassetto è inline: molti client di posta scartano i fogli di stile.
  const strong = { fontWeight: 700, color: "#161616" } as const;

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char];
    });

  const nameLine = who
    ? `<span style="font-weight:700;color:#ffffff">${escapeHtml(who)}, </span>`
    : "";

  // Altezza dell'header: la stessa di prima, quando la foto stava dietro logo e
  // titolo. L'immagine è 1920x1008, quindi a 542px di larghezza ne copre ~264
  // senza deformarsi.
  const headerHeight = 264;
  const headerHtml = [
    "<!--[if mso]>",
    `<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:542px;height:${headerHeight}px;">`,
    `<v:fill type="frame" src="${siteUrl}/email-header.png" color="#161616" />`,
    '<v:textbox inset="0,0,0,0">',
    "<![endif]-->",
    `<a href="${feedbackUrl}" style="display:block;text-decoration:none;">`,
    `<div class="email-header" style="box-sizing:border-box;background-color:#161616;background-image:url(${siteUrl}/email-header.png);background-position:center center;background-repeat:no-repeat;background-size:cover;border-radius:16px;height:${headerHeight}px;padding:170px 32px 0;text-align:center;font-family:Inter,Arial,sans-serif;">`,
    `<p style="margin:0;font-family:'Instrument Serif',Georgia,serif;font-size:30px;line-height:1.08;letter-spacing:-0.02em;color:#ffffff;font-weight:400;">${nameLine}Thank you for the feedback</p>`,
    "</div>",
    "</a>",
    "<!--[if mso]>",
    "</v:textbox></v:rect>",
    "<![endif]-->",
  ].join("\n");

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          /* Su schermi stretti l'header si abbassa: l'immagine è 1920x1008 e
             con cover un riquadro alto resterebbe troppo ritagliato ai lati. */
          @media (max-width: 480px) {
            /* Su schermo stretto il titolo va più in alto: a 30px di corpo
               occupa due righe, e con il padding del desktop l'ultima riga
               finiva sotto il bordo dell'immagine. */
            .email-header {
              height: 214px !important;
              padding-top: 92px !important;
            }
          }
        `}</style>
      </Head>
      {/* Il preheader continua il subject invece di ripeterlo: nella casella si
          legge "Mattia, Your feedback reached me — and it is now in the review
          queue", una frase sola invece di due che dicono lo stesso. */}
      <Preview>
        and it is now in the review queue. I read every submission myself,
        usually within a few days.
      </Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                ink: "#161616",
                muted: "#777771",
                line: "#deded8",
                paper: "#fcfcfa",
              },
              fontFamily: {
                sans: ["Inter", "Arial", "sans-serif"],
                serif: ["Instrument Serif", "Georgia", "serif"],
              },
            },
          },
        }}
      >
        {/* Il canvas esterno resta trasparente: si vede lo sfondo della casella,
            chiaro o scuro che sia. Nessun colore nostro dietro la card. */}
        <Body className="m-0 px-4 py-8 font-sans text-ink">
          <Container className="mx-auto max-w-[560px]">
            {/* Corpo: il blocco chiaro con il contenuto. */}
            <Section className="email-card rounded-[20px] border border-[#deded8] bg-white p-2 sm:p-3">
              {/* Header come HTML grezzo: serve per il fallback VML di Outlook,
                  che non capisce background-image. Per tutti gli altri la foto
                  resta un CSS background, per Outlook diventa un riempimento
                  VML con lo stesso file e il colore scuro come base. */}
              <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

              <Section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6">
                <Text className="email-ink m-0 text-[15px] leading-6 text-ink">
                  Hi{who ? ` ${who}` : ""},
                </Text>

                <Text className="email-muted mb-0 mt-3 text-[15px] leading-6 text-muted">
                  Your feedback reached me through mattiaciuni.pages.dev, and
                  it&apos;s in the review queue.
                </Text>

                <Text className="email-ink mb-0 mt-8 font-serif text-[21px] leading-7 text-ink">
                  What happens now
                </Text>

                <Text className="email-muted mb-0 mt-4 text-[15px] leading-6 text-muted">
                  <span style={strong}>1. I read every submission myself</span>,
                  usually within a few days.
                </Text>

                <Text className="email-muted mb-0 mt-4 text-[15px] leading-6 text-muted">
                  <span style={strong}>2. Three outcomes possible:</span>
                </Text>

                {/* Le tre uscite come citazioni: nessuno sfondo, solo il filetto
                    laterale che il sito usa per i quote. La freccia resta in
                    coda alla prima riga, piccola. */}
                {OUTCOMES.map((outcome, index) => (
                  <Section
                    key={outcome.lead}
                    style={{
                      borderLeft: "2px solid #dcdcd5",
                      paddingLeft: "14px",
                      marginTop: index === 0 ? "18px" : "20px",
                    }}
                  >
                    <Text
                      className="email-ink m-0 font-serif italic text-[16px] leading-6 text-ink"
                      style={{ fontStyle: "italic" }}
                    >
                      {outcome.lead}
                      <Img
                        src={`${siteUrl}/mail-arrow.png`}
                        alt=""
                        width="12"
                        height="8"
                        style={{
                          display: "inline-block",
                          marginLeft: "7px",
                          verticalAlign: "baseline",
                          border: "0",
                          outline: "none",
                        }}
                      />
                    </Text>
                    <Text className="email-muted m-0 mt-1 text-[14px] leading-6 text-muted">
                      {outcome.body}
                    </Text>
                  </Section>
                ))}

                <Text className="email-muted mb-0 mt-6 text-[15px] leading-6 text-muted">
                  <span style={strong}>The rule I hold myself to:</span> feedback
                  that survives review never disappears silently. Either it
                  changes the work and gets published, or it gets a written
                  reason why not.
                </Text>

                <Text className="email-muted mb-0 mt-4 text-[15px] leading-6 text-muted">
                  Your message is not public yet, publication happens only after
                  review and with the contributor&apos;s approval.
                </Text>

                <Text className="email-muted mb-0 mt-4 text-[15px] leading-6 text-muted">
                  The question most people ask at this point{" "}
                  <span style={strong}>
                    how does feedback actually become part of the roadmap?
                  </span>{" "}
                  has a real answer, and I&apos;ve written it: the feedback that
                  changes the design gets published in the Feedback series, with
                  the contributor credited. The strongest corrections Payle
                  received are already there, changing how the product talks
                  about itself.
                </Text>

                <Text
                  className="email-muted mb-0 mt-4 text-[15px] italic leading-6 text-muted"
                  style={{ fontStyle: "italic" }}
                >
                  Thanks for taking the time. Most visitors browse; you wrote.
                </Text>

                {/* Firma: dentro il blocco bianco, mai una barra separata. */}
                <Hr className="my-7 border-[#deded8]" />

                <Text
                  className="email-ink m-0 text-[13px] leading-5 text-ink"
                  style={{ fontFamily: "Inter, Arial, sans-serif", fontWeight: 700 }}
                >
                  Mattia Ciuni
                </Text>
                <Text className="email-ink m-0 mt-1 font-serif text-[16px] leading-6 text-ink">
                  Founder &amp; CEO,{" "}
                  <span style={{ fontFamily: "Inter, Arial, sans-serif", fontWeight: 700 }}>
                    Payle
                  </span>
                </Text>
                <Text
                  className="email-ink m-0 mt-2 text-[12px] leading-5 text-ink"
                  style={{ fontFamily: "Inter, Arial, sans-serif", fontWeight: 500 }}
                >
                  {/* Un <a> semplice: il Link di React Email aggiunge target="_blank",
                      che su una mailto apre una scheda vuota. */}
                  <a
                    href={`mailto:${siteEmail}`}
                    style={{
                      color: "#161616",
                      textDecorationLine: "underline",
                      textDecorationColor: "#c9c9c2",
                    }}
                  >
                    {siteEmail}
                  </a>
                </Text>
                <Text
                  className="email-muted m-0 mt-3 text-[12px] italic leading-5 text-muted"
                  style={{ fontWeight: 500, fontStyle: "italic" }}
                >
                  You are receiving this e-mail because you submitted feedback
                  through the personal website of Mattia Ciuni.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default FeedbackReceivedEmail;
