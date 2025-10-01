from flask import Flask, request, jsonify
from flask_cors import CORS
from openai_client import create_chat

app = Flask(__name__)
CORS(app, resources={r"/enhance": {"origins": "*"}})

SYSTEM = "You are a campaign copy editor. Return exactly one sentence, polished, matching a professional civic tone."

@app.post("/enhance")
def enhance():
    data = request.get_json(force=True) or {}
    sentence = (data.get("sentence") or "").strip()
    if not sentence:
        return jsonify({"error":"missing sentence"}), 400
    msgs = [
        {"role":"system","content":SYSTEM},
        {"role":"user","content":f"Polish this sentence, keep the meaning and length similar:\n\n{sentence}"}
    ]
    resp = create_chat(msgs, model="gpt-4o-mini")
    text = resp.choices[0].message.content
    return jsonify({"enhanced": text})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5055, debug=True)
