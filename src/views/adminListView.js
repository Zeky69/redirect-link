const { layout, icon, esc } = require('./layout');

function adminListView(data) {
    const ids = Object.keys(data);
    const totalLinks = ids.reduce((sum, id) => sum + (data[id]?.urls?.length || 0), 0);
    const totalVisits = ids.reduce((sum, id) => sum + (data[id]?.urls || []).reduce((s, u) => s + (u.used || 0), 0), 0);

    const groups = ids.length === 0
        ? `<div class="empty">${icon('inbox')}<div>Aucun groupe pour l'instant.</div><div style="font-size:12.5px">Créez-en un avec le formulaire.</div></div>`
        : `<ul class="list">${ids.map(id => {
            const urls = data[id]?.urls || [];
            const visits = urls.reduce((s, u) => s + (u.used || 0), 0);
            return `
                <li>
                    <a class="row-item" href="/panel/${esc(id)}">
                        <span class="avatar">${esc(id.slice(0, 2))}</span>
                        <div class="grow">
                            <div class="title mono">${esc(id)}</div>
                            <div class="meta"><span>${urls.length} lien${urls.length > 1 ? 's' : ''}</span><span>·</span><span>${visits} visite${visits > 1 ? 's' : ''}</span></div>
                        </div>
                        <span class="chev">${icon('chevron')}</span>
                    </a>
                </li>`;
        }).join('')}</ul>`;

    const content = `
        <div class="page-head">
            <div>
                <div class="eyebrow">Tableau de bord</div>
                <h1>Gestion des redirections</h1>
                <div class="subtitle">Regroupez plusieurs URLs derrière un seul lien court à partager.</div>
            </div>
        </div>

        <div class="stats">
            <div class="card stat"><div class="label">${icon('folder')} Groupes</div><div class="value">${ids.length}</div></div>
            <div class="card stat"><div class="label">${icon('link')} Liens</div><div class="value">${totalLinks}</div></div>
            <div class="card stat"><div class="label">${icon('click')} Visites</div><div class="value">${totalVisits}</div></div>
        </div>

        <div class="grid-main">
            <div class="card">
                <div class="card-head"><h3>Groupes existants</h3><span class="badge">${ids.length}</span></div>
                <div class="card-body tight">${groups}</div>
            </div>
            <div class="card">
                <div class="card-head"><h3>Nouveau groupe</h3></div>
                <div class="card-body">
                    <form method="POST" action="/admin/add">
                        <label class="field">
                            Identifiant <span class="help">Optionnel — sinon 7 caractères générés automatiquement.</span>
                            <input class="input mono" type="text" name="id" placeholder="mon-lien" pattern="[A-Za-z0-9_-]{3,20}" title="3-20 caractères (lettres, chiffres, - et _)" />
                        </label>
                        <label class="field">
                            URLs <span class="help">Une par ligne ou séparées par des virgules.</span>
                            <textarea name="urls" rows="6" placeholder="https://exemple.com&#10;https://autre-site.fr" required></textarea>
                        </label>
                        <button class="btn btn-primary" type="submit">${icon('plus')} Créer le groupe</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    return layout('Groupes', content);
}

module.exports = { adminListView };
