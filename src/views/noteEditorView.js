const { layout, icon, esc } = require('./layout');

const YJS = 'https://esm.sh/yjs@13.6.33';
const QUILL = 'https://esm.sh/quill@2.0.3';
const Y_QUILL = 'https://esm.sh/y-quill@1.0.0?deps=yjs@13.6.33,quill@2.0.3';

function noteEditorView(note) {
  const id = note.id;
  const content = `
    <div class="editor-bar">
      <div class="status" id="status"><span class="dot"></span><span id="statusText">Connexion…</span></div>
      <div class="actions">
        <span class="badge" id="presence" hidden>${icon('users')} <span></span></span>
        <a class="btn btn-sm" href="/n/${esc(id)}/txt">${icon('note')} Version texte</a>
        <button class="btn btn-sm" type="button" id="copyLink">${icon('link')} Copier le lien</button>
        <form method="POST" action="/admin/notes/${esc(id)}/delete" onsubmit="return confirm('Supprimer définitivement cette note pour tout le monde ?')">
          <button class="btn btn-ghost btn-icon btn-danger" type="submit" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>
        </form>
      </div>
    </div>

    <noscript><p>JavaScript est désactivé : <a href="/n/${esc(id)}/txt">lire la note en version texte</a>.</p></noscript>

    <input class="note-title" id="title" type="text" placeholder="Sans titre" value="${esc(note.title)}" maxlength="120" autocomplete="off" />

    <div class="card editor-card">
      <div id="toolbar">
        <span class="ql-formats"><select class="ql-header"><option value="1"></option><option value="2"></option><option value="3"></option><option selected></option></select></span>
        <span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button><button class="ql-strike"></button></span>
        <span class="ql-formats"><select class="ql-color"></select><select class="ql-background"></select></span>
        <span class="ql-formats"><button class="ql-list" value="ordered"></button><button class="ql-list" value="bullet"></button><button class="ql-list" value="check"></button></span>
        <span class="ql-formats"><button class="ql-blockquote"></button><button class="ql-code-block"></button><button class="ql-link"></button></span>
        <span class="ql-formats"><select class="ql-align"></select></span>
        <span class="ql-formats"><button class="ql-clean"></button></span>
      </div>
      <div id="editor"></div>
    </div>

    <script type="module">
      import * as Y from '${YJS}';
      import Quill from '${QUILL}';
      import { QuillBinding } from '${Y_QUILL}';

      const noteId = ${JSON.stringify(id)};
      const shareUrl = location.origin + '/n/' + encodeURIComponent(noteId);
      const statusEl = document.getElementById('status');
      const statusText = document.getElementById('statusText');
      const presenceEl = document.getElementById('presence');
      const titleEl = document.getElementById('title');

      document.getElementById('copyLink').addEventListener('click', () => app.copy(shareUrl));

      const doc = new Y.Doc();
      const ytext = doc.getText('quill');
      const ytitle = doc.getText('title');

      const quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Commencez à écrire…',
        modules: { toolbar: '#toolbar', history: { userOnly: true } },
      });
      quill.disable();
      new QuillBinding(ytext, quill);

      // ---- Title <-> Y.Text ----
      const renderTitle = () => {
        const value = ytitle.toString();
        document.title = (value || 'Sans titre') + ' · Notes';
        if (titleEl.value === value) return;
        const focused = document.activeElement === titleEl;
        const pos = titleEl.selectionStart;
        titleEl.value = value;
        if (focused) titleEl.setSelectionRange(pos, pos);
      };
      ytitle.observe(renderTitle);
      titleEl.addEventListener('input', () => {
        doc.transact(() => {
          ytitle.delete(0, ytitle.length);
          ytitle.insert(0, titleEl.value);
        });
      });
      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); quill.focus(); }
      });

      // ---- Status ----
      let pendingTimer = null;
      function setStatus(kind, text) {
        statusEl.className = 'status ' + kind;
        statusText.textContent = text;
      }
      function markSynced() {
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.OPEN && ws.bufferedAmount === 0) setStatus('online', 'Enregistré');
        }, 900);
      }

      // ---- WebSocket sync ----
      let ws = null;
      let synced = false;
      let retry = 0;

      doc.on('update', (update, origin) => {
        if (origin === 'remote') return;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(update);
          setStatus('online', 'Enregistrement…');
          markSynced();
        } else {
          setStatus('offline', 'Hors ligne — modifications en attente');
        }
      });

      function connect() {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(proto + '//' + location.host + '/ws/notes/' + encodeURIComponent(noteId));
        ws.binaryType = 'arraybuffer';

        ws.addEventListener('open', () => {
          retry = 0;
          // Send everything we have (covers edits made while offline).
          ws.send(Y.encodeStateAsUpdate(doc));
        });

        ws.addEventListener('message', (ev) => {
          if (typeof ev.data === 'string') {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'presence') {
              presenceEl.hidden = msg.count < 2;
              presenceEl.lastElementChild.textContent = msg.count + ' personnes connectées';
            }
            return;
          }
          Y.applyUpdate(doc, new Uint8Array(ev.data), 'remote');
          if (!synced) {
            synced = true;
            quill.enable();
            renderTitle();
            if (!ytitle.length && !quill.getText().trim()) titleEl.focus();
          }
          setStatus('online', 'Enregistré');
        });

        ws.addEventListener('close', (ev) => {
          presenceEl.hidden = true;
          if (ev.code === 4404) {
            quill.disable();
            titleEl.disabled = true;
            return setStatus('offline', ev.reason || 'Note introuvable');
          }
          setStatus('offline', 'Hors ligne — reconnexion…');
          const delay = Math.min(10000, 500 * 2 ** retry++);
          setTimeout(connect, delay);
        });
      }
      connect();
    </script>
  `;

  return layout(note.title || 'Sans titre', content, {
    section: 'notes',
    crumbs: [{ label: note.title || 'Sans titre' }],
    head: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" />',
    bare: true,
  });
}

module.exports = { noteEditorView };
