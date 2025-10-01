/* LLM Client shim
   IMPORTANT: Do NOT call foundation model APIs directly from the browser with secrets.
   Set up a lightweight proxy endpoint (e.g., /api/llm) server-side that injects the API key.
   This client calls that proxy with {system, prompt, temperature, maxTokens}.

   Example proxy contract (POST /api/llm):
   body: { system, prompt, temperature, maxTokens, provider?, model? }
   resp: { text: "..." }
*/
export async function llmInvoke({ system, prompt, temperature = 0.3, maxTokens = 180, provider = "auto", model = "auto" }) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt, temperature, maxTokens, provider, model })
  });
  if (!res.ok) {
    const msg = await res.text().catch(()=>String(res.status));
    throw new Error("LLM proxy error: " + msg);
  }
  const data = await res.json();
  if (!data || typeof data.text !== "string") throw new Error("LLM proxy: invalid response shape");
  return { text: data.text };
}

/* Local dev fallback (no server): generate a trivial echo so the UI remains usable */
export async function llmFallback({ prompt }) {
  const line = (String(prompt).split("\n").pop() || "").trim();
  return { text: line || "Draft a clear, single-sentence update aligned to the missing field." };
}
