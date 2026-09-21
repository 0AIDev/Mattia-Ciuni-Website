import Image from "next/image";

/**
 * L'immagine che sta in pagina sopra il titolo: la copertina dell'articolo
 * (`cover.png`, la stessa card social ma **senza il logo** e col testo centrato),
 * dentro il riquadro delle anteprime — angoli tondi, bordo sottile, ombra leggera.
 *
 * `p-1` è il padding di 4px del riquadro: 4px fra il bordo esterno e l'immagine.
 * Nessun `alt`: il titolo è due righe sotto, e ripeterlo non aiuta nessuno —
 * è decorazione, non contenuto.
 */
export function CoverImage({ src }: { src: string }) {
  return (
    <figure className="mb-10">
      <div className="rounded-2xl bg-gray-background p-1 shadow-custom">
        <div className="overflow-hidden rounded-xl border border-gray-400 bg-preview-bg">
          <Image
            src={src}
            alt=""
            width={1200}
            height={630}
            priority
            className="w-full select-none"
          />
        </div>
      </div>
    </figure>
  );
}
