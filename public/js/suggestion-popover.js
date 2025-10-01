/* SuggestionPopover: floating preview controls near the highlighted sentence.
   API:
     const pop = SuggestionPopover.show({ anchorRect, original, draft, onApply, onCancel, onAnother, onUndo, canUndo });
     pop.update({ draft, canUndo });  pop.hide()
*/
export const SuggestionPopover = (() => {
  let el, body, txt, btnApply, btnCancel, btnAnother, btnUndo, status;

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'cpo-popover';
    el.innerHTML = \`
      <div class="cpo-popover-body">
        <div class="cpo-popover-head">Suggested rewrite</div>
        <textarea class="cpo-preview" rows="3"></textarea>
        <div class="cpo-actions">
          <button class="cpo-apply">Apply</button>
          <button class="cpo-another">Another</button>
          <button class="cpo-undo" disabled>Undo</button>
          <button class="cpo-cancel">Cancel</button>
        </div>
        <div class="cpo-status"></div>
      </div>\`;
    document.body.appendChild(el);
    body = el.querySelector('.cpo-popover-body');
    txt = el.querySelector('.cpo-preview');
    btnApply = el.querySelector('.cpo-apply');
    btnCancel = el.querySelector('.cpo-cancel');
    btnAnother = el.querySelector('.cpo-another');
    btnUndo = el.querySelector('.cpo-undo');
    status = el.querySelector('.cpo-status');
    return el;
  }

  function place(anchorRect) {
    const pad = 8;
    const vw = window.innerWidth;
    const x = Math.min(Math.max(anchorRect.x, pad), vw - 360 - pad);
    const y = Math.max(anchorRect.y + anchorRect.height + pad + window.scrollY, window.scrollY + 8);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function focusTextarea() {
    txt.focus(); txt.select();
  }

  function show({ anchorRect, original, draft, onApply, onCancel, onAnother, onUndo, canUndo }) {
    ensure();
    txt.value = draft || original || '';
    btnUndo.disabled = !canUndo;
    status.textContent = 'Enter: apply • Esc: cancel • Shift+Enter: another';
    el.style.display = 'block';
    place(anchorRect);
    focusTextarea();

    const key = (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); onCancel?.(); }
      else if (ev.key === 'Enter' && ev.shiftKey) { ev.preventDefault(); onAnother?.(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); onApply?.(txt.value.trim()); }
      else if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase()==='z') { ev.preventDefault(); onUndo?.(); }
    };
    const onApplyClick = () => onApply?.(txt.value.trim());
    const onCancelClick = () => onCancel?.();
    const onAnotherClick = () => onAnother?.();
    const onUndoClick = () => onUndo?.();

    document.addEventListener('keydown', key);
    btnApply.addEventListener('click', onApplyClick);
    btnCancel.addEventListener('click', onCancelClick);
    btnAnother.addEventListener('click', onAnotherClick);
    btnUndo.addEventListener('click', onUndoClick);

    return {
      update({ draft, canUndo }) {
        if (typeof draft === 'string') { txt.value = draft; focusTextarea(); }
        if (typeof canUndo === 'boolean') btnUndo.disabled = !canUndo;
        place(anchorRect);
      },
      hide() {
        el.style.display = 'none';
        document.removeEventListener('keydown', key);
        btnApply.removeEventListener('click', onApplyClick);
        btnCancel.removeEventListener('click', onCancelClick);
        btnAnother.removeEventListener('click', onAnotherClick);
        btnUndo.removeEventListener('click', onUndoClick);
      }
    };
  }

  function hide() { if (el) el.style.display='none'; }
  return { show, hide };
})();
