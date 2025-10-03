#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CLI wrapper for plausible-deniability detector.
- Input: text file or JSONL (auto-detected) via --in or STDIN
- Output: JSONL to --out or STDOUT, one object per flagged sentence
- Patterns: external JSON (plausible_deniability_patterns.json)
"""

import sys, re, json, argparse, os
from pathlib import Path
from typing import Any, Dict, List, Tuple, Iterable

# ---------- Config / Loader ----------

def load_cfg(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def compile_cfg(cfg: Dict[str, Any]) -> Dict[str, Any]:
    pat = []
    for p in cfg["patterns"]:
        pat.append({**p, "compiled": re.compile(p["rx"], re.I)})
    cfg["_compiled_patterns"] = pat
    cfg["_claimy_rx"] = re.compile("|".join(cfg["claimy_words"]), re.I) if cfg.get("claimy_words") else None
    cfg["_rhet_q_rx"] = re.compile(r"^(?:%s)\b" % "|".join(cfg["rhet_question_stems"]), re.I) if cfg.get("rhet_question_stems") else None
    cfg["_sent_split"] = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9""(\[])')
    return cfg

# ---------- Core detector (same logic as tests, config-driven) ----------

def detect_sentences(text: str, cfg: Dict[str, Any], threshold: float) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    offsets: List[Tuple[int, int, str]] = []
    start = 0
    t = text.strip()
    if not t:
        return results

    for part in cfg["_sent_split"].split(t):
        s = part.strip()
        if not s:
            continue
        idx = text.find(s, start)
        if idx == -1:
            idx = start
        offsets.append((idx, idx + len(s), s))
        start = idx + len(s)

    for (s_start, s_end, sent) in offsets:
        matched, score = [], 0.0
        sent_lc = sent.lower()

        for p in cfg["_compiled_patterns"]:
            if p["compiled"].search(sent_lc):
                matched.append({"id": p["id"], "label": p["label"]})
                score += float(p["weight"])

        if cfg.get("_claimy_rx") and cfg["_claimy_rx"].search(sent):
            score += float(cfg["boosts"].get("claiminess", 0.0))

        if sent.strip().endswith("?") and cfg.get("_rhet_q_rx") and cfg["_rhet_q_rx"].search(sent):
            score += float(cfg["boosts"].get("rhetorical_question", 0.0))

        score = min(float(cfg["boosts"].get("max_score", 1.0)), score)

        if matched and score >= threshold:
            labels = sorted({m["label"] for m in matched})
            results.append({
                "span": {"start": s_start, "end": s_end},
                "sentence": sent,
                "score": round(score, 2),
                "labels": labels,
                "matched_patterns": matched
            })

    return results

# ---------- I/O helpers ----------

def iter_jsonl(fp: Iterable[str]) -> Iterable[Dict[str, Any]]:
    for line in fp:
        line = line.strip()
        if not line:
            continue
        try:
            yield json.loads(line)
        except json.JSONDecodeError:
            # If auto-detect guessed wrong, caller should force --format text
            raise

def is_probably_jsonl(sample: str) -> bool:
    sample = sample.strip()
    if not sample:
        return False
    try:
        json.loads(sample.splitlines()[0])
        return True
    except Exception:
        return False

def read_all(path: str) -> str:
    with (sys.stdin if path == "-" else open(path, "r", encoding="utf-8")) as f:
        return f.read()

# ---------- Main CLI ----------

def main():
    ap = argparse.ArgumentParser(description="Detect plausible-deniability phrasing and output JSONL of flagged sentences.")
    ap.add_argument("--in", dest="inp", default="-", help="Input file path or '-' for STDIN (text or JSONL).")
    ap.add_argument("--out", dest="out", default="-", help="Output path or '-' for STDOUT (JSONL).")
    ap.add_argument("--patterns", dest="patterns", default="plausible_deniability_patterns.json", help="Path to patterns JSON.")
    ap.add_argument("--format", dest="fmt", choices=["auto","text","jsonl"], default="auto", help="Input format.")
    ap.add_argument("--text-field", dest="text_field", default="text", help="JSONL field name containing text.")
    ap.add_argument("--id-field", dest="id_field", default="doc_id", help="Optional JSONL field for document ID.")
    ap.add_argument("--threshold", dest="threshold", type=float, default=None, help="Score threshold (default from patterns JSON).")
    args = ap.parse_args()

    pat_path = Path(args.patterns)
    if not pat_path.exists():
        print(f"ERROR: patterns file not found: {pat_path}", file=sys.stderr)
        sys.exit(2)

    cfg = compile_cfg(load_cfg(pat_path))
    threshold = args.threshold if args.threshold is not None else float(cfg["meta"].get("default_threshold", 0.5))

    # Prepare writer
    out_fp = sys.stdout if args.out == "-" else open(args.out, "w", encoding="utf-8")

    try:
        # Read input
        raw = read_all(args.inp)

        # Auto-detect format if needed
        fmt = args.fmt
        if fmt == "auto":
            fmt = "jsonl" if is_probably_jsonl(raw[:2000]) else "text"

        doc_id_base = os.path.basename(args.inp) if args.inp not in ("-", "") else "STDIN"

        if fmt == "text":
            flagged = detect_sentences(raw, cfg, threshold)
            # Emit: one JSON record per flagged sentence
            for i, rec in enumerate(flagged, start=1):
                out = {
                    "doc_id": doc_id_base,
                    "sentence_id": i,
                    "span": rec["span"],
                    "sentence": rec["sentence"],
                    "score": rec["score"],
                    "labels": rec["labels"],
                    "matched_patterns": rec["matched_patterns"],
                    "meta": {"threshold": threshold, "source": args.inp}
                }
                out_fp.write(json.dumps(out, ensure_ascii=False) + "\n")

        else:  # jsonl
            # Iterate input lines as records
            line_no = 0
            for obj in iter_jsonl(raw.splitlines()):
                line_no += 1
                text = obj.get(args.text_field, "")
                if not isinstance(text, str) or not text.strip():
                    continue
                doc_id = str(obj.get(args.id_field, f"{doc_id_base}#{line_no}"))
                flagged = detect_sentences(text, cfg, threshold)
                sid = 0
                for rec in flagged:
                    sid += 1
                    out = {
                        "doc_id": doc_id,
                        "sentence_id": sid,
                        "span": rec["span"],
                        "sentence": rec["sentence"],
                        "score": rec["score"],
                        "labels": rec["labels"],
                        "matched_patterns": rec["matched_patterns"],
                        "meta": {"threshold": threshold, "source": args.inp, "jsonl_line": line_no}
                    }
                    out_fp.write(json.dumps(out, ensure_ascii=False) + "\n")

    finally:
        if out_fp is not sys.stdout:
            out_fp.close()

if __name__ == "__main__":
    main()
