from openai_client import chat_with_tools

TOOLS = [{
  "type":"function",
  "function":{
    "name":"lookup",
    "description":"Lookup campaign value by key",
    "parameters":{"type":"object","properties":{"key":{"type":"string"}}, "required":["key"]}
}}]

def lookup(args):
    return "https://janesmithforcongress.org/donate" if args.get("key")=="CTA_URL" else "(not found)"

EXEC = {"lookup": lookup}

print(chat_with_tools("Look up CTA_URL and write one sentence using it.",
                       tools=TOOLS, exec_map=EXEC))
