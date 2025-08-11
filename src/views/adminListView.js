const { layout } = require('./layout');

function adminListView(data) {
    const content = `
        <div class="card">
            <h1>Gestion des redirections</h1>
            <div class="subtitle">Créez un groupe d'URLs et obtenez un identifiant à partager.</div>
            <div class="grid-2">
                <div class="col">
                    <h3>Groupes existants</h3>
                    <div class="divider"></div>
                    <ul class="list">
                        ${Object.keys(data).length === 0 ? `<li class="item"><span class="badge">Aucun groupe</span></li>` :
                            Object.keys(data).map(id => `
                                <li class="item">
                                    <a href="/panel/${id}">${id}</a>
                                    <span class="badge">${data[id]?.urls?.length || 0} liens</span>
                                </li>`).join('')}
                    </ul>
                </div>
                <div class="col">
                    <h3>Nouveau groupe</h3>
                    <div class="divider"></div>
                                        <form method="POST" action="/admin/add">
                                                <div class="inline-input">
                                                    <input class="input" type="text" name="id" placeholder="ID personnalisé (optionnel)" pattern="[A-Za-z0-9_-]{3,20}" title="3-20 caractères (lettres, chiffres, - et _)" />
                                                    <span class="pill">Auto: 7 caractères</span>
                                                </div>
                        <textarea name="urls" rows="6" placeholder="Collez plusieurs URLs, séparées par des virgules ou des retours à la ligne" required></textarea>
                        <div class="actions">
                            <button class="btn btn-primary" type="submit">Créer le groupe</button>
                            <span class="badge">Astuce: collez une liste (une URL par ligne), ça marche.</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    return layout('Panneau d’administration', content);
}

module.exports = { adminListView };
