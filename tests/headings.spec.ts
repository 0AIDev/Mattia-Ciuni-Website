import { test, expect } from "@playwright/test";

/**
 * I titoli di sezione devono essere piu' grandi del testo.
 *
 * Il build gate `check-heading-sizes.mjs` garantisce che la classe di dimensione
 * ci sia, ma non che venga applicata: una classe puo' essere sovrascritta, o
 * annullata da un `inherit` ereditato. Il difetto che questo test chiude e'
 * proprio quello segnalato dagli screenshot: `Feedback` e `Voice Notes` a 16px,
 * indistinguibili dal corpo, accanto a titoli a 30px.
 *
 * La soglia non e' "uguale a 30px" perche' non e' quello che interessa. Interessa
 * che un heading sia visivamente un heading: qui si richiede almeno 1.4 volte il
 * corpo, che qualunque scala tipografica rispetta.
 */
const MIN_HEADING_RATIO = 1.4;

async function assertHeadingsAreHeadings(page: import("@playwright/test").Page) {
  const result = await page.evaluate((ratio) => {
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    // Solo gli `h2`: l'`h1` del nome in testata e' una scelta di design (18px
    // serif accanto alla foto, non un titolo di sezione) e l'`h1` di un articolo
    // ha gia' la sua classe. Il difetto segnalato riguarda i titoli di sezione,
    // quindi e` quelli che il test misura: misurare l'`h1` della testata
    // produrrebbe un falso positivo su una scelta che non si vuole toccare.
    const headings = [...document.querySelectorAll("h2")].map((element) => {
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().slice(0, 40),
        size: parseFloat(style.fontSize),
      };
    });
    return { body, headings, ratio };
  }, MIN_HEADING_RATIO);

  expect(result.body).toBeGreaterThan(0);
  // Una pagina senza `h2` non ha niente da verificare: si evita che il test
  // passi perche' non ha trovato elementi.
  expect(result.headings.length, "no section headings found on the page").toBeGreaterThan(0);
  const tooSmall = result.headings.filter((heading) => heading.size < result.body * result.ratio);
  expect(
    tooSmall,
    `headings below ${MIN_HEADING_RATIO}x the body size (${result.body}px): ${tooSmall.map((h) => `${h.tag} "${h.text}" at ${h.size}px`).join(", ")}`,
  ).toEqual([]);
}

/**
 * Negli articoli la scala e' piu' compatta: i titoli di sezione stanno a 20px
 * (`text-xl`), non a 30px, perche' l'articolo ha gia' un `h1` grande e i
 * sottotitoli non devono competere con il titolo. La soglia e' quindi piu' bassa
 * del 1.4 della home, ma resta ben sopra il corpo: il difetto da intercettare
 * era 16px, e 20px non lo e'. Si misurano solo gli `h2` dentro l'articolo, perche'
 * la pagina ne ha anche nella testata e nei blocchi correlati.
 */
const MIN_ARTICLE_HEADING_RATIO = 1.2;

async function assertArticleHeadings(page: import("@playwright/test").Page) {
  const result = await page.evaluate(() => {
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    const headings = [...document.querySelectorAll("[data-article-content] h2")].map((element) => ({
      text: (element.textContent || "").trim().slice(0, 40),
      size: parseFloat(getComputedStyle(element).fontSize),
    }));
    return { body, headings };
  });
  expect(result.headings.length, "no article section headings found").toBeGreaterThan(0);
  const tooSmall = result.headings.filter((heading) => heading.size < result.body * MIN_ARTICLE_HEADING_RATIO);
  expect(tooSmall, `article headings at body size: ${tooSmall.map((h) => `"${h.text}" at ${h.size}px`).join(", ")}`).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: home section headings are readable as headings`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    await assertHeadingsAreHeadings(page);
  });

  test(`${theme}: the localized home has the same scale`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/it/");
    await assertHeadingsAreHeadings(page);
  });

  test(`${theme}: an article keeps its section headings at heading size`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/thoughts/artifact-based-hiring/");
    await assertArticleHeadings(page);
  });
}

test("the home voice notes and videos cards use the section heading scale", async ({ page }) => {
  await page.goto("/");
  // Sono `span`, non heading: il check statico non li vede, quindi il difetto
  // dei due titoli segnalati negli screenshot sarebbe tornato senza attrapparlo.
  const cards = page.locator('a[href="/voice-notes/"] span.font-serif, a[href="/videos/"] span.font-serif');
  await expect(cards).toHaveCount(2);
  const body = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  for (const card of await cards.all()) {
    const size = parseFloat((await card.evaluate((element) => getComputedStyle(element).fontSize)) || "0");
    expect(size, "card title renders at body size").toBeGreaterThanOrEqual(body * MIN_HEADING_RATIO);
  }
});
