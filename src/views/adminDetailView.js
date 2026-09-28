const { layout, icon, esc } = require('./layout');

function adminDetailView(id, data) {
    const urls = data[id]?.urls || [];
    const isRandom = !!data[id]?.options?.random;
    const shareUrl = `https://link.codeky.fr/${id}`;
    const totalVisits = urls.reduce((s, u) => s + (u.used || 0), 0);
    const maxVisits = Math.max(1, ...urls.map(u => u.used || 0));

    const host = (url) => {
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
    };

    const links = urls.length === 0
        ? `<div class="empty">${icon('inbox')}<div>Aucun lien encore.</div></div>`
        : `<ul class="list">${urls.map((urlObj, index) => {
            const used = urlObj.used || 0;
            return `
                <li class="row-item">
                    <span class="avatar">${esc(host(urlObj.url).slice(0, 1))}</span>
                    <div class="grow">
                        <div class="title"><a href="${esc(urlObj.url)}" target="_blank" rel="noopener" style="text-decoration:none">${esc(urlObj.url)}</a></div>
                        <div class="meta"><span>${used} visite${used > 1 ? 's' : ''}</span>${totalVisits ? `<span>·</span><span>${Math.round(used / totalVisits * 100)} %</span>` : ''}</div>
                        <div class="bar"><span style="width:${(used / maxVisits * 100).toFixed(1)}%"></span></div>
                    </div>
                    <form method="POST" action="/admin/delete/${esc(id)}/${index}" onsubmit="return confirm('Supprimer ce lien ?')">
                        <button class="btn btn-ghost btn-icon btn-danger" type="submit" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>
                    </form>
                </li>`;
        }).join('')}</ul>`;

    const content = `
        <div class="page-head">
            <div style="min-width:0">
                <div class="eyebrow">Groupe</div>
                <h1 class="mono" style="font-size:24px">${esc(id)}</h1>
                <div class="subtitle">${urls.length} lien${urls.length > 1 ? 's' : ''} · ${totalVisits} visite${totalVisits > 1 ? 's' : ''} au total</div>
            </div>
            <div class="actions">
                <a class="btn" href="/panel/${esc(id)}/analytics">${icon('chart')} Analytics</a>
            </div>
        </div>

        <div class="share" style="margin-bottom:20px">
            <span class="dot"></span>
            <a id="shareLink" href="${esc(shareUrl)}" target="_blank" rel="noopener">${esc(shareUrl)}</a>
            <span style="flex:1"></span>
            <a class="btn btn-ghost btn-icon" href="${esc(shareUrl)}" target="_blank" rel="noopener" title="Ouvrir">${icon('external')}</a>
            <button class="btn btn-primary btn-sm" onclick="app.copy('${esc(shareUrl)}')">${icon('copy')} Copier</button>
        </div>

        <div class="grid-main">
            <div class="card">
                <div class="card-head"><h3>Liens</h3><span class="badge">${urls.length}</span></div>
                <div class="card-body tight">${links}</div>
            </div>
            <div class="stack">
                <div class="card">
                    <div class="card-head"><h3>Ajouter des liens</h3></div>
                    <div class="card-body">
                        <form method="POST" action="/admin/add-links/${esc(id)}">
                            <textarea name="urls" rows="5" placeholder="Une URL par ligne ou séparées par des virgules" required></textarea>
                            <button class="btn btn-primary" type="submit">${icon('plus')} Ajouter</button>
                        </form>
                    </div>
                </div>
                <div class="card">
                    <div class="card-head"><h3>Répartition</h3></div>
                    <div class="card-body">
                        <form method="POST" action="/admin/update-options/${esc(id)}">
                            <div class="segmented">
                                <label><input type="radio" name="random" value="false" ${!isRandom ? 'checked' : ''} onchange="this.form.submit()"><span class="opt"><strong>Équilibré</strong><small>Le moins utilisé</small></span></label>
                                <label><input type="radio" name="random" value="true" ${isRandom ? 'checked' : ''} onchange="this.form.submit()"><span class="opt"><strong>Aléatoire</strong><small>Au hasard</small></span></label>
                            </div>
                            <noscript><button class="btn" type="submit">Mettre à jour</button></noscript>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    return layout(`Groupe ${id}`, content, { crumbs: [{ label: id }] });
}

module.exports = { adminDetailView };
