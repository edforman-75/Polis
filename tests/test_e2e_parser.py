import json, pathlib
from jsonschema import validate
from packages.schema import press_release_schema_path
from apps.backend.smoke_runner import parse_press_release

def test_fixture_exists():
    assert pathlib.Path("tests/fixtures/sample_press_release.txt").exists()

def test_schema_and_golden_match():
    schema = json.loads(pathlib.Path(press_release_schema_path()).read_text(encoding="utf-8"))
    txt = pathlib.Path("tests/fixtures/sample_press_release.txt").read_text(encoding="utf-8")
    pr = parse_press_release(txt, "fixture://sample_press_release")
    validate(instance=pr.__dict__, schema=schema)
    golden = json.loads(pathlib.Path("tests/fixtures/sample_press_release.golden.json").read_text(encoding="utf-8"))
    for k in ["doc_id","title","date","primary_label_id","score"]:
        assert pr.__dict__[k] == golden[k]
