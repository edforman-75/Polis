from __future__ import annotations
import json, os, re, sys, pathlib
from dataclasses import dataclass, asdict
from datetime import date

FIXTURE_TXT = os.getenv("POLIS_SMOKE_TXT", "tests/fixtures/sample_press_release.txt")
ARTIFACT_OUT = os.getenv("POLIS_SMOKE_OUT", "artifacts/smoke_output.json")

@dataclass
class PressRelease:
    doc_id: str
    title: str
    date: str
    body: str
    source: str
    primary_label_id: str
    score: float

def _extract_iso_date(text: str) -> str:
    dash = r"[-\u2010\u2011\u2012\u2013\u2014]"
    m = re.search(rf"(20\d{{2}}){dash}(\d{{2}}){dash}(\d{{2}})", text)
    if m:
        y, mm, dd = m.group(1), m.group(2), m.group(3)
        return f"{y}-{mm}-{dd}"
    return date.today().isoformat()

def parse_press_release(text: str, source: str) -> PressRelease:
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    title = lines[0] if lines else "Untitled"
    dt = _extract_iso_date(text)
    body = "\n".join(lines[1:]).strip()
    primary = "ANN.EVT.RALLY" if re.search(r"rally|event|town hall", text, re.I) else "ANN.GEN.STATEMENT"
    score = 5.0
    doc_id = "SAMPLE-SPANBERGER-0001"
    return PressRelease(
        doc_id=doc_id, title=title, date=dt, body=body, source=source,
        primary_label_id=primary, score=score
    )

def main() -> int:
    path = pathlib.Path(FIXTURE_TXT)
    if not path.exists():
        print(f"Fixture not found: {path}", file=sys.stderr)
        return 2
    text = path.read_text(encoding="utf-8")
    source = "fixture://sample_press_release"
    pr = parse_press_release(text, source)
    out = pathlib.Path(ARTIFACT_OUT)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(asdict(pr), indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(asdict(pr), ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
