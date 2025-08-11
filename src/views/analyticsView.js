const { layout } = require('./layout');

function analyticsView(group, data) {
  const { totals = { clicks: 0 }, byCountry = [], byBrowser = [], byOs = [], lastClicks = [], byDay = [], deviceDist = [], byHour = [], topReferrers = [], urlBreakdown = [], period = {} } = data || {};
  const id = group.id;
  const statItem = (label, value) => `<div class="item"><div>${label}</div><div class="badge">${value}</div></div>`;

  const countries = byCountry.slice(0, 8).map(row => statItem(row.country || 'N/A', row.c)).join('') || '<div class="item"><span class="badge">Aucune donnée</span></div>';

  const rows = lastClicks.map(c => `
    <tr>
      <td>${new Date(c.ts).toLocaleString()}</td>
      <td>${c.country || ''}</td>
      <td>${c.city || ''}</td>
      <td>${c.ip || ''}</td>
      <td>${c.browser || ''}</td>
      <td>${c.os || ''}</td>
      <td class="muted">${c.referer || ''}</td>
    </tr>
  `).join('');

  const table = rows ? `<div class="card table"><table class="data">
    <thead><tr><th>Date</th><th>Pays</th><th>Ville</th><th>IP</th><th>Navigateur</th><th>OS</th><th>Référent</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>` : '<div class="card"><span class="badge">Pas encore de clics</span></div>';

  const daily = byDay.slice().reverse().map(d => `<div class="item"><div>${d.day}</div><div class="badge">${d.c}</div></div>`).join('') || '<div class="item"><span class="badge">Aucune donnée</span></div>';

  const content = `
    <div class="card">
      <h1>Analytics <span class="kbd">${id}</span></h1>
      <div class="subtitle">Aperçu des clics et informations du public.</div>
      <div class="actions" style="margin:8px 0 12px">
        <a class="btn" href="/panel/${id}">Retour</a>
        <a class="btn btn-primary" href="/panel/${id}/analytics.csv">Exporter CSV</a>
      </div>
      <div class="stats">
        <div class="stat"><div class="value">${totals.clicks || 0}</div><div class="label">Total clics</div></div>
        <div class="stat"><div class="value">${totals.visitors || 0}</div><div class="label">Visiteurs uniques</div></div>
        <div class="stat"><div class="value">${(byCountry[0]?.country || '—')}</div><div class="label">Top pays</div></div>
        <div class="stat"><div class="value">${(byBrowser[0]?.browser || '—')}</div><div class="label">Top navigateur</div></div>
      </div>
      <div class="chip">Période: ${period.start ? new Date(period.start).toLocaleString() : '—'} → ${period.end ? new Date(period.end).toLocaleString() : '—'}</div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Liens les plus cliqués</h3>
      <div class="divider"></div>
      ${urlBreakdown.length ? urlBreakdown.map(u => `<div class="item"><div class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%">${u.url}</div><div class="badge">${u.c}</div></div>`).join('') : '<div class="item"><span class="badge">Aucune donnée</span></div>'}
      <div class="divider" style="margin:12px 0"></div>
      <div class="badge">Période: ${period.start ? new Date(period.start).toLocaleString() : '—'} → ${period.end ? new Date(period.end).toLocaleString() : '—'}</div>
    </div>
    <div class="grid-2">
      <div class="col">
        <div class="card">
          <h3>Total clics</h3>
          <div class="divider"></div>
          ${countries}
        </div>
        <div class="card">
          <h3>Par jour</h3>
          <div class="divider"></div>
          <canvas id="chartDaily" height="120"></canvas>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <h3>Navigateur</h3>
          <div class="divider"></div>
          <canvas id="chartBrowser" height="120"></canvas>
        </div>
        <div class="card">
          <h3>Système</h3>
          <div class="divider"></div>
          <canvas id="chartOS" height="120"></canvas>
        </div>
      </div>
    </div>
    <div class="grid-2" style="margin-top:16px;">
      <div class="col">
        <div class="card">
          <h3>Appareil</h3>
          <div class="divider"></div>
          <canvas id="chartDevice" height="120"></canvas>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <h3>Par heure</h3>
          <div class="divider"></div>
          <canvas id="chartHour" height="120"></canvas>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Référents</h3>
      <div class="divider"></div>
      <canvas id="chartRef" height="120"></canvas>
    </div>
    ${table}

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
      const dataPayload = ${JSON.stringify({
        byDay,
        byBrowser,
        byOs,
        deviceDist: data.deviceDist || [],
        byHour: data.byHour || [],
        topReferrers: data.topReferrers || [],
      })};

      function palette(n){
        const colors = ['#6ea8ff','#36d399','#ffb366','#a78bfa','#60a5fa','#f472b6','#facc15','#34d399','#fb7185','#93c5fd'];
        return Array.from({length:n}, (_,i)=>colors[i%colors.length]);
      }

      function mount(){
        // Daily trend (line)
        const d = dataPayload.byDay.slice().reverse();
        if (d.length && document.getElementById('chartDaily')) {
          new Chart(document.getElementById('chartDaily'), {
            type: 'line',
            data: { labels: d.map(x=>x.day), datasets: [{ label: 'Clics', data: d.map(x=>x.c), borderColor:'#6ea8ff', backgroundColor:'rgba(110,168,255,.2)', fill:true, tension:.35 }]},
            options: { plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,.05)' } }, y:{ grid:{ color:'rgba(255,255,255,.05)' } } } }
          });
        }

        // Browser (doughnut)
        const b = dataPayload.byBrowser;
        if (b.length && document.getElementById('chartBrowser')) {
          new Chart(document.getElementById('chartBrowser'), {
            type: 'doughnut',
            data: { labels: b.map(x=>x.browser||'N/A'), datasets: [{ data: b.map(x=>x.c), backgroundColor: palette(b.length) }]},
            options: { plugins:{ legend:{ position:'bottom' } } }
          });
        }

        // OS (doughnut)
        const os = dataPayload.byOs;
        if (os.length && document.getElementById('chartOS')) {
          new Chart(document.getElementById('chartOS'), {
            type: 'doughnut',
            data: { labels: os.map(x=>x.os||'N/A'), datasets: [{ data: os.map(x=>x.c), backgroundColor: palette(os.length) }]},
            options: { plugins:{ legend:{ position:'bottom' } } }
          });
        }

        // Device (bar)
        const dev = dataPayload.deviceDist;
        if (dev.length && document.getElementById('chartDevice')) {
          new Chart(document.getElementById('chartDevice'), {
            type: 'bar',
            data: { labels: dev.map(x=>x.device||'N/A'), datasets: [{ label:'Appareils', data: dev.map(x=>x.c), backgroundColor:'#36d399' }]},
            options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
          });
        }

        // Hour of day (bar)
        const hr = dataPayload.byHour;
        if (hr.length && document.getElementById('chartHour')) {
          new Chart(document.getElementById('chartHour'), {
            type: 'bar',
            data: { labels: hr.map(x=>x.hour), datasets: [{ label:'Clics', data: hr.map(x=>x.c), backgroundColor:'#a78bfa' }]},
            options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
          });
        }

        // Referrers (bar)
        const rf = dataPayload.topReferrers;
        if (rf.length && document.getElementById('chartRef')) {
          new Chart(document.getElementById('chartRef'), {
            type: 'bar',
            data: { labels: rf.map(x=>x.referer||'Direct'), datasets: [{ label:'Référents', data: rf.map(x=>x.c), backgroundColor:'#ffb366' }]},
            options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
          });
        }
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
    </script>
  `;
  return layout(`Analytics ${id}`, content);
}

module.exports = { analyticsView };
