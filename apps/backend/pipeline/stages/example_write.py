from __future__ import annotations
from typing import Any, Dict
import json, pathlib
from ..base import register_stage

@register_stage("example_write")
def example_write(data: Dict[str, Any], params: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    out = params.get("out","artifacts/pipeline_output.json")
    pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(out).write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding="utf-8")
    ctx["artifact_path"]=out
    return data
