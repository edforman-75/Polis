# C‑SPAN Export Helper

C‑SPAN often provides captions or transcripts for programs. When available, do this:

1. Open the program page (URL from `manifest.json` with `source_kind = cspan_program`).  
2. Look for **Transcript** or **Closed Captions** options; if downloadable, save as `.srt` or `.txt`.  
3. If only an on‑page transcript is available, copy the text manually.  
4. Save to a file, e.g., `cspan_raw/PROGRAM_ID.srt` or `cspan_raw/PROGRAM_ID.txt`.  
5. Run `cspan_parse.py PROGRAM_ID.srt > PROGRAM_ID.txt` to normalize to plain text.

> Always follow C‑SPAN’s terms of use. Keep copies for internal research only.
