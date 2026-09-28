const { layout, icon, esc } = require('./layout');

function notFoundView(message = "Page introuvable") {
  const content = `
    <div class="card" style="max-width:460px;margin:48px auto 0;text-align:center">
      <div class="card-body" style="padding:40px 28px">
        <div class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.04em;background:linear-gradient(135deg,var(--accent),#b07cff);-webkit-background-clip:text;background-clip:text;color:transparent">404</div>
        <div class="subtitle" style="margin:8px 0 22px">${esc(message)}</div>
        <a class="btn btn-primary" href="/panel">${icon('arrowLeft')} Retour au panneau</a>
      </div>
    </div>
  `;
  return layout('404', content, { crumbs: [{ label: '404' }] });
}

module.exports = { notFoundView };
