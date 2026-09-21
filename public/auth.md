# auth.md — agent authentication

This website does not expose protected APIs, user accounts, an OAuth/OIDC issuer or an
agent registration flow. There is therefore **no credential to obtain** and no token
endpoint to call. Do not send credentials or bearer tokens to this site: every public
resource here is readable without them, and no endpoint accepts them.

## Public resources

These documents answer `200` and need no authentication:

- [Agent capability catalog](/.well-known/ai-catalog.json)
- [API catalog](/.well-known/api-catalog)
- [Agent skills index](/.well-known/agent-skills/index.json)
- [Markdown home card](/index.md)
- [Site summary for models](/llms.txt)

## OAuth and OIDC

There is no authorization server on this origin, so the documents that describe one are
deliberately absent rather than filled with placeholders:

- `/.well-known/oauth-authorization-server` → `404`, intentionally
- `/.well-known/openid-configuration` → `404`, intentionally

The one OAuth metadata document that **does** exist is
[`/.well-known/oauth-protected-resource`](/.well-known/oauth-protected-resource)
(RFC 9728). It describes this origin as a public resource and declares an **empty** list
of authorization servers, scopes and bearer methods: an empty list is the honest answer,
not a missing field. A `404` at that path would leave an agent wondering if it had looked
in the wrong place.

If this site ever protects an API for agents, the metadata, an issuer and a registration
flow will be published **before** any credential is requested, and this file will change
with them.

## No MCP server

There is no MCP server here, so no server card is published: a card pointing at an
endpoint that does not speak the protocol would be worse than no card. The machine
surface of this site is the list above, plus the markdown card of every page (the page
address with `.md`).

## The one protected endpoint

`/api/admin/feedback` is my private feedback review queue. It authenticates with a single
secret header that is not issued to anyone, is not an OAuth flow, and is not for agents.
Everything else on the origin is public.

## Contact

For questions about access to public resources, email
[ceo@usepayle.com](mailto:ceo@usepayle.com).
