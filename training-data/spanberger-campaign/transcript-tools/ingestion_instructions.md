# Ingestion Instructions (v3)

- New `source_kind` values: `cspan_program`, `station_youtube_cc`, `university_event`.
- For **C‑SPAN** entries: use the included helper to capture captions/transcripts.
- For **station YouTube** entries: replace the channel URL with a specific `watch?v=` URL and run the fetcher (requires `youtube-transcript-api`).

## Recommended Workflow
1) Identify the exact story/program URL, update `manifest.json` with the final link.  
2) Run `fetch_and_extract.py` to pull HTML/PDF text and YouTube captions.  
3) For C‑SPAN, follow `cspan_export_helper.md` to export a transcript and then run `cspan_parse.py` to normalize text.  
4) Ingest `samples/records.jsonl` into your KB.
