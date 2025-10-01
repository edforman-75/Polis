/**
 * Minimal, framework-agnostic helpers for:
 *  1) "What to add next" (choose highest-weight missing field, emit prose)
 *  2) "Copy JSON-LD claims summary" (one-line, source-aware recap)
 *
 * Usage (vanilla):
 *   const jsonld = JSON.parse(textarea.value);
 *   const next = suggestNextProse(jsonld, subtypeProfile, {tone:"professional"});
 *   const recap = composeClaimRecap(jsonld);
 */

// Simple subtype profile example: required/optional with weights
// Replace/augment with your real cpo_subtype_profiles.json at runtime.
const SAMPLE_PROFILES = {
  "ANN.GEN": {
    required: [
      {path: "headline", weight: 1.0, hint: "Add a clear headline naming candidate + action."},
      {path: "about", weight: 0.8, hint: "Add a one-sentence mission or biography hook."},
      {path: "actionPlatform", weight: 0.8, hint: "Add 2–3 bullets on the concrete action."}
    ],
    optional: [
      {path: "location.name", weight: 0.5, hint: "Add location context (city/venue)."},
      {path: "event.startDate", weight: 0.4, hint: "Add time/date if relevant."},
      {path: "isAccessibleForFree", weight: 0.3, hint: "Clarify registration/cost if relevant."}
    ]
  }
};

// Safe getter (dot-path), returns undefined if any segment missing
function get(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && k in acc ? acc[k] : undefined), obj);
}
function isNonEmpty(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return String(v).trim().length > 0;
}

function findMissingWithWeights(jsonld, profile) {
  const items = [...(profile.required||[]), ...(profile.optional||[])];
  return items
    .map(it => ({...it, present: isNonEmpty(get(jsonld, it.path))}))
    .filter(it => !it.present)
    .sort((a,b) => b.weight - a.weight);
}

// Basic, tone-aware sentence generator for a field + hint
function proseForField(fieldPath, hint, ctx) {
  const {tone="professional", candidate="Jane Smith", office="U.S. House"} = ctx||{};
  const t = tone;
  const map = {
    headline: `${candidate} announces campaign update for ${office}.`,
    about: `${candidate} is a two-term mayor and a mom of three focused on jobs, clean energy, and safer communities.`,
    actionPlatform: `The campaign outlines specific next steps on jobs, clean energy, and lowering costs for families.`,
    "location.name": `The event will be hosted in Cleveland to maximize accessibility for local supporters.`,
    "event.startDate": `The announcement is scheduled for October 15 at 6:00 PM local time.`,
    "isAccessibleForFree": `Attendance is free; RSVP is encouraged to help with planning.`
  };
  const base = map[fieldPath] || `Add content for “${fieldPath}”.`;
  // Subtle tone variations (can expand later)
  const wrap = {
    professional: s => s,
    energetic: s => `Great news: ${s}`,
    concise: s => s.replace(/\.\s*$/, ''),
  }[t] || (s=>s);
  return wrap(base) + (base.endsWith('.')?'':'.') + (hint ? ` (${hint})` : '');
}

// PUBLIC: choose the highest-weight missing field and produce one sentence
export function suggestNextProse(jsonld, profile=SAMPLE_PROFILES["ANN.GEN"], ctx) {
  const missing = findMissingWithWeights(jsonld, profile);
  if (missing.length === 0) {
    return {field: null, text: "All high-priority fields are present. Consider tightening copy or adding quotes."};
  }
  const top = missing[0];
  return {field: top.path, text: proseForField(top.path, top.hint, ctx)};
}

// PUBLIC: compose a one-line, source-aware claim recap (for lede/body)
export function composeClaimRecap(jsonld) {
  // Look for embedded claims: jsonld.claims[] = { id, text, sources: [{url}], rating? }
  const claims = Array.isArray(jsonld.claims) ? jsonld.claims : [];
  if (!claims.length) return "No verifiable claims listed.";
  // Pick the strongest claim (first with sources) and include one source host
  const pick = claims.find(c => Array.isArray(c.sources) && c.sources.length) || claims[0];
  const url = (pick.sources && pick.sources[0] && pick.sources[0].url) || "";
  const host = (() => { try { return new URL(url).host; } catch { return ""; } })();
  const snippet = pick.text.length > 140 ? pick.text.slice(0,137) + "…" : pick.text;
  return `${snippet}${host ? ` (source: ${host})` : ""}`;
}

// DOM helpers for drop-in buttons (optional)
export function wireSuggestionButtons({jsonldSelector, nextBtnSelector, recapBtnSelector, outputSelector, subtype="ANN.GEN"}) {
  const txt = document.querySelector(jsonldSelector);
  const out = document.querySelector(outputSelector);
  const nextBtn = document.querySelector(nextBtnSelector);
  const recapBtn = document.querySelector(recapBtnSelector);
  const profile = SAMPLE_PROFILES[subtype] || SAMPLE_PROFILES["ANN.GEN"];

  function parseJSON() { try { return JSON.parse(txt.value); } catch { return {}; } }

  if (nextBtn) nextBtn.addEventListener('click', () => {
    const res = suggestNextProse(parseJSON(), profile, {tone:"professional"});
    if (out) out.value = res.text; else alert(res.text);
  });

  if (recapBtn) recapBtn.addEventListener('click', async () => {
    const text = composeClaimRecap(parseJSON());
    // copy to clipboard
    try { await navigator.clipboard.writeText(text); } catch {}
    if (out) out.value = text; else alert(text);
  });
}
