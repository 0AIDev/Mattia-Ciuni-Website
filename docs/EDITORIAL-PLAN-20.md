# Mattia Ciuni editorial plan: 20 durable pieces

This plan is designed to make the site a useful source about Mattia Ciuni, Payle and the problems behind AI agent payments. It is not a list of doorway pages and it is not a promise that every keyword will rank. Each piece needs a distinct question, a first-hand point of view, a clear date, real internal links and a reason to exist even if search engines did not exist. The site should publish only claims Mattia can substantiate from his own work, public product material or clearly attributed external sources. Anything about customers, revenue, funding, security audits, partners or performance must be marked as verified only when evidence exists.

## The architecture

Use four levels. The entity hub is the home, About and Work pages: they answer who Mattia Ciuni is, what he does, how Payle relates to him, and why Celeste is part of the story. The first pillar is the conceptual explanation of AI agent payments. The second pillar covers trust, policy and security. The third covers the mechanics of reliable payment infrastructure. The fourth covers building a company and making decisions in public. Supporting articles should never be thin synonyms of a pillar. They should answer a narrower question, contain one concrete example or trade-off, and link back to the relevant pillar. Feedback is evidence of user interest and correction, not a fabricated case-study category.

## 20 planned pieces

### 1. The money layer for AI agents
**Type:** pillar. **Primary intent:** informational and entity discovery. **Primary topic:** AI agent payments infrastructure. **Working title:** “The money layer for AI agents: why autonomous work stops at payment.” Start with the Celeste observation, explain the handoff from reasoning to spending, then define controlled delegation, policy, authorization and receipts. Distinguish a capability from an unrestricted wallet. Link to `/work/`, `/about/`, the trust note and the idempotency note. Cite only public Payle material and the relevant payment standards where they are actually discussed. This is the page that should receive most internal links from the payment cluster.

### 2. How AI agents should pay without holding an unrestricted wallet
**Type:** supporting essay. **Primary intent:** informational. **Primary topic:** agent wallet versus scoped capability. Explain the vocabulary correction clearly: a wallet suggests possession, while a capability is temporary permission. Cover expiry, minimum privilege, task scope, merchant scope and revocation. Include a section on what the design does not solve, such as merchant disputes or identity. Link to the pillar, Payle and the security audit note. Do not claim regulatory approval or production guarantees unless documented.

### 3. Agent authorization is a policy problem, not a model prompt
**Type:** pillar-supporting essay. **Intent:** informational and technical. **Topic:** AI agent authorization. Compare natural-language instructions with deterministic policy checks. Explain budgets, allowlists, thresholds, time limits, approval escalation and deny-by-default behavior. Add a worked hypothetical example that is explicitly illustrative. Link to the pillar and the audit post. The piece should help a technical reader understand why a language model should not be the final payment authority.

### 4. Idempotent payments for AI agents
**Type:** supporting technical note. **Intent:** informational. **Topic:** idempotency and retries. Define the double-charge problem, show the request-key lifecycle, explain atomic claim plus decision, and discuss replayed responses. Include failure cases: timeout after authorization, duplicate webhook and client retry. Link to `/notes/idempotent-payments-for-ai-agents/`, the money-layer pillar and the audit piece. Cite the payment API documentation used for any implementation-specific claim.

### 5. What a payment receipt should tell you about an AI agent
**Type:** supporting essay. **Intent:** informational. **Topic:** verifiable receipts and auditability. Describe actor, task, policy, merchant, amount, decision, timestamp, authorization reference and outcome. Separate a receipt from a log and from a model explanation. Discuss privacy minimization: record the evidence needed to verify a decision, not every hidden prompt. Link to the pillar and the Work page. This can become a reference page for future Feedback posts.

### 6. Revoking an AI agent’s spending authority
**Type:** supporting technical essay. **Intent:** informational. **Topic:** revocation and incident response. Explain why “instant” is a measurable latency promise. Cover kill switches, short-lived credentials, in-flight requests, queued payments and operator audit trails. Include a test plan rather than claiming a latency number. Link to authorization and receipts. If the product does not yet expose a public implementation, label examples as design principles, not product features.

### 7. When the risk service is down: fail-safe payments
**Type:** technical decision record. **Intent:** informational. **Topic:** fail-safe versus fail-open. Explain the trade-off between availability, fraud risk and human approval. Define explicit states for unavailable, timeout, uncertain and approved. Link to the security audit note and the money-layer pillar. A useful conclusion is a decision framework, not a universal answer: risk depends on amount, merchant, policy and the ability to escalate.

### 8. A security audit taught me what production correctness means
**Type:** pillar-supporting narrative. **Intent:** informational and personal brand. **Topic:** secure fintech engineering. Use the existing audit story, but organize it around concurrency, immutable ledgers, destructive operations and fail-safe behavior. Every finding should say what was observed, what was changed and what test now prevents regression. Do not publish confidential auditor names or unsupported severity claims. Link to Work, Payle and the technical pieces.

### 9. The ledger that must not lie
**Type:** deep technical note. **Intent:** informational. **Topic:** hash-chained ledger integrity. Explain why a hash chain is not automatically immutable, why concurrent append needs transaction-level ordering, and how verification tests should work. Keep cryptography claims modest. A chain can be tamper-evident without being a blockchain. Link to the security audit and idempotency articles. Include pseudocode only if it matches the actual implementation or is labelled illustrative.

