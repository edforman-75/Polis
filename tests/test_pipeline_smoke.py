import json, pathlib
from jsonschema import validate
from apps.backend.pipeline.orchestrator import run_from_config
from packages.schema import press_release_schema_path

def test_pipeline_smoke():
    out = run_from_config("pipelines/default.toml", env={"POLIS_ENV":"test"})
    p = pathlib.Path("artifacts/pipeline_output.json")
    data = json.loads(p.read_text(encoding="utf-8"))
    schema = json.loads(pathlib.Path(press_release_schema_path()).read_text(encoding="utf-8"))
    validate(instance=data, schema=schema)
    for k in ["doc_id","title","date","primary_label_id","score"]:
        assert k in data
