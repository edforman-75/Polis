#!/usr/bin/env python3
import argparse, json, sys
try:
    from jsonschema import Draft202012Validator
except Exception:
    Draft202012Validator = None

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def validate_schema(doc, schema):
    ok = True
    if not Draft202012Validator:
        print("[WARN] jsonschema not installed. Run: pip install jsonschema", file=sys.stderr)
        return ok
    v = Draft202012Validator(schema)
    errors = sorted(v.iter_errors(doc), key=lambda e: e.path)
    for err in errors:
        print(f"[SCHEMA] {list(err.path)}: {err.message}", file=sys.stderr)
        ok = False
    return ok

def parity_checks(doc):
    ok = True
    body = (doc.get("articleBody") or "")
    for field in ("headline", "datePublished"):
        val = doc.get(field)
        if not val:
            print(f"[PARITY] Missing required field: {field}", file=sys.stderr); ok=False
        elif isinstance(val, str) and val not in body:
            print(f"[PARITY] '{field}' value not found in articleBody (heuristic).", file=sys.stderr)
    cta = doc.get("cpo:cta") or {}
    if isinstance(cta, dict):
        url = cta.get("url")
        if url and url not in body:
            print("[PARITY] CTA url not referenced in articleBody (heuristic).", file=sys.stderr)
    for claim in (doc.get("cpo:claims") or []):
        txt = claim.get("cpo:claimText","")
        if txt and txt.split(".")[0] not in body:
            print("[PARITY] Claim text not obviously referenced in articleBody (heuristic).", file=sys.stderr)
    return ok

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("jsonld", help="Path to JSON-LD file")
    ap.add_argument("--schema", default="cpo_jsonschema_v1.json", help="Path to JSON Schema")
    args = ap.parse_args()
    doc = load_json(args.jsonld)
    schema = load_json(args.schema)
    s_ok = validate_schema(doc, schema)
    p_ok = parity_checks(doc)
    if s_ok and p_ok:
        print("OK"); sys.exit(0)
    sys.exit(1)

if __name__ == "__main__":
    main()
