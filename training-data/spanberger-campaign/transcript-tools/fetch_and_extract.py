#!/usr/bin/env python3
import sys, json, re, time, pathlib, subprocess, os
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

def fetch_url(url, timeout=30):
    r = requests.get(url, timeout=timeout, headers={"User-Agent":"KB-Ingest/1.2"})
    r.raise_for_status()
    return r

def html_to_text(html):
    soup = BeautifulSoup(html, "html.parser")
    for s in soup(["script", "style", "nav", "footer", "header"]):
        s.extract()
    main = soup.find("main") or soup.find("article") or soup
    paras = [p.get_text(" ", strip=True) for p in main.find_all("p")]
    text = "\n".join(p for p in paras if p)
    return re.sub(r"\n{3,}", "\n\n", text).strip()

def pdf_to_text(pdf_bytes):
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        f.flush()
        tmp_pdf = f.name
    tmp_txt = tmp_pdf + ".txt"
    try:
        subprocess.run(["pdftotext", "-layout", tmp_pdf, tmp_txt], check=True)
        return pathlib.Path(tmp_txt).read_text(encoding="utf-8", errors="ignore")
    finally:
        for p in [tmp_pdf, tmp_txt]:
            try: os.remove(p)
            except Exception: pass

def youtube_id(url):
    m = re.search(r"v=([A-Za-z0-9_-]{6,})", url)
    return m.group(1) if m else None

def youtube_captions(url):
    vid = youtube_id(url)
    if not vid: return ""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        data = YouTubeTranscriptApi.get_transcript(vid)
        return "\n".join(ch["text"] for ch in data)
    except Exception as e:
        return f"[WARN] Unable to fetch YouTube captions automatically: {e}"

def extract_record(entry):
    url = entry["source_url"]
    kind = entry["source_kind"]
    credit = urlparse(url).netloc
    if kind in ("web_html","news_html","campaign_html","university_event"):
        r = fetch_url(url)
        text = html_to_text(r.text)
    elif kind == "pdf":
        r = fetch_url(url)
        text = pdf_to_text(r.content)
    elif kind in ("youtube_cc","station_youtube_cc"):
        text = youtube_captions(url)
    elif kind in ("cspan","cspan_program"):
        text = "[INFO] For C-SPAN, export transcript/CC per cspan_export_helper.md, then run cspan_parse.py."
    else:
        raise ValueError(f"Unknown kind: {kind}")
    rec = {
        "id": entry["id"],
        "title": entry["title"],
        "speaker": entry.get("speaker"),
        "date": entry.get("date"),
        "type": entry["type"],
        "topics": entry.get("topics", []),
        "text": text,
        "source_url": url,
        "source_kind": kind,
        "credit": credit,
        "license_note": entry.get("license_note","")
    }
    return rec

def main(manifest_path="manifest.json", out_jsonl="samples/records.jsonl"):
    base = pathlib.Path(manifest_path).parent
    manifest = json.loads(pathlib.Path(manifest_path).read_text(encoding="utf-8"))
    outp = base / out_jsonl
    outp.parent.mkdir(parents=True, exist_ok=True)
    with outp.open("w", encoding="utf-8") as w:
        for e in manifest:
            try:
                rec = extract_record(e)
                w.write(json.dumps(rec, ensure_ascii=False) + "\n")
                print(f"OK {e['id']}")
                time.sleep(0.3)
            except Exception as ex:
                print(f"FAIL {e['id']}: {ex}", file=sys.stderr)

if __name__ == "__main__":
    main()
