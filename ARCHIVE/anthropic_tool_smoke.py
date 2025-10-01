import os, json
from anthropic import Anthropic, APIStatusError

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
assert API_KEY, "Set ANTHROPIC_API_KEY"

client = Anthropic(api_key=API_KEY)

TOOLS = [{
  "name": "lookup",
  "description": "Lookup campaign value by key",
  "input_schema": {
    "type": "object",
    "properties": {"key": {"type": "string"}},
    "required": ["key"]
  }
}]

def exec_lookup(inp: dict) -> str:
  return "https://janesmithforcongress.org/donate" if inp.get("key")=="CTA_URL" else "(not found)"

# 1) First call: allow tools
first = client.messages.create(
  model="claude-3-5-sonnet-latest",
  max_tokens=256,
  tools=TOOLS,
  messages=[{
    "role":"user",
    "content":[{"type":"text","text":"Look up CTA_URL and write one sentence using it."}]
  }]
)

print("=== assistant (first) ===")
print(json.dumps(first.dict(), indent=2)[:1200], "...\n")

# Collect tool_use blocks in order
tool_uses = []
for block in first.content:
  if block.type == "tool_use":
    tool_uses.append(block)

if not tool_uses:
  # No tools requested — just print assistant text
  text = "".join([b.text for b in first.content if getattr(b, "type", "")=="text"])
  print("No tool calls. Assistant said:", text)
  raise SystemExit(0)

# 2) Execute and build tool_result blocks (ID-for-ID, same order). MUST be next message.
results = []
for tu in tool_uses:
  out = exec_lookup(tu.input) if tu.name == "lookup" else "(unknown tool)"
  results.append({
    "type": "tool_result",
    "tool_use_id": tu.id,             # EXACT id match
    "content": [{"type":"text","text": out}]
  })

# 3) Second call: strict history
#    (a) original user turn
#    (b) assistant tool_use turn (exact content from first)
#    (c) user tool_result turn (array of tool_result blocks) — IMMEDIATELY NEXT
second = client.messages.create(
  model="claude-3-5-sonnet-latest",
  max_tokens=256,
  tools=TOOLS,
  tool_choice="none",                 # prevent another tool call in this step
  messages=[
    {"role":"user","content":[{"type":"text","text":"Look up CTA_URL and write one sentence using it."}]},
    {"role":"assistant","content":[b.dict() for b in first.content]},
    {"role":"user","content":results}
  ]
)

print("=== assistant (final) ===")
print(json.dumps(second.dict(), indent=2)[:1200], "...\n")

# Pretty print final text
final_text = "".join([b.text for b in second.content if getattr(b, "type","")=="text"])
print("FINAL:", final_text)
