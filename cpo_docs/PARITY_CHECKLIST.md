# Parity Checklist & Weighted Coverage

## What it shows
- A row per **field found in markup** (headline, datePublished, subtype, Event, CTA, etc.).
- **Status**: covered (prose references the field) or missing.
- **Weight**: importance of this field for the current subtype family.
- **Contribution**: how much the covered field adds to the total parity score.

## Weights
- Defined in `cpo_tools/lint/weights.json` by **subtype family**.
- You can tune weights to emphasize different priorities:
  - MOBILIZATION: Event & CTA heavier.
  - POLICY: Claims & evidence heavier.
  - FUNDRAISING: CTA heavier.

## Score
- Normalized to **0–100** using the weights of fields present in the page's markup.
- Colors:
  - **Red** < 60
  - **Amber** 60–89
  - **Green** >= 90

## Tips
- If a field is **not in markup**, it's not counted — either add it to markup or adjust prose expectations.
- Use the **placement buttons** to insert missing lines in sensible spots (headline, lede, body, close).

---
[← Back to Portal Home](index.html)
