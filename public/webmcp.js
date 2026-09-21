(() => {
  const context = navigator.modelContext;
  if (!context || typeof context.registerTool !== "function" || window.__mattiaciuniWebMcp) return;
  window.__mattiaciuniWebMcp = true;
  const controller = new AbortController();
  const sameOrigin = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin ? url : null;
    } catch {
      return null;
    }
  };
  const register = (tool) => context.registerTool(tool, { signal: controller.signal });

  register({
    name: "read_current_page",
    description: "Read the visible text and canonical URL of the current Mattia Ciuni page.",
    inputSchema: { type: "object", properties: {} },
    execute: async () => ({
      url: location.href,
      title: document.title,
      text: (document.querySelector("main") || document.body).innerText.slice(0, 12000),
    }),
  });

  register({
    name: "find_site_content",
    description: "Find visible links on the current page matching a search query.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Words to search for" } },
      required: ["query"],
    },
    execute: async ({ query = "" }) => {
      const needle = String(query).toLowerCase();
      return [...document.querySelectorAll("main a[href]")]
        .map((element) => ({ title: (element.textContent || "").trim(), url: element.href }))
        .filter((item) => !needle || item.title.toLowerCase().includes(needle) || item.url.toLowerCase().includes(needle))
        .slice(0, 20);
    },
  });

  register({
    name: "open_site_page",
    description: "Open a public same-origin page on the Mattia Ciuni website.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "A same-origin path such as /thoughts/" } },
      required: ["path"],
    },
    execute: async ({ path }) => {
      const url = sameOrigin(path);
      if (!url) return { error: "Only same-origin paths are allowed." };
      location.href = url.href;
      return { opened: url.href };
    },
  });

  addEventListener("pagehide", () => controller.abort(), { once: true });
})();
