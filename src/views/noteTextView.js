const { esc } = require('./layout');

// Standalone read-only page: no JavaScript, no WebSocket, no external assets.
function noteTextView(id, note) {
  const title = note.title || 'Sans titre';
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    :root { color-scheme: light dark; }
    body { max-width: 720px; margin: 0 auto; padding: 24px 16px; font: 16px/1.6 system-ui, sans-serif; }
    h1 { font-size: 1.5rem; margin: 0 0 16px; }
    pre { margin: 0; font: inherit; white-space: pre-wrap; overflow-wrap: anywhere; }
    footer { margin-top: 32px; font-size: .875rem; opacity: .7; }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <pre>${esc(note.text)}</pre>
  <footer><a href="/n/${esc(id)}/txt">Actualiser</a> · <a href="/n/${esc(id)}">Ouvrir l'éditeur</a></footer>
</body>
</html>`;
}

module.exports = { noteTextView };
