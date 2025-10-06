from typing import Any, Dict
from ..base import register_stage

# Example: call a real function you already have
# from path.to.your_module import real_fn

@register_stage("my_real_stage")
def my_real_stage(data: Dict[str, Any], params: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    text = data.get("body", "")
    # result = real_fn(text, **params)
    # data["my_result"] = result
    data["my_result"] = {"length": len(text), "ok": True, "params_echo": params}
    return data
