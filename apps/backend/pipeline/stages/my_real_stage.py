from typing import Any, Dict
from ..base import register_stage

@register_stage("my_real_stage")
def my_real_stage(data: Dict[str, Any], params: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal adapter example. Replace the placeholder with calls into your real module.
    Access inputs from `data` and parameters from `params`. Put results back into `data`.
    """
    text = data.get("body", "")
    # Example placeholder "processing"
    data["my_result"] = {
        "length": len(text),
        "ok": True,
        "params_echo": params,
    }
    return data
