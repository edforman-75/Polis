from __future__ import annotations
from typing import Any, Dict
import re
from ..base import register_stage

@register_stage("example_label")
def example_label(data: Dict[str, Any], params: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    text = f"{data.get('title','')}\n{data.get('body','')}"
    label = "ANN.EVT.RALLY" if re.search(r"rally|event|town hall", text, re.I) else "ANN.GEN.STATEMENT"
    data["primary_label_id"] = label
    data["score"] = 5.0
    return data
