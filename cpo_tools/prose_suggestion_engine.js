/* Prose Suggestion Engine (multi-subtype, tone-aware, weighted scoring, placement) */
export const defaultHeuristics = {
  headline: { required: true, cues: ["headline","announces","statement"] },
  datePublished: { required: true, cues: ["today","on ","dated"] },
  "cpo:subtype": { required: true, cues: ["announcement","policy","endorsement","fundraising","crisis","mobilization","operations","news"] },
  endorser: { required: false, cues: ["endorses","endorsement","backed by"] },
  location: { required: false, cues: ["in ","at "] },
  "cpo:claims": { required: false, cues: ["according to","cites","research","study","estimate"] },
  "cpo:cta": { required: false, cues: ["RSVP","donate","volunteer","learn more","sign up"] }
};

export const safeArray = (x)=>Array.isArray(x)?x:(x==null?[]:[x]);

export function subtypeFamily(code=""){
  const c = String(code||"");
  if (c.startsWith("ANN.")) return "ANN";
  if (c.startsWith("POL.") || c.startsWith("POLICY.")) return "POLICY";
  if (c.startsWith("END.") || c.startsWith("ENDORSE")) return "ENDORSEMENT";
  if (c.startsWith("FUND.") || c.startsWith("FR.")) return "FUNDRAISING";
  if (c.startsWith("CRI.") || c.startsWith("CRISIS")) return "CRISIS";
  if (c.startsWith("MOB.") || c.startsWith("GRA.") || c.startsWith("MOBIL")) return "MOBILIZATION";
  if (c.startsWith("OPS.") || c.startsWith("OPER")) return "OPS";
  if (c.startsWith("NEWS.")) return "NEWS";
  return "default";
}

export function extractEntities(jsonld){
  const claims = Array.isArray(jsonld["cpo:claims"]) ? jsonld["cpo:claims"] : [];
  const subjectOf = Array.isArray(jsonld.subjectOf) ? jsonld.subjectOf : [];
  const events = subjectOf.filter(x => safeArray(x && x["@type"]).includes("Event"));
  const subtypes = safeArray(jsonld["cpo:subtype"]).filter(Boolean);
  return {
    headline: jsonld.headline || "",
    datePublished: jsonld.datePublished || "",
    subtypes,
    primarySubtype: subtypes[0] || "",
    endorser: jsonld.endorser || jsonld["cpo:endorser"] || null,
    location: jsonld.location || null,
    claims,
    cta: jsonld["cpo:cta"] || {},
    events
  };
}

export function proseCovers(text, fieldKey, entityValue, heuristics = defaultHeuristics){
  const t = (text || "").toLowerCase(); if(!t) return false;
  const rule = heuristics[fieldKey]; if(!rule) return false;
  const cuesFound = (rule.cues || []).some(c => t.includes(c.toLowerCase()));
  let literalFound = false;
  if (typeof entityValue === "string") literalFound = t.includes(entityValue.toLowerCase());
  return cuesFound || literalFound;
}

export function suggestPlacement(fieldKey, primaryFamily){
  if (fieldKey === "headline") return "headline";
  if (fieldKey === "datePublished") return "lede";
  if (fieldKey === "endorser") return primaryFamily === "ENDORSEMENT" ? "lede" : "body";
  if (fieldKey === "location") return "lede";
  if (fieldKey === "cpo:claims") return (primaryFamily === "POLICY" || primaryFamily === "CRISIS") ? "body" : "body";
  if (fieldKey === "cpo:cta") return "close";
  if (fieldKey === "Event") return (primaryFamily === "ANN" || primaryFamily === "MOBILIZATION") ? "lede" : "body";
  if (fieldKey === "cpo:subtype") return "lede";
  return "body";
}

/* Weighted coverage score.
   weightsMap: { families: { FAMILY: { field: weight, ... }, default: {...} } }
*/
export function scoreCoverage({ proseText, jsonld, heuristics = defaultHeuristics, weightsMap = null }){
  const ents = extractEntities(jsonld);
  const fam = subtypeFamily(ents.primarySubtype);
  const famWeights = (weightsMap && weightsMap.families && (weightsMap.families[fam] || weightsMap.families.default)) || null;

  // Compose candidate fields (include Event only if jsonld has an Event)
  const hasEvent = !!(ents.events && ents.events.length);
  const fields = [
    { key: "headline", val: ents.headline, required: true },
    { key: "datePublished", val: ents.datePublished, required: true },
    { key: "cpo:subtype", val: ents.subtypes.join(","), required: true },
    { key: "endorser", val: ents.endorser, required: false },
    { key: "location", val: ents.location, required: false },
    { key: "cpo:claims", val: ents.claims && ents.claims.length ? "[claims]" : null, required: false },
    { key: "cpo:cta", val: ents.cta && ents.cta.url ? ents.cta.url : null, required: false },
    { key: "Event", val: hasEvent ? (ents.events[0]?.name || "[event]") : null, required: false }
  ];

  // Determine weights per field
  const items = [];
  let totalWeight = 0;
  fields.forEach(f => {
    if (f.val == null || f.val === "") return; // only score fields present in markup
    const w = famWeights && typeof famWeights[f.key] === "number"
      ? famWeights[f.key]
      : (f.required ? 0.2 : 0.1); // fallback default if no weightsMap
    const covered = proseCovers(proseText, f.key, f.val, heuristics);
    items.push({ key: f.key, required: !!f.required, covered, value: f.val, weight: w });
    totalWeight += w;
  });

  // Normalize to 100
  const denom = totalWeight > 0 ? totalWeight : 1;
  const score = Math.round(100 * (items.reduce((acc, it) => acc + (it.covered ? it.weight : 0), 0) / denom));

  return { score, report: items, entities: ents, family: fam, totalWeight: +denom.toFixed(3) };
}

export function analyzeCoherence({ proseText, jsonld, heuristics = defaultHeuristics }){
  const ents = extractEntities(jsonld);
  const gaps = [];
  const reqs = [
    { key: "headline", val: ents.headline },
    { key: "datePublished", val: ents.datePublished },
    { key: "cpo:subtype", val: ents.subtypes.join(",") }
  ];
  const opts = [
    { key: "endorser", val: ents.endorser },
    { key: "location", val: ents.location },
    { key: "cpo:claims", val: ents.claims && ents.claims.length ? "[claims]" : null },
    { key: "cpo:cta", val: ents.cta && ents.cta.url ? ents.cta.url : null }
  ];
  for (const r of reqs){
    const covered = proseCovers(proseText, r.key, r.val, heuristics);
    if(!covered) gaps.push({ key:r.key, value:r.val, required:true });
  }
  if (ents.events.length){
    const names = ents.events.map(e => e.name).filter(Boolean);
    if (names.length && !names.some(n => proseText.toLowerCase().includes(String(n).toLowerCase()))){
      gaps.push({ key:"Event", value:names[0], required:false });
    }
  }
  for (const o of opts){
    if(!o.val) continue;
    const covered = proseCovers(proseText, o.key, o.val, heuristics);
    if(!covered) gaps.push({ key:o.key, value:o.val, required:false });
  }
  return { entities: ents, gaps };
}

function chooseSubtypeFamily(subtypes){
  return subtypeFamily(subtypes && subtypes[0]);
}

export async function generateSuggestions({ proseText, jsonld, llmFn, prompts, style = "neutral" }){
  const { gaps, entities } = analyzeCoherence({ proseText, jsonld });
  const out = [];
  const subtypes = entities.subtypes;
  const primaryFamily = chooseSubtypeFamily(subtypes);
  for (const gap of gaps){
    const tpl = pickTemplate({ gap, prompts, style, subtypes, primaryFamily });
    const filled = fillTemplate(tpl, { gap, jsonld, primarySubtype: entities.primarySubtype });
    let variants = [];
    if (llmFn){
      const sys = (prompts && prompts.system) || "";
      const styleHint = (prompts && prompts.styles && prompts.styles[style]) ? "Tone: " + prompts.styles[style] + "." : "";
      const hint = "Context subtype(s): " + subtypes.join(", ") + ". Primary family: " + primaryFamily + ".";
      const res = await llmFn({ system: sys, prompt: styleHint + "\n" + hint + "\n" + filled });
      variants = [res && res.text ? res.text.trim() : filled];
    } else {
      variants = [filled];
    }
    out.push({
      missing_field: gap.key,
      value: gap.value,
      required: !!gap.required,
      placement: suggestPlacement(gap.key, primaryFamily),
      suggestions: variants
    });
  }
  return out;
}

export function pickTemplate({ gap, prompts, style, subtypes, primaryFamily }){
  const lib = (prompts && prompts.templates) || {};
  const key = gap.key;
  const famBlock = lib[primaryFamily] || {};
  const famField = famBlock[key];
  if (famField){
    const styled = famField[style] || famField["neutral"] || famField;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }
  const byField = lib[key];
  if (byField){
    const styled = byField[style] || byField["neutral"] || byField;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }
  if (famBlock && famBlock.default){
    const styled = famBlock.default[style] || famBlock.default["neutral"] || famBlock.default;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }
  const def = lib.default || {};
  const styled = def[style] || def["neutral"] || [];
  return Array.isArray(styled) && styled.length ? styled[0] : "Write one sentence addressing {{key}} ({{value}}).";
}

export function fillTemplate(tpl, ctx){
  const subtype = ctx.primarySubtype || (ctx.jsonld && ctx.jsonld["cpo:subtype"]) || "";
  return String(tpl)
    .replaceAll("{{key}}", ctx.gap.key)
    .replaceAll("{{value}}", String(ctx.gap.value || ""))
    .replaceAll("{{subtype}}", Array.isArray(subtype)?subtype.join(","):subtype)
    .replaceAll("{{headline}}", (ctx.jsonld && ctx.jsonld.headline) || "");
}
