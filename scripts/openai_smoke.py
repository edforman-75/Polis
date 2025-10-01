from openai_client import create_chat, chat_with_tools

def main():
    # Plain chat
    r = create_chat([{"role":"user","content":"ping"}])
    print("plain ok:", bool(r.choices[0].message.content))

    # Tool chat
    TOOLS=[{
      "type":"function",
      "function":{
        "name":"lookup",
        "description":"Lookup campaign value by key",
        "parameters":{"type":"object","properties":{"key":{"type":"string"}}, "required":["key"]}
      }
    }]
    def lookup(a): 
        return "https://janesmithforcongress.org/donate" if a.get("key")=="CTA_URL" else "(not found)"
    out = chat_with_tools("Look up CTA_URL and write one sentence using it.", tools=TOOLS, exec_map={"lookup":lookup})
    print("tool ok:", out[:140])

if __name__ == "__main__":
    main()
