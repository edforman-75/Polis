# LLM Proxy Setup (for Tone-Matched Suggestions)

**Why a proxy?** Never expose API keys in client-side code. The editor calls `/api/llm`, and your server adds the key.

## Minimal Express.js proxy (example)

```js
// server.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/llm', async (req, res) => {
  const { system, prompt, provider = 'openai', model = 'gpt-4o-mini', temperature = 0.3, maxTokens = 180 } = req.body;
  try {
    // Example: OpenAI responses API (pseudo; adapt to your client lib)
    const oaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        input: prompt,
        system
      })
    });
    const data = await oaiRes.json();
    const text = data?.output?.[0]?.content?.[0]?.text ?? data?.choices?.[0]?.text ?? '';
    res.json({ text });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('LLM proxy on 3000'));
```

Deploy this alongside your portal (or as a serverless function). The editor will call `/api/llm` automatically.

---
[← Back to Portal Home](index.html)
