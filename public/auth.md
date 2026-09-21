# auth.md — agent authentication

This website has no OAuth/OIDC issuer or agent registration flow. Its public resources
are readable without credentials. One private, human-only admin endpoint exists for
feedback review, but it is not an agent API and does not issue OAuth tokens. Do not send
credentials or bearer tokens to public resources on this site.

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

If this site ever exposes a protected API for agents, an issuer and registration flow
will be published **before** any credential is requested, and this file will change with
them. The current `/api/admin/feedback` endpoint remains deliberately outside that flow.

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
