const { layout } = require('./layout');

function adminDetailView(id, data) {
    const urls = data[id]?.urls || [];
    const isRandom = !!data[id]?.options?.random;
    const shareUrl = `https://link.codeky.fr/${id}`;

    const content = `
        <div class="card">
            <h1>Groupe <span class="kbd">${id}</span></h1>
            <div class="subtitle">Partager ce lien public</div>
            <div class="row" style="align-items:center; gap:10px; margin:8px 0 14px;">
                <a id="shareLink" class="btn btn-success" href="${shareUrl}" target="_blank">${shareUrl}</a>
                <button class="btn" onclick="app.copy('${shareUrl}')">Copier</button>
            </div>
            <div class="actions" style="margin:4px 0 16px;">
                <a class="btn" href="/panel/${id}/analytics">Voir les analytics</a>
            </div>
            <div class="grid-2">
                <div class="col">
                    <h3>Liens</h3>
                    <div class="divider"></div>
                    <ul class="list">
                        ${urls.length === 0 ? `<li class="item"><span class="badge">Aucun lien encore</span></li>` :
                            urls.map((urlObj, index) => `
                                <li class="item">
                                    <div>
                                        <div>${urlObj.url}</div>
                                        <div class="badge">Visites: ${urlObj.used}</div>
                                    </div>
                                    <form method="POST" action="/admin/delete/${id}/${index}">
                                        <button class="btn btn-danger" type="submit">Supprimer</button>
                                    </form>
                                </li>
                            `).join('')}
                    </ul>
                </div>
                <div class="col">
                    <h3>Ajouter des liens</h3>
                    <div class="divider"></div>
                    <form method="POST" action="/admin/add-links/${id}" class="add-links">
                        <textarea name="urls" rows="6" placeholder="Collez plusieurs URLs, une par ligne ou séparées par des virgules" required></textarea>
                        <button class="btn btn-primary" type="submit">Ajouter</button>
                    </form>
                    <div class="divider" style="margin:16px 0"></div>
                    <h3>Répartition</h3>
                    <form method="POST" action="/admin/update-options/${id}" class="add-links" style="margin-top:8px;">
                        <div class="actions">
                            <label><input type="radio" name="random" value="true" ${isRandom ? 'checked' : ''}> Aléatoire</label>
                            <label><input type="radio" name="random" value="false" ${!isRandom ? 'checked' : ''}> Équilibré (moins utilisé)</label>
                            <button class="btn" type="submit">Mettre à jour</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    return layout(`Groupe ${id}`, content);
}

module.exports = { adminDetailView };
