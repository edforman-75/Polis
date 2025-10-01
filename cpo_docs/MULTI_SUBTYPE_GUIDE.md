# Multi-Subtype Support (AI Optimization)

Can a single release use multiple subtypes?
Yes, when a release legitimately spans categories (for example, a rally announcement that also launches a policy and includes a donation CTA).

Recommended practice
- Set `cpo:subtype` as an array when appropriate, ordered by importance:
  "cpo:subtype": ["ANN.EVT.RALLY", "POLICY.ROLLOUT"]
- Include required objects for each chosen subtype:
  - ANN.EVT.RALLY -> include an Event in `subjectOf[]`
  - FUNDRAISING -> include a CTA URL
  - POLICY -> include claims and evidence where applicable
- Keep prose parity: mention in the prose the elements declared in markup (endorser, event, CTA).

Linting
- Accept arrays for `cpo:subtype`.
- Validate union requirements across all subtypes present.
- Warn on incompatible combinations (for example, CRISIS + ENDORSEMENT without clarifying language).
- Error if required objects for any declared subtype are missing.

Suggestion Engine
- Reads arrays in `cpo:subtype`.
- Picks templates based on the primary family of the first subtype, with fallbacks.
- Includes tone hints in the LLM prompt (neutral, campaign, journalistic, concise, confident).

---
[← Back to Portal Home](index.html)
