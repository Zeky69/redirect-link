require('dotenv').config();
const express = require('express');

const adminRoutes = require('./routes/admin');
const notesRoutes = require('./routes/notes');
const notesHub = require('./services/notesHub');
const redirectRoutes = require('./routes/redirect');
const { notFoundView } = require('./views/notFoundView');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static assets (CSS, images, etc.)
app.use(express.static('public'));

// Mount routes (notes first: /panel/notes must win over /panel/:id)
app.use(notesRoutes);
app.use(adminRoutes);
app.use(redirectRoutes);

// 404 fallback (must be after routes)
app.use((req, res) => {
  res.status(404).send(notFoundView());
});

const server = app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
notesHub.attach(server);

module.exports = app;
