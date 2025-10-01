/* SuggestionHighlighter
   - For contentEditable #editor: wraps the sentence in <span class="suggestion-highlight">
   - For <textarea id="editor-body">: draws an overlay highlight by mirroring text metrics
*/
export const Highlighter = (() => {
  const CE_SEL = "#editor";
  const TA_SEL = "#editor-body";
  let overlay, cleanupFns = [];

  function ensureOverlay(ta) {
    if (overlay && overlay.parentNode) return overlay;
    overlay = document.createElement("div");
    overlay.className = "suggestion-overlay";
    Object.assign(overlay.style, {
      position: "absolute", pointerEvents: "none", inset: "0 0 0 0"
    });
    // mount into a positioned parent wrapper
    const wrap = ta.closest(".textarea-wrap") || (() => {
      const w = document.createElement("div");
      w.className = "textarea-wrap";
      Object.assign(w.style, { position: "relative", display: "inline-block", width: ta.offsetWidth+"px" });
      ta.parentNode.insertBefore(w, ta);
      w.appendChild(ta);
      return w;
    })();
    wrap.appendChild(overlay);
    return overlay;
  }

  function mirrorRectForRange(ta, start, end) {
    // Build a hidden mirror that replicates textarea styles and splits into pre / mark / post
    const cs = getComputedStyle(ta);
    const pre = document.createElement("span");
    const mark = document.createElement("span");
    const post = document.createElement("span");
    pre.textContent  = ta.value.slice(0, start);
    mark.textContent = ta.value.slice(start, end) || " ";
    post.textContent = ta.value.slice(end);

    const div = document.createElement("div");
    div.className = "ta-mirror";
    const pad = ["paddingTop","paddingRight","paddingBottom","paddingLeft"].map(k=>cs[k]).join(" ");
    Object.assign(div.style, {
      position:"absolute", whiteSpace:"pre-wrap", visibility:"hidden",
      font: cs.font, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
      padding: pad, border: cs.border, boxSizing: cs.boxSizing, width: ta.clientWidth + "px"
    });
    div.append(pre, mark, post);
    ta.parentNode.appendChild(div);

    const r = mark.getBoundingClientRect();
    const rDiv = div.getBoundingClientRect();
    const rect = { x: r.x - rDiv.x, y: r.y - rDiv.y, w: r.width, h: r.height };

    return { rect, node: div };
  }

  function highlightTextareaRange({ textarea, start, end }) {
    const ov = ensureOverlay(textarea);
    const { rect, node } = mirrorRectForRange(textarea, start, end);
    const hl = document.createElement("div");
    hl.className = "suggestion-rect";
    Object.assign(hl.style, { position:"absolute", left: rect.x+"px", top: rect.y+"px",
      width: Math.max(rect.w, 2)+"px", height: Math.max(rect.h, 18)+"px" });
    ov.appendChild(hl);

    // scroll into view
    const taRect = textarea.getBoundingClientRect();
    const absTop = taRect.top + rect.y;
    window.scrollTo({ top: window.scrollY + absTop - 120, behavior: "smooth" });

    // cleanup
    const remove = () => { node.remove(); hl.remove(); };
    cleanupFns.push(remove);
    return remove;
  }

  function highlightContentEditable({ root, sStart, sEnd, full, indexMap }) {
    // map flat indices back to nodes, wrap with a <span>
    const range = document.createRange();
    function locate(idx) {
      for (const r of indexMap) {
        if (idx >= r.start && idx <= r.end) {
          return { node: r.node, offset: idx - r.start };
        }
      }
      // if end aligns beyond last node
      const last = indexMap[indexMap.length-1];
      return { node: last.node, offset: last.node.nodeValue.length };
    }
    const a = locate(sStart), b = locate(sEnd);
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);

    const span = document.createElement("span");
    span.className = "suggestion-highlight";

    // Try surroundContents first, fallback to manual wrapping if it fails
    // (can fail if range spans multiple elements)
    try {
      range.surroundContents(span);
    } catch (e) {
      // Fallback: manually wrap the content
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }

    span.scrollIntoView({ block:"center", behavior:"smooth" });

    // cleanup
    const remove = () => {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    };
    cleanupFns.push(remove);
    return remove;
  }

  function clear() {
    cleanupFns.splice(0).forEach(fn => { try{fn();}catch{} });
  }

  function showForPick(pick) {
    clear();
    if (!pick) return () => {};
    if (pick.mode === "textarea") {
      const ta = pick.textarea || document.querySelector(TA_SEL);
      if (!ta) return () => {};
      return highlightTextareaRange({ textarea: ta, start: pick.sStart, end: pick.sEnd });
    } else {
      const root = pick.root || document.querySelector(CE_SEL);
      if (!root) return () => {};
      return highlightContentEditable({ root, ...pick });
    }
  }

  return { showForPick, clear };
})();
