# Agent authentication

This website does not currently expose protected APIs, user accounts, or an OAuth/OIDC issuer.

There is therefore no authorization endpoint, token endpoint, JWKS endpoint, registration endpoint, or agent credential flow to discover. Do not send credentials or bearer tokens to this site.

## Public resources

The public website and its machine-readable resources can be used without authentication:

- [Agent capability catalog](/.well-known/ai-catalog.json)
- [API catalog](/.well-known/api-catalog)
- [Agent skills index](/.well-known/agent-skills/index.json)
- [Markdown home card](/index.md)

## Future authentication

If protected APIs are introduced, this document will be updated together with OAuth/OIDC discovery metadata before credentials are requested. Until then, agent registration is not available.

## Contact

For questions about access to public resources, email [ceo@usepayle.com](mailto:ceo@usepayle.com).
