#!/usr/bin/env python3
import sys, re, pathlib

def load_text(path):
    return pathlib.Path(path).read_text(encoding="utf-8", errors="ignore")

def from_srt(s):
    # Remove SRT indices and timestamps
    s = re.sub(r"^\d+\s*$", "", s, flags=re.M)
    s = re.sub(r"\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}", "", s)
    s = re.sub(r"\s{2,}", " ", s)
    s = re.sub(r"\n{2,}", "\n", s)
    return s.strip()

def main():
    if len(sys.argv) < 2:
        print("Usage: cspan_parse.py FILE.srt|FILE.txt", file=sys.stderr)
        sys.exit(2)
    p = pathlib.Path(sys.argv[1])
    raw = load_text(p)
    text = from_srt(raw) if p.suffix.lower() == ".srt" else raw
    # Simple cleanup of speaker labels like [Spanberger]: or SPANBERGER:
    text = re.sub(r"\[?\b[A-Z][A-Za-z]+\]?\s*:\s*", "", text)
    print(text.strip())

if __name__ == "__main__":
    main()
