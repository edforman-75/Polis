#!/usr/bin/env python3
import json, sys, re, pathlib

def clean_jsonc(text):
    # Remove /* */ block comments first
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    # Remove // line comments (but not in URLs like https://)
    # Only match // at the start of line (with optional whitespace)
    text = re.sub(r'^\s*//.*$', '', text, flags=re.MULTILINE)
    # Remove ⟪PLACEHOLDERS⟫ if empty
    text = re.sub(r'⟪.*?⟫', '', text)
    return text.strip()

def process_file(path):
    out = path.with_suffix('.json')
    try:
        raw = path.read_text(encoding='utf-8')
        cleaned = clean_jsonc(raw)
        json_obj = json.loads(cleaned)
        out.write_text(json.dumps(json_obj, indent=2, ensure_ascii=False))
        print(f"✅ {path.name} → {out.name}")
    except Exception as e:
        print(f"❌ {path.name}: {e}")

def main():
    # Work from either repo root or mockup directory
    if pathlib.Path('mockup/data').exists():
        base = pathlib.Path('mockup/data')
    elif pathlib.Path('data').exists():
        base = pathlib.Path('data')
    else:
        print("❌ Could not find data directory")
        sys.exit(1)

    for file in base.glob('*.jsonc'):
        process_file(file)

if __name__ == "__main__":
    main()
