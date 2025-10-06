from __future__ import annotations
from typing import Any, Callable, Dict, List, Tuple
import time

StageFn = Callable[[Dict[str, Any], Dict[str, Any], Dict[str, Any]], Dict[str, Any]]
_REGISTRY: Dict[str, StageFn] = {}

def register_stage(name: str) -> Callable[[StageFn], StageFn]:
    def deco(fn: StageFn) -> StageFn:
        key = name.strip()
        if key in _REGISTRY:
            raise ValueError(f"Stage '{key}' already registered")
        _REGISTRY[key] = fn
        return fn
    return deco

def get_stage(name: str) -> StageFn:
    if name not in _REGISTRY:
        raise KeyError(f"Stage '{name}' not found. Known: {sorted(_REGISTRY)}")
    return _REGISTRY[name]

def list_stages() -> List[str]:
    return sorted(_REGISTRY)

def run_pipeline(plan: List[Tuple[str, Dict[str, Any]]],
                 data: Dict[str, Any],
                 context: Dict[str, Any]) -> Dict[str, Any]:
    timings: List[Dict[str, Any]] = []
    context.setdefault("timings", timings)
    for stage_name, params in plan:
        fn = get_stage(stage_name)
        t0 = time.perf_counter()
        data = fn(data, params, context)
        dt = time.perf_counter() - t0
        timings.append({"stage": stage_name, "seconds": round(dt, 6)})
    return data
