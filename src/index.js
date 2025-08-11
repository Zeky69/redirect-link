require('dotenv').config();
const express = require('express');

const adminRoutes = require('./routes/admin');
const redirectRoutes = require('./routes/redirect');
const { notFoundView } = require('./views/notFoundView');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static assets (CSS, images, etc.)
app.use(express.static('public'));

// Mount routes
app.use(adminRoutes);
app.use(redirectRoutes);

// 404 fallback (must be after routes)
app.use((req, res) => {
  res.status(404).send(notFoundView());
});

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});

module.exports = app;
