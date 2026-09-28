const { layout, icon, esc } = require('./layout');

function analyticsView(group, data) {
  const { totals = { clicks: 0 }, byCountry = [], byBrowser = [], byOs = [], lastClicks = [], byDay = [], deviceDist = [], byHour = [], topReferrers = [], urlBreakdown = [], period = {} } = data || {};
  const id = group.id;
  const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const noData = `<div class="empty">${icon('inbox')}<div>Aucune donnée</div></div>`;

  const barList = (items, labelOf) => {
    if (!items.length) return noData;
    const max = Math.max(1, ...items.map(r => r.c));
    return items.map(r => `
      <div class="bar-row">
        <div class="top"><span class="name">${esc(labelOf(r))}</span><span class="num">${r.c}</span></div>
        <div class="bar"><span style="width:${(r.c / max * 100).toFixed(1)}%"></span></div>
      </div>`).join('');
  };

  const chartCard = (title, canvasId, hasData, cls = '') => `
    <div class="card">
      <div class="card-head"><h3>${title}</h3></div>
      <div class="card-body"><div class="chart-box ${cls}">${hasData ? `<canvas id="${canvasId}"></canvas>` : '<div class="chart-empty">Aucune donnée</div>'}</div></div>
    </div>`;

  const rows = lastClicks.map(c => `
    <tr>
      <td>${esc(fmtDate(c.ts))}</td>
      <td>${esc(c.country || '—')}</td>
      <td>${esc(c.city || '—')}</td>
      <td class="mono muted">${esc(c.ip || '')}</td>
      <td>${esc(c.browser || '')}</td>
      <td>${esc(c.os || '')}</td>
      <td class="muted trunc">${esc(c.referer || 'Direct')}</td>
    </tr>
  `).join('');

  const table = `
    <div class="card">
      <div class="card-head"><h3>Derniers clics</h3><span class="badge">${lastClicks.length}</span></div>
      ${rows ? `<div class="table"><table class="data">
        <thead><tr><th>Date</th><th>Pays</th><th>Ville</th><th>IP</th><th>Navigateur</th><th>OS</th><th>Référent</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>` : `<div class="empty">${icon('inbox')}<div>Pas encore de clics</div></div>`}
    </div>`;

  const payload = JSON.stringify({ byDay, byBrowser, byOs, deviceDist, byHour, topReferrers }).replace(/</g, '\\u003c');

  const content = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Analytics</div>
        <h1>Groupe <span class="kbd">${esc(id)}</span></h1>
        <div class="subtitle">${icon('calendar')} ${esc(fmtDate(period.start))} → ${esc(fmtDate(period.end))}</div>
      </div>
      <div class="actions">
        <a class="btn" href="/panel/${esc(id)}">${icon('arrowLeft')} Retour</a>
        <a class="btn btn-primary" href="/panel/${esc(id)}/analytics.csv">${icon('download')} Exporter CSV</a>
      </div>
    </div>

    <div class="stats">
      <div class="card stat"><div class="label">${icon('click')} Total clics</div><div class="value">${totals.clicks || 0}</div></div>
      <div class="card stat"><div class="label">${icon('users')} Visiteurs uniques</div><div class="value">${totals.visitors || 0}</div></div>
      <div class="card stat"><div class="label">${icon('globe')} Top pays</div><div class="value">${esc(byCountry[0]?.country || '—')}</div></div>
      <div class="card stat"><div class="label">${icon('compass')} Top navigateur</div><div class="value">${esc(byBrowser[0]?.browser || '—')}</div></div>
    </div>

    <div class="stack">
      ${chartCard('Clics par jour', 'chartDaily', byDay.length)}

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Liens les plus cliqués</h3></div>
          <div class="card-body tight">${barList(urlBreakdown, u => u.url)}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Pays</h3></div>
          <div class="card-body tight">${barList(byCountry.slice(0, 8), r => r.country || 'Inconnu')}</div>
        </div>
      </div>

      <div class="grid-2">
        ${chartCard('Navigateur', 'chartBrowser', byBrowser.length, 'sm')}
        ${chartCard('Système', 'chartOS', byOs.length, 'sm')}
      </div>

      <div class="grid-2">
        ${chartCard('Appareil', 'chartDevice', deviceDist.length, 'sm')}
        ${chartCard('Par heure', 'chartHour', byHour.length, 'sm')}
      </div>

      ${chartCard('Référents', 'chartRef', topReferrers.length, 'sm')}

      ${table}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
      const dataPayload = ${payload};

      function mount(){
        const css = getComputedStyle(document.documentElement);
        const v = (name) => css.getPropertyValue(name).trim();
        const accent = v('--accent'), muted = v('--muted'), border = v('--border'), surface = v('--surface');
        const palette = [accent, '#3ecf8e', '#f5b454', '#b07cff', '#38bdf8', '#f472b6', '#a3e635', '#fb7185'];

        Chart.defaults.font.family = v('--font');
        Chart.defaults.font.size = 12;
        Chart.defaults.color = muted;
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.tooltip.backgroundColor = v('--surface-3');
        Chart.defaults.plugins.tooltip.titleColor = v('--text');
        Chart.defaults.plugins.tooltip.bodyColor = v('--text-2');
        Chart.defaults.plugins.tooltip.borderColor = v('--border-strong');
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
        Chart.defaults.plugins.legend.labels.boxWidth = 8;

        const axes = {
          x: { grid: { display: false }, border: { display: false } },
          y: { beginAtZero: true, grid: { color: border }, border: { display: false }, ticks: { precision: 0 } },
        };
        const bar = (id, labels, values, color) => {
          const el = document.getElementById(id);
          if (!el) return;
          new Chart(el, {
            type: 'bar',
            data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 6, maxBarThickness: 36 }] },
            options: { plugins: { legend: { display: false } }, scales: axes },
          });
        };
        const doughnut = (id, labels, values) => {
          const el = document.getElementById(id);
          if (!el) return;
          new Chart(el, {
            type: 'doughnut',
            data: { labels, datasets: [{ data: values, backgroundColor: palette, borderColor: surface, borderWidth: 3, hoverOffset: 6 }] },
            options: { cutout: '68%', plugins: { legend: { position: 'right' } } },
          });
        };

        const d = dataPayload.byDay.slice().reverse();
        const daily = document.getElementById('chartDaily');
        if (daily) {
          const g = daily.getContext('2d').createLinearGradient(0, 0, 0, 240);
          g.addColorStop(0, accent + '55');
          g.addColorStop(1, accent + '00');
          new Chart(daily, {
            type: 'line',
            data: { labels: d.map(x => x.day), datasets: [{ data: d.map(x => x.c), borderColor: accent, backgroundColor: g, fill: true, tension: .35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: accent }] },
            options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: axes },
          });
        }

        doughnut('chartBrowser', dataPayload.byBrowser.map(x => x.browser || 'N/A'), dataPayload.byBrowser.map(x => x.c));
        doughnut('chartOS', dataPayload.byOs.map(x => x.os || 'N/A'), dataPayload.byOs.map(x => x.c));
        bar('chartDevice', dataPayload.deviceDist.map(x => x.device || 'N/A'), dataPayload.deviceDist.map(x => x.c), '#3ecf8e');
        bar('chartHour', dataPayload.byHour.map(x => x.hour + 'h'), dataPayload.byHour.map(x => x.c), '#b07cff');
        bar('chartRef', dataPayload.topReferrers.map(x => x.referer || 'Direct'), dataPayload.topReferrers.map(x => x.c), '#f5b454');
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
    </script>
  `;
  return layout(`Analytics ${id}`, content, { crumbs: [{ label: id, href: `/panel/${encodeURIComponent(id)}` }, { label: 'Analytics' }] });
}

module.exports = { analyticsView };