### 10. Why payment systems need boring failure modes
**Type:** philosophy plus engineering essay. **Intent:** informational. **Topic:** reliable fintech systems. Define boring as explicit, observable and recoverable rather than slow or unambitious. Discuss retries, queues, idempotency, manual approval, structured errors and audit trails. Link to “On boring systems”, the money-layer pillar and the Work page. This is a strong bridge between Mattia’s personal voice and the technical cluster.

### 11. What the credit-card form revealed about AI browsers
**Type:** founder narrative. **Intent:** entity discovery and informational. **Topic:** Celeste and the origin of Payle. Tell the story without pretending the browser was a failed product. Explain how a successful agent workflow revealed a financial-system boundary. Link to `/work/`, `/about/` and the pillar. The page should answer “what did Mattia Ciuni build before Payle?” naturally, not repeat a biography paragraph.

### 12. Building in public without turning feedback into theatre
**Type:** founder essay. **Intent:** informational and personal brand. **Topic:** build in public. Explain what is useful to publish: decisions, constraints, corrections and tests. Explain what should stay private: secrets, customer data and security-sensitive details. Link to Feedback, the security audit and Thoughts. This page gives context to the Feedback category and demonstrates a real editorial method.

### 13. A stranger redesigned my Payle pitch in one comment
**Type:** Feedback feature. **Intent:** entity discovery and trust. **Topic:** user feedback changing language. Preserve the exchange, show the “wallet” to “capability” correction, and publish the scorecard of what was real versus unfinished. Link to the authorization and Work pages. Make the author’s chosen credit explicit. This should be evidence of listening, not a disguised product announcement.

### 14. How to give useful feedback on a fintech product
**Type:** practical guide. **Intent:** informational and conversion-adjacent. **Topic:** feedback and product trust. Teach readers what makes feedback actionable: context, observed behavior, expected behavior, risk, affected user and suggested test. Invite submissions through the Feedback page. Link to the published exchange and the security audit. Do not promise publication; explain review and consent.

### 15. Artifact-based hiring for infrastructure work
**Type:** founder pillar-supporting essay. **Intent:** informational and recruiting. **Topic:** artifact-based hiring. Explain why a working artifact can reveal reasoning better than a title, while acknowledging the limits and accessibility concerns of work samples. Link to the existing Thought, the Work page and building-in-public pieces. Avoid implying that one hiring process is universally fair or sufficient.

### 16. What I look for in an engineer who touches money
**Type:** recruiting and technical essay. **Intent:** informational and personal brand. **Topic:** fintech engineering judgment. Cover concurrency, scope, observability, destructive operations, tests, incident communication and humility. Use anonymized or hypothetical examples unless a person has agreed to be named. Link to the audit, ledger and hiring pieces. The page should attract people who value evidence without presenting a job listing where none exists.

### 17. The difference between an agent demo and an agent product
**Type:** product strategy essay. **Intent:** informational. **Topic:** AI productization. Compare a happy-path demo with identity, permissions, retries, failure handling, support, receipts and user control. Link to the money-layer pillar, Celeste background and fail-safe article. Keep the argument grounded in what Mattia has actually built or observed.

### 18. Agentic commerce needs a trust boundary
**Type:** second pillar. **Intent:** informational and commercial research. **Topic:** agentic commerce. Define the boundary between user intent, agent action, merchant acceptance and payment authorization. Map the actors and liabilities. Link to controlled capabilities, receipts, human approval and Payle. Cite public standards or merchant documentation for external claims. This should be the canonical commerce page, preventing several near-duplicate articles from competing.

### 19. A founder’s operating system for hard technical decisions
**Type:** founder essay. **Intent:** personal brand and informational. **Topic:** decision-making. Use real examples from concurrency, security review, product language and hiring. Structure each example as assumption, evidence, decision, test and revision. Link to Thoughts, Notes, Feedback and Work. The value is the method, not generic startup advice.

### 20. What I am building next, and what I am not claiming yet
**Type:** maintained roadmap. **Intent:** navigational and entity discovery. **Topic:** current Payle work. Separate shipped, in progress, under evaluation and explicitly not built. Add a visible update date and link to the relevant evidence. Never turn it into a promise of launch dates or an investment solicitation. Link to Work, the money-layer pillar and the latest Feedback. This page can be updated periodically without changing its URL.

## Publishing sequence

In the first 30 days publish or refine pieces 1, 4, 8, 11 and 13. Together they establish the entity, the origin story, the core payment problem, technical credibility and evidence that feedback changes the work. In days 30 to 90 publish 2, 3, 5, 6, 7 and 18, then connect them with consistent anchors. In months 3 to 6 publish 9, 10, 15, 16, 17 and 19. Keep 20 as a maintained page rather than a one-off article. Each article should receive at least one link from an index or hub and should link to one parent, one related piece and one entity page.

## Editorial quality gate

Before publication, ask: Is the primary question distinct? Is the evidence first-hand or cited? Are claims about Payle current? Does the first screen tell the reader who wrote it and why? Are dates real and no later than the publication date? Is the canonical stable? Is the article linked from a relevant hub? Does the title describe the page rather than chase a query? Can a reader disagree with the argument and still learn something? If the answer is no, improve the piece before adding another URL.
