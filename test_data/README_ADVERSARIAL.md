# Adversarial Markup–Prose Mismatch Dataset

This dataset stresses parity and validation by introducing intentional mismatches between page prose and JSON‑LD.

## Columns
- `doc_id`: unique id
- `primary_label_id`: taxonomy leaf (e.g., ANN.EVT.RALLY)
- `scenario_tag`: mismatch type (e.g., CTA_DOMAIN_BAD)
- `scenario_desc`: human‑readable description
- `prose_text`: the intended articleBody text
- `jsonld_snippet`: a minimal JSON‑LD object (string) with the mismatch
- `expected_violation_tags`: tags you should see triggered by your linter/validators

## Suggested Use (Claude Code)
1. Unzip this archive at repo root; **replace** any prior copies.
2. Use the CSV to unit‑test detectors. For each row:
   - Render `prose_text` into an HTML page body.
   - Embed `jsonld_snippet` into `<script type="application/ld+json">`.
   - Run `cpo_linter.py` and your schema fragments (for subtype constraints).
3. Assert that the linter / validators report the `expected_violation_tags`.

## Scenarios Covered
- HEADLINE_MISMATCH
- DATE_MISMATCH
- CTA_ABSENT_IN_PROSE
- CTA_DOMAIN_BAD
- CLAIM_NOT_IN_PROSE
- EVIDENCE_INSUFFICIENT (for sensitive subtypes like ATT.* / CRI.*)
- EVENT_MISSING (ANN.EVT.* require Event per fragments)
- POLL_METHODOLOGY_MISSING (n/MOE/dates expected in prose)
- CONTACT_PERSONAL_EMAIL

Tip: Pair these with your `domain_allowlist.json` and `claims_sensitivity_matrix.json` to tune thresholds.
