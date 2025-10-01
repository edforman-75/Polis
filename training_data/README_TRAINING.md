# Training Dataset — Import & Usage (Claude Code)

## Files
- `press_release_training_dataset.csv` — labeled samples (doc_id, primary_label_id, score, sample_text, annotator_notes)
- `press_release_quality_rubric.md` — global scoring rubric (1–5)
- `press_release_quality_definitions.md` — high vs low cues by subtype

## How to use in Claude Code
1. Upload this entire `training_dataset.zip` and unzip in your workspace.
2. If any files already exist, **replace/overwrite** to avoid duplicates.
3. For fine-tuning or evaluation pipelines, load `press_release_training_dataset.csv` and stratify by `primary_label_id` and `score`.
4. Use `annotator_notes` as weak labels or to craft feature prompts (“reward explicit evidence links; penalize missing CTA for event releases”).
5. Keep your subtype taxonomy consistent with `cpo_subtype_profiles.json` (in your main bundle).

## Tips
- Balance batches across subtypes and scores.
- Augment with your real releases; keep CPO markup parity for future supervised signals.
- Consider train/validation/test splits by `doc_id` prefix to avoid leakage (e.g., split by subtype).
