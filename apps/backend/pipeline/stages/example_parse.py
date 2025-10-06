from __future__ import annotations
from typing import Any, Dict
import pathlib, re
from datetime import date
from ..base import register_stage

@register_stage("example_parse")
def example_parse(data: Dict[str, Any], params: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    src = params.get("fixture", "tests/fixtures/sample_press_release.txt")
    text = pathlib.Path(src).read_text(encoding="utf-8")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    title = lines[0] if lines else "Untitled"
    dash = r"[-\u2010\u2011\u2012\u2013\u2014]"
    m = re.search(rf"(20\d{{2}}){dash}(\d{{2}}){dash}(\d{{2}})", text)
    dt = f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else date.today().isoformat()
    body = "\n".join(lines[1:]).strip()
    return {"doc_id": "SAMPLE-SPANBERGER-0001","title": title,"date": dt,"body": body,"source": "fixture://sample_press_release"}
