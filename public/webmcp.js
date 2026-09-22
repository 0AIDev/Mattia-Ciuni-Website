(() => {
  const modelContext = navigator.modelContext;
  if (!modelContext || window.__mattiaciuniWebMcp) return;
  window.__mattiaciuniWebMcp = true;

  const sameOriginPublicUrl = (value) => {
    try {
      const url = new URL(value, location.href);
      if (url.origin !== location.origin) return null;
      if (url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname.startsWith("/api/")) return null;
      return url;
    } catch {
      return null;
    }
  };

  const tools = [
    {
      name: "read_current_page",
      description: "Read the visible text, title, and canonical URL of the current public Mattia Ciuni page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => ({
        url: location.href,
        title: document.title,
        text: (document.querySelector("main") || document.body).innerText.slice(0, 12000),
      }),
    },
    {
      name: "find_site_content",
      description: "Find public pages and links on the current Mattia Ciuni page matching a search query.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Words to search for" } },
        required: ["query"],
        additionalProperties: false,
      },
      execute: async ({ query = "" }) => {
        const needle = String(query).toLowerCase().trim();
        return [...document.querySelectorAll("main a[href]")]
          .map((element) => ({ title: (element.textContent || "").trim(), url: element.href }))
          .filter((item) => !needle || item.title.toLowerCase().includes(needle) || item.url.toLowerCase().includes(needle))
          .slice(0, 20);
      },
    },
    {
      name: "search_site_archive",
      description: "Search the public machine-readable archive of Mattia Ciuni's pages, thoughts, notes, and feedback.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "A topic, title, or phrase to search" } },
        required: ["query"],
        additionalProperties: false,
      },
      execute: async ({ query = "" }) => {
        const needle = String(query).toLowerCase().trim();
        const response = await fetch("/rag/index.json", { credentials: "same-origin" });
        if (!response.ok) return { error: "The public archive is temporarily unavailable." };
        const data = await response.json();
        return (data.entries || [])
          .filter((entry) => !needle || `${entry.title} ${entry.description} ${entry.content}`.toLowerCase().includes(needle))
          .slice(0, 12)
          .map((entry) => ({ title: entry.title, description: entry.description, url: new URL(entry.url, location.origin).href, type: entry.type }));
      },
    },
    {
      name: "open_site_page",
      description: "Open a public same-origin page on the Mattia Ciuni website.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string", description: "A public same-origin path such as /thoughts/" } },
        required: ["path"],
        additionalProperties: false,
      },
      execute: async ({ path }) => {
        const url = sameOriginPublicUrl(path);
        if (!url) return { error: "Only public same-origin paths are allowed." };
        location.assign(url.href);
        return { opened: url.href };
      },
    },
    {
      name: "list_site_sections",
      description: "List the public sections of the Mattia Ciuni website and what each contains.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => ({
        sections: [
          { name: "About", url: new URL("/about/", location.origin).href, description: "Who Mattia Ciuni is and what he is building." },
          { name: "Thoughts", url: new URL("/thoughts/", location.origin).href, description: "Essays on AI agents, payments, and building Payle." },
          { name: "Notes", url: new URL("/notes/", location.origin).href, description: "Longer notes on systems, people, and ideas." },
          { name: "Feedback", url: new URL("/feedback/", location.origin).href, description: "Published feedback from people interested in Payle." },
          { name: "Videos", url: new URL("/videos/", location.origin).href, description: "Founder videos and the visual work log." },
          { name: "Voice Notes", url: new URL("/voice-notes/", location.origin).href, description: "Spoken notes from Mattia Ciuni." },
        ],
      }),
    },
  ];

  if (typeof modelContext.provideContext === "function") {
    modelContext.provideContext({ tools });
  } else if (typeof modelContext.registerTool === "function") {
    tools.forEach((tool) => modelContext.registerTool(tool));
  }

  addEventListener("pagehide", () => {
    if (typeof modelContext.provideContext === "function") modelContext.provideContext({ tools: [] });
    else if (typeof modelContext.unregisterTool === "function") tools.forEach((tool) => modelContext.unregisterTool(tool.name));
  }, { once: true });
})();
