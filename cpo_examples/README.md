# CPO Examples

This directory contains example JSON-LD files that demonstrate how different press release types
should be marked up using the Campaign Press Office (CPO) ontology.

These examples are **reference implementations** — use them to:
- Preview how templates look when filled in with realistic content.
- Test your linter and CI workflows.
- Provide onboarding material for new contributors.

## 📑 Files

### Good Examples (JSON-LD)
- **rally_release.jsonld**
  Announcement of a rally with an embedded `Event` object.
  Demonstrates subtype `ANN.EVT.RALLY` and an RSVP call-to-action.

- **contrast_release.jsonld**
  Contrast release responding to an opponent's statement.
  Demonstrates subtype `ATT.OPP.CHAR` and includes a `cpo:Claim` with supporting evidence.

### Bad Examples (Text - Anti-patterns)
- **release_01.txt through release_25.txt**
  25 examples of POORLY WRITTEN press releases from the "Jane Smith" campaign.
  These demonstrate common mistakes and anti-patterns to AVOID:
  - Missing datelines (0/25 have proper datelines)
  - Missing or weak headlines
  - No structure (missing lead paragraphs in 21/25)
  - No quotes or weak/informal quotes
  - Vague information ("next Thursday" without date)
  - Unprofessional tone (all caps, emoticons)
  - Typos and incomplete information
  - Missing accessibility details
  - Unsubstantiated claims

  **Use for:** Parser testing, quality checking, training staff on what NOT to do.
  **Test Suite:** Run `npm run test-parser-suite` to validate parser against all 25 files.

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