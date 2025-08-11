function layout(title, content, opts = {}) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Link Manager</div>
      <div class="actions">
        <a class="btn" href="/panel">Panneau</a>
      </div>
    </div>
    ${content}
    <div class="footer">UX par Codeky · redirections rapides · SQLite</div>
  </div>
  <script src="/app.js" defer></script>
</body>
</html>`;
}

module.exports = { layout };
