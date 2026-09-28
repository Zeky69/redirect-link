const { layout, icon, esc } = require('./layout');

function relTime(ts) {
  const diff = Math.max(0, Date.now() - ts) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { dateStyle: 'medium' });
}

function notesListView(notes) {
  const cards = notes.map(n => `
    <a class="card note-card" href="/n/${esc(n.id)}">
      <div class="title">${esc(n.title || 'Sans titre')}</div>
      <div class="excerpt">${esc(n.excerpt) || '<span style="opacity:.6">Note vide</span>'}</div>
      <div class="foot"><span class="mono">${esc(n.id)}</span><span>${relTime(n.updated_at)}</span></div>
    </a>`).join('');

  const content = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Bloc-notes</div>
        <h1>Notes partagées</h1>
        <div class="subtitle">Écrivez à plusieurs en temps réel : toute personne qui a le lien peut lire et modifier.</div>
      </div>
      <form method="POST" action="/admin/notes"><button class="btn btn-primary" type="submit">${icon('plus')} Nouvelle note</button></form>
    </div>

    ${notes.length ? `<div class="note-grid">${cards}</div>` : `
    <form method="POST" action="/admin/notes">
      <button class="card note-card note-new" type="submit" style="width:100%;min-height:200px"><div>${icon('note')}<div>Aucune note pour l'instant — cliquez pour en créer une</div></div></button>
    </form>`}
  `;
  return layout('Notes', content, { section: 'notes' });
}

module.exports = { notesListView };
