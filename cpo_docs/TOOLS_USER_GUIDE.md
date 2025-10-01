# CPO Tools — Human User Guide

This guide explains the **Domain Allowlist Editor** and **Subtype Profiles Viewer**, which are part of the Campaign Press Office (CPO) system.  

Both tools run entirely in your web browser. No data leaves your computer.

---

## 1️⃣ Domain Allowlist Editor (`cpo_docs/allowlist_editor.html`)

### Purpose
Manages the `domain_allowlist.json` file, which defines trusted domains for call-to-action (CTA) links, press release evidence, and other outbound references.

### What it does
- Add, sort, and deduplicate domains.
- Validate domains with ✓ (good) or ⚠ (invalid).
- Delete entries or clear the entire list.
- Load, save, or copy JSON.
- Show raw JSON preview in real time.

### Why it matters
Prevents unsafe or off-brand links from creeping into press releases.

### How to test
1. Open the page in your browser.
2. Add `nytimes.com` → should show ✓.
3. Add `not a domain` → should show ⚠.
4. Add `cnn.com` twice → *Sort & Dedupe* removes the duplicate.
5. Delete a domain.
6. Download JSON and open it in a text editor.
7. Copy JSON and paste to verify.

### Example starter allowlist

```json
{
  "version": 1,
  "updated": "2025-09-30T00:00:00Z",
  "notes": "Starter allowlist for Jane Smith for Congress campaign",
  "allowed_domains": [
    "janesmithforcongress.org",
    "secure.actblue.com",
    "mobilize.us",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
    "vimeo.com",
    "nytimes.com",
    "washingtonpost.com",
    "cnn.com",
    "npr.org"
  ]
}
```

---

## 2️⃣ Subtype Profiles Viewer (`cpo_docs/profiles_viewer.html`)

### Purpose
Explores and validates `cpo_subtype_profiles.json` — the subtype schema profiles that define requirements for each press release category.

### What it does
- Load subtype profiles JSON.
- Search and filter by subtype code or label.
- Show required and recommended fields for each subtype.
- Paste and validate a PressRelease JSON-LD.

### Why it matters
Ensures campaign press releases follow consistent rules for AI and search.

### How to test
1. Load `cpo_subtype_profiles.json`.
2. Click `ANN.EVT.RALLY` in the sidebar.
3. Note required `Event` field.
4. Paste a JSON-LD PressRelease with a rally event.
5. Validate → should say *All checks passed*.
6. Remove the `subjectOf` block and validate again → should show an error.

---

## 3️⃣ Portal Integration

- Tools linked from **cpo_docs/index.html** under *Interactive Tools*.
- Docs provided:
  - `TOOLS_README.md` (overview)
  - `TOOLS_USER_GUIDE.md` (this guide)

---

## ✅ Human QA Checklist

- Open both tools in browser.
- Load example files.
- Perform all actions (add, delete, sort, validate).
- Confirm warnings and errors work.
- Verify raw JSON matches changes.

---

[← Back to Portal Home](index.html)
