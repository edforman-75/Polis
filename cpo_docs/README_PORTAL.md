# CPO Portal

This folder contains the **Campaign Press Office (CPO) Portal**, a simple static interface
for browsing templates, examples, and tools.

## 📂 Files
- **index.html** — main entry point, links to templates, examples, and tools
- **styles.css** — styling for the portal
- **allowlist_editor.html** — interactive editor for domain allowlist
- **profiles_viewer.html** — viewer for subtype profiles
- **README_PORTAL.md** — this file

## 🛠 Usage
1. Open `index.html` in your browser or via the Claude Code preview.
2. Use the navigation tiles to access:
   - Documentation READMEs
   - Templates (`cpo_templates/`)
   - Examples (`cpo_examples/`)
   - Interactive tools (allowlist editor, profiles viewer)
3. CI status badge will render in GitHub README from `badges/adversarial_badge.svg`.

## 🔍 Notes
- Ensure `cpo_templates/` and `cpo_examples/` exist at repo root (the portal links reference them).
- All paths are relative, so the structure should be preserved when unzipped at repo root.

---

[← Back to Portal Home](index.html)
