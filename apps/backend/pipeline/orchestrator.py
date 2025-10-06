from __future__ import annotations
from typing import Any, Dict, List, Tuple
import importlib, pkgutil, pathlib, tomllib, os, json
from .base import run_pipeline

def _auto_import_stages(pkg_root: str = "apps.backend.pipeline.stages") -> None:
    pkg = importlib.import_module(pkg_root)
    pkg_path = pathlib.Path(pkg.__file__).parent
    for mod in pkgutil.iter_modules([str(pkg_path)]):
        importlib.import_module(f"{pkg_root}.{mod.name}")

def _load_plan(path: str) -> List[Tuple[str, Dict[str, Any]]]:
    p = pathlib.Path(path)
    raw = tomllib.load(p.open("rb"))
    stages = raw.get("stages", [])
    plan: List[Tuple[str, Dict[str, Any]]] = []
    for item in stages:
        if isinstance(item, str):
            plan.append((item, {}))
        elif isinstance(item, dict) and "name" in item:
            params = {k: v for k, v in item.items() if k != "name"}
            plan.append((item["name"], params))
        else:
            raise ValueError(f"Invalid stage item: {item}")
    return plan

def run_from_config(pipeline_path: str,
                    env: Dict[str, Any] | None = None) -> Dict[str, Any]:
    _auto_import_stages()
    plan = _load_plan(pipeline_path)
    context: Dict[str, Any] = {"env": dict(os.environ), "config_path": pipeline_path}
    if env: context["env"].update(env)
    data: Dict[str, Any] = {}
    out = run_pipeline(plan, data, context)
    out_path = context.get("artifact_path") or "artifacts/pipeline_output.json"
    pathlib.Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(out_path).write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    return out
