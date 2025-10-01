# CPO Examples

This directory contains example JSON-LD files that demonstrate how different press release types
should be marked up using the Campaign Press Office (CPO) ontology.

These examples are **reference implementations** — use them to:
- Preview how templates look when filled in with realistic content.
- Test your linter and CI workflows.
- Provide onboarding material for new contributors.

## 📑 Files
- **rally_release.jsonld**
  Announcement of a rally with an embedded `Event` object.
  Demonstrates subtype `ANN.EVT.RALLY` and an RSVP call-to-action.

- **contrast_release.jsonld**
  Contrast release responding to an opponent's statement.
  Demonstrates subtype `ATT.OPP.CHAR` and includes a `cpo:Claim` with supporting evidence.

## 🛠 Usage
1. Copy an example into your working directory if you need a starting point.
2. Replace Jane Smith content with your campaign's actual details.
3. Confirm that subtype-specific requirements are satisfied (e.g., events require `Event`).
4. Run the linter to verify compliance (CTA, evidence, contacts, domains, etc.).

## 🔍 Notes
- Examples are tied to the same dual-layer JSON-LD context as templates (`schema.org` + CPO).
- They use **role-based contacts** only (`press@janesmithforcongress.org`).
- URLs and claims are illustrative — replace them with real campaign data.

---

[← Back to Portal Home](../cpo_docs/index.html)