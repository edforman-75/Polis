/* Prose Enhancer (editor-integrated)
   - Select a sentence (or place the cursor inside one)
   - Click "Enhance" or press ⌘⇧E / Ctrl+Shift+E
   - We POST the sentence to {API_BASE}/enhance and replace the text if accepted.
*/
import { Highlighter } from './suggestion-highlighter.js';
import { SuggestionPopover } from './suggestion-popover.js';
(() => {
  // Auto-configure API_BASE from current page location
  // Priority: 1) window.CPO_API_BASE (explicit override)
  //           2) Same origin as current page
  //           3) Fallback to localhost:5055
  const API_BASE = window.CPO_API_BASE ||
                   (location.origin && location.origin !== 'null' ? location.origin.replace(/\/+$/, "") : null) ||
                   "http://127.0.0.1:5055";
  const SELECTORS = {
    textarea: "#editor-body",
    contentEditable: "#editor"
  };

  const $ = s => document.querySelector(s);

  const _undoStack = [];
  function pushUndo(replaceFn){
    _undoStack.push(replaceFn);
  }
  function popUndo(){
    const fn = _undoStack.pop();
    if (fn) try{ fn(); } catch {}
    return !!fn;
  }

  // UI
  function ensureButton() {
    if (document.querySelector("#btn-enhance-sentence")) return;
    const bar = document.querySelector(".editor-toolbar") || document.querySelector("#toolbar") || document.body;
    const btn = document.createElement("button");
    btn.id = "btn-enhance-sentence";
    btn.type = "button";
    btn.textContent = "Enhance sentence";
    btn.style.marginLeft = "0.5rem";
    btn.addEventListener("click", runEnhanceFlow);
    bar.appendChild(btn);

    const hint = document.createElement("span");
    hint.className = "hint";
    hint.style.marginLeft = "0.5rem";
    hint.style.color = "#666";
    hint.textContent = "⌘⇧E / Ctrl+Shift+E";
    bar.appendChild(hint);
  }

  // Sentence extraction helpers
  function getSelectionInTextarea(el) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = el.value;
    return { text, start, end };
  }
  function replaceRange(s, start, end, replacement) {
    return s.slice(0, start) + replacement + s.slice(end);
  }
  function expandToSentence(text, start, end) {
    // If user selected something, use that. Otherwise, expand cursor to sentence boundaries.
    if (end > start) return { sStart: start, sEnd: end };
    const left = text.lastIndexOf(".", start - 1);
    const leftQ = text.lastIndexOf("?", start - 1);
    const leftE = text.lastIndexOf("!", start - 1);
    const leftBound = Math.max(left, leftQ, leftE, -1) + 1; // move past the punctuation
    // naive forward scan to sentence end
    const m = /[.!?]/g;
    m.lastIndex = start;
    let hit, rightBound = text.length;
    while ((hit = m.exec(text))) { rightBound = hit.index + 1; break; }
    // trim whitespace
    let s = text.slice(leftBound, rightBound);
    const lOff = s.match(/^\s*/)[0].length;
    const rOff = s.match(/\s*$/)[0].length;
    const sStart = leftBound + lOff;
    const sEnd = rightBound - rOff;
    return { sStart, sEnd };
  }

  function getSelectedSentence() {
    const activeEl = document.activeElement;

    // Check if active element is any textarea
    if (activeEl && activeEl.tagName === 'TEXTAREA') {
      const { text, start, end } = getSelectionInTextarea(activeEl);
      const { sStart, sEnd } = expandToSentence(text, start, end);
      const sentence = text.slice(sStart, sEnd).trim();
      return { mode: "textarea", sentence, sStart, sEnd, textarea: activeEl };
    }

    // Check for contenteditable elements
    const elCE = $(SELECTORS.contentEditable);
    if (elCE && (activeEl === elCE || elCE.contains(activeEl))) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      // linearize CE text
      const walker = document.createTreeWalker(elCE, NodeFilter.SHOW_TEXT, null);
      let full = "", indexMap = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        indexMap.push({ node, start: full.length, end: full.length + node.nodeValue.length });
        full += node.nodeValue;
      }
      // map selection start/end to linear indices
      function nodeOffset(node, offset) {
        const rec = indexMap.find(r => r.node === node);
        return rec ? rec.start + offset : 0;
      }
      const selStart = nodeOffset(range.startContainer, range.startOffset);
      const selEnd   = nodeOffset(range.endContainer, range.endOffset);
      const { sStart, sEnd } = expandToSentence(full, selStart, selEnd);
      const sentence = full.slice(sStart, sEnd).trim();
      return { mode: "contenteditable", sentence, sStart, sEnd, full, indexMap, root: elCE };
    }
    return null;
  }

  async function callEnhance(sentence) {
    const res = await fetch(`${API_BASE}/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence })
    });
    if (!res.ok) {
      const text = await res.text().catch(()=> "");
      throw new Error(`HTTP ${res.status}${text ? ` – ${text}` : ""}`);
    }
    const data = await res.json();
    return String(data.enhanced || "").trim();
  }

  function getAnchorRect(pick) {
    if (pick.mode === "textarea") {
      const ta = pick.textarea || document.querySelector(SELECTORS.textarea);
      if (!ta) return {x:20,y:20,width:1,height:1};
      const r = ta.getBoundingClientRect();
      return { x: r.x + 12, y: r.y + (pick.lineTop || 0), width: 1, height: 24 };
    } else {
      const sel = window.getSelection(); if (!sel || sel.rangeCount===0) return {x:20,y:20,width:1,height:1};
      const range = sel.getRangeAt(0); const rect = range.getBoundingClientRect();
      return { x: rect.x, y: rect.y + rect.height, width: rect.width, height: rect.height };
    }
  }

  async function runEnhanceFlow() {
    try {
      const pick = getSelectedSentence();
      if (!pick || !pick.sentence) {
        alert("Place the cursor in a sentence (or select one) then try again.");
        return;
      }
      const cleanupHL = Highlighter.showForPick(pick);
      let enhanced = await callEnhance(pick.sentence);
      let pop = SuggestionPopover.show({
        anchorRect: getAnchorRect(pick),
        original: pick.sentence,
        draft: enhanced,
        canUndo: _undoStack.length>0,
        onApply: (finalText)=>applyChange(finalText),
        onCancel: cancelChange,
        onAnother: regenerate,
        onUndo: undoOnce
      });
      if (!enhanced) { alert("The enhancer returned an empty result."); return; }

      function applyChange(finalText){
        if (!finalText) return;
        if (pick.mode === "textarea") {
          const ta = pick.textarea;
          const t = ta.value;
          const before = t; // capture undo
          ta.value = replaceRange(t, pick.sStart, pick.sEnd, finalText);
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          const u = () => { ta.value = before; ta.dispatchEvent(new Event("input", { bubbles: true })); };
          pushUndo(u);
        } else {
          // contenteditable undo: rebuild from flat text
          let full = pick.full;
          const before = full;
          full = replaceRange(full, pick.sStart, pick.sEnd, finalText);
          // write back into nodes
          let remaining = full;
          pick.indexMap.forEach(r => {
            const slice = remaining.slice(0, r.end - r.start);
            r.node.nodeValue = slice;
            remaining = remaining.slice(slice.length);
          });
          if (remaining.length) {
            const last = pick.indexMap.at(-1);
            const tailNode = document.createTextNode(remaining);
            const root = pick.root || $(SELECTORS.contentEditable);
            (last?.node.parentNode || root).appendChild(tailNode);
          }
          const u = () => {
            // revert to 'before'
            let rem = before;
            pick.indexMap.forEach(r => {
              const slice = rem.slice(0, r.end - r.start);
              r.node.nodeValue = slice;
              rem = rem.slice(slice.length);
            });
          };
          pushUndo(u);
        }
        try{ cleanupHL && cleanupHL(); }catch{}
        try{ pop && pop.hide(); }catch{}
      }

      function cancelChange(){
        try{ cleanupHL && cleanupHL(); }catch{}
        try{ pop && pop.hide(); }catch{}
      }

      async function regenerate(){
        const newer = await callEnhance(pick.sentence);
        try{ pop && pop.update({ draft: newer, canUndo: _undoStack.length>0 }); }catch{}
      }

      function undoOnce(){
        const ok = popUndo();
        try{ pop && pop.update({ canUndo: _undoStack.length>0 }); }catch{}
        if (!ok) { /* no-op */ }
      }
    } catch (e) {
      console.error(e);
      alert(`Enhancement failed: ${e.message}`);
    }
  }

  // Keyboard shortcut: ⌘⇧E / Ctrl+Shift+E
  window.addEventListener("keydown", (ev) => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const combo = (isMac ? ev.metaKey : ev.ctrlKey) && ev.shiftKey && ev.key.toLowerCase() === "e";
    if (combo) { ev.preventDefault(); runEnhanceFlow(); }
  });

  // Install button on load
  ensureButton();
})();
