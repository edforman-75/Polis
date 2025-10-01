import os, json, time, uuid
from typing import List, Dict, Any, Optional
from tenacity import retry, wait_random_exponential, stop_after_attempt
from openai import OpenAI, APIError, RateLimitError

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
client = OpenAI(api_key=OPENAI_API_KEY)

def _idem_key() -> str:
    return str(uuid.uuid4())

def _retry_after(e: Exception) -> float:
    ra = getattr(getattr(e, "response", None), "headers", {}).get("retry-after")
    try: return max(1.0, float(ra)) if ra else 1.5
    except: return 1.5

@retry(wait=wait_random_exponential(multiplier=1, max=20),
       stop=stop_after_attempt(6))
def create_chat(messages: List[Dict[str, Any]],
                model: str = "gpt-4o-mini",
                tools: Optional[List[Dict[str, Any]]] = None,
                tool_choice: Optional[str] = "auto",
                timeout: int = 30,
                idempotency_key: Optional[str] = None):
    headers = {"Idempotency-Key": idempotency_key or _idem_key()}
    kwargs: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "timeout": timeout,
        "extra_headers": headers,
    }
    # Only include tools and tool_choice when tools are actually provided
    if tools:
        kwargs["tools"] = tools
        if tool_choice:
            kwargs["tool_choice"] = tool_choice

    try:
        return client.chat.completions.create(**kwargs)
    except RateLimitError as e:
        time.sleep(_retry_after(e)); raise
    except APIError as e:
        if getattr(e, "status_code", None) in (500, 502, 503, 504, 408):
            time.sleep(1.5); raise
        raise

def chat_with_tools(user_prompt: str,
                    tools: Optional[List[Dict[str, Any]]] = None,
                    exec_map: Optional[Dict[str, Any]] = None,
                    model: str = "gpt-4o-mini") -> str:
    exec_map = exec_map or {}
    tools = tools or []
    has_tools = bool(tools)

    messages = [{"role":"user","content":user_prompt}]
    resp = create_chat(messages, model=model, tools=(tools if has_tools else None),
                       tool_choice=("auto" if has_tools else None))

    while True:
        msg = resp.choices[0].message
        tcs = msg.tool_calls or []
        if not tcs:
            return msg.content or ""

        messages.append({"role":"assistant","content":msg.content,
                         "tool_calls":[tc.model_dump() for tc in tcs]})

        for tc in tcs:
            name = tc.function.name
            args = tc.function.arguments or "{}"
            try:
                parsed = json.loads(args)
            except Exception:
                parsed = {}
            fn = exec_map.get(name)
            out = "(unknown tool)" if not fn else fn(parsed)
            messages.append({
                "role":"tool", "tool_call_id":tc.id, "name":name, "content":str(out)
            })

        resp = create_chat(messages, model=model, tools=(tools if has_tools else None),
                           tool_choice=("auto" if has_tools else None))
