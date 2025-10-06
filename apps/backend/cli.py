from __future__ import annotations
import argparse, sys, json
from .pipeline import orchestrator
from .pipeline.base import list_stages

def _cli() -> int:
    ap = argparse.ArgumentParser(prog="polis", description="Polis pipeline runner")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="Run a pipeline from a TOML config")
    r.add_argument("-p", "--pipeline", default="pipelines/default.toml")
    r.add_argument("--env", help="Inline JSON env overrides (e.g., '{\"POLIS_ENV\":\"dev\"}')", default=None)

    sub.add_parser("stages", help="List discovered stages")

    args = ap.parse_args()

    if args.cmd == "stages":
        for s in list_stages():
            print(s)
        return 0

    if args.cmd == "run":
        env = json.loads(args.env) if args.env else None
        out = orchestrator.run_from_config(args.pipeline, env=env)
        print(json.dumps(out, ensure_ascii=False))
        return 0

    return 1

if __name__ == "__main__":
    sys.exit(_cli())
