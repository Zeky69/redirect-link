const { layout } = require('./layout');

function notFoundView(message = "Page introuvable") {
  const content = `
    <div class="card">
      <h1>404</h1>
      <div class="subtitle">${message}</div>
      <div class="actions" style="margin-top:12px">
        <a class="btn" href="/panel">Retour au panneau</a>
      </div>
    </div>
  `;
  return layout('404 - Not Found', content);
}

module.exports = { notFoundView };
