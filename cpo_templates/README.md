# CPO Templates and Examples

This directory contains JSON-LD templates and starter examples for the Campaign Press Office (CPO) system.
All templates follow a dual-layer JSON-LD pattern:
- **schema.org core**: ensures broad consumption by search engines and platforms.
- **CPO extension namespace** (`https://campaign-press-ontology.org/ns/v1#`): adds campaign‑specific semantics.

## 📂 Directories
- `cpo_templates/`: Authoring templates by release type
- `cpo_examples/`: Example files for preview and testing

## 📑 Templates
- **press_release_template.jsonld** — generic press release (all fields + taxonomy hooks)
- **statement_template.jsonld** — short form statements, often clarifications or rapid response
- **policy_release.jsonld** — policy rollout (with claims + evidence references)
- **endorsement_release.jsonld** — endorsement announcements (orgs, unions, elected officials)
- **fundraising_release.jsonld** — fundraising results/milestones (includes FEC evidence slot)
- **crisis_release.jsonld** — corrections or clarifications
- **mobilization_release.jsonld** — volunteer and grassroots event mobilizations
- **operations_release.jsonld** — operational notes (polling toplines, logistics)
- **news_article_variant.jsonld** — for pages styled as articles but still official campaign content
- **claimreview_template.jsonld** — for fact‑checking / evidence validation of claims

## 📑 Examples
- **rally_release.jsonld** — announcement of a rally with embedded Event
- **contrast_release.jsonld** — contrast release highlighting opponent’s statements

## 🛠 Usage
1. Copy the template that matches your press release type into your `press/` or `news/` directory.
2. Replace placeholder fields (`<slug>`, `<topic>`, `<Write headline>`, etc.) with real values.
3. Ensure `cpo:releaseType` and `cpo:subtype` match the taxonomy you’re enforcing.
4. For **claims**, always provide at least one `cpo:evidence` item with a working URL.
5. Use only **role-based contacts** (e.g., `press@...`), not personal emails or phones.
6. Add a `cpo:cta` where relevant (`rsvp`, `donate`, `volunteer`, `share`, `learn`).
7. Run the linter to check schema compliance, evidence counts, and CTA URL domain allowlist.

## 🔍 Notes
- Templates are designed to be neutral and high-quality; they will pass external platform validation.
- Evidence URLs should return HTTP 200 and be on your allowlist.
- Subtype-specific requirements (e.g. rally must embed an Event) are built into the linter.

---

[← Back to Portal Home](../cpo_docs/index.html)
