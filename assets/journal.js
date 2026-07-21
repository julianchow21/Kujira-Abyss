/* Journal miniature: a small typeable block editor with keyboard handling
   and a simulated realtime-sync indicator. Entirely local, no network calls. */
(function () {
  'use strict';

  function init() {
    const root = document.getElementById('jr-widget');
    if (!root) return;
    const doc = root.querySelector('.jr-doc');
    const syncEl = root.querySelector('.jr-sync');
    const addButtons = Array.from(root.querySelectorAll('.jr-toolbar [data-add]'));

    let idCounter = 0;
    let lastFocusedId = null;
    let saveTimer = null;

    function nextId() { return 'b' + (++idCounter); }

    function setSync(state) {
      syncEl.classList.remove('saving', 'synced');
      if (state === 'saving') {
        syncEl.classList.add('saving');
        syncEl.querySelector('.label').textContent = 'Saving…'.replace('…', '...');
      } else {
        syncEl.classList.add('synced');
        const t = new Date();
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        syncEl.querySelector('.label').textContent = 'Synced ' + hh + ':' + mm;
      }
    }

    function queueSync() {
      setSync('saving');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => setSync('synced'), 650);
    }

    function makeBlock(type, content, checked) {
      const id = nextId();
      const el = document.createElement('div');
      el.className = 'jr-block';
      el.dataset.type = type;
      el.dataset.id = id;

      if (type === 'check') {
        el.innerHTML =
          '<span class="box' + (checked ? ' done' : '') + '" role="checkbox" aria-checked="' + !!checked + '" tabindex="0"></span>' +
          '<span class="text" contenteditable="true" data-placeholder="Checklist item"></span>';
        el.classList.toggle('done', !!checked);
        el.querySelector('.text').textContent = content || '';
        const box = el.querySelector('.box');
        box.addEventListener('click', () => toggleCheck(el));
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCheck(el); }
        });
      } else {
        el.setAttribute('contenteditable', 'true');
        el.textContent = content || '';
      }
      bindBlockEvents(el);
      return el;
    }

    function toggleCheck(el) {
      const box = el.querySelector('.box');
      const done = !el.classList.contains('done');
      el.classList.toggle('done', done);
      box.classList.toggle('done', done);
      box.setAttribute('aria-checked', String(done));
      queueSync();
    }

    function editableTarget(block) {
      return block.dataset.type === 'check' ? block.querySelector('.text') : block;
    }

    function blockList() { return Array.from(doc.querySelectorAll('.jr-block')); }

    function refreshEmptyState() {
      const existing = doc.querySelector('.jr-empty');
      if (blockList().length === 0) {
        if (!existing) {
          const empty = document.createElement('div');
          empty.className = 'jr-empty';
          empty.innerHTML = 'This page is empty. <button type="button" class="pill-link" data-add="text" style="display:inline-flex;margin-left:8px;">+ Start writing</button>';
          doc.appendChild(empty);
          empty.querySelector('button').addEventListener('click', () => insertBlock('text', null, ''));
        }
      } else if (existing) {
        existing.remove();
      }
    }

    function insertBlock(type, afterId, content, checked) {
      const empty = doc.querySelector('.jr-empty');
      if (empty) empty.remove();
      const block = makeBlock(type, content, checked);
      const afterEl = afterId ? doc.querySelector('[data-id="' + afterId + '"]') : null;
      if (afterEl && afterEl.nextSibling) doc.insertBefore(block, afterEl.nextSibling);
      else doc.appendChild(block);
      queueSync();
      focusBlock(block, true);
      return block;
    }

    function focusBlock(block, atEnd) {
      const target = editableTarget(block);
      target.focus();
      if (atEnd) {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      lastFocusedId = block.dataset.id;
    }

    function bindBlockEvents(block) {
      const target = editableTarget(block);
      target.addEventListener('focus', () => { lastFocusedId = block.dataset.id; });
      target.addEventListener('input', queueSync);
      target.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          insertBlock('text', block.dataset.id, '');
        } else if (e.key === 'Backspace') {
          const empty = target.textContent.length === 0;
          if (empty) {
            const list = blockList();
            if (list.length > 1) {
              e.preventDefault();
              const idx = list.indexOf(block);
              const prev = list[idx - 1] || list[idx + 1];
              block.remove();
              queueSync();
              refreshEmptyState();
              if (prev) focusBlock(prev, true);
            } else {
              e.preventDefault();
              block.remove();
              refreshEmptyState();
              queueSync();
            }
          }
        }
      });
    }

    addButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        insertBlock(btn.dataset.add, lastFocusedId, '');
      });
    });

    // seed content
    doc.appendChild(makeBlock('h1', 'Field notes'));
    doc.appendChild(makeBlock('quote', 'Cloud primary from day one. Every block syncs before it is read twice.'));
    doc.appendChild(makeBlock('text', 'Type in this box. Press enter for a new block, backspace at the start of an empty block to remove it.'));
    doc.appendChild(makeBlock('check', 'Block editor', true));
    doc.appendChild(makeBlock('check', 'Realtime sync indicator', true));
    doc.appendChild(makeBlock('check', 'Single user, deliberately', false));

    refreshEmptyState();
    setSync('synced');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
