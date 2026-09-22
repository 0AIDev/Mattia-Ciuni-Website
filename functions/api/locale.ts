interface Context {
  request: Request;
}

export const onRequestGet = async ({ request }: Context): Promise<Response> => {
  const country = (request.headers.get("CF-IPCountry") || "").slice(0, 2).toUpperCase();
  return new Response(JSON.stringify({ country: /^[A-Z]{2}$/.test(country) ? country : null }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
