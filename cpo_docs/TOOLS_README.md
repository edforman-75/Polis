# CPO Tools

This folder provides browser-only tools to help maintain your CPO configuration.

## Tools
- **allowlist_editor.html** — Manage `domain_allowlist.json`
  - Add domains, sort/dedupe, validate patterns, load/save/copy JSON.
- **profiles_viewer.html** — Inspect and validate subtype profiles
  - Load `cpo_subtype_profiles.json`, search by code/label, see required & recommended fields.
  - Paste a sample PressRelease JSON-LD and validate against basic + subtype checks.

## Notes
- Everything runs locally in the browser. No data is uploaded.
- Keep your repo structure consistent so links from the main portal work:
  - `cpo_docs/` — portal & tools
  - `cpo_templates/` — authoring templates
  - `cpo_examples/` — example JSON-LDs
  - `docs/` — GitHub Pages (optional public hosting)

---

[← Back to Portal Home](index.html)
