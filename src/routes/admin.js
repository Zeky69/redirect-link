const express = require('express');
// Short, easy-to-read ID generator (no ambiguous chars)
function genId(len = 7) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
const db = require('../services/db');
const { adminListView } = require('../views/adminListView');
const { adminDetailView } = require('../views/adminDetailView');
const { notFoundView } = require('../views/notFoundView');
const { analyticsView } = require('../views/analyticsView');

const router = express.Router();

router.get('/panel', async (req, res) => {
  const data = await db.getAllDataShape();
  res.send(adminListView(data));
});

router.get('/panel/:id', async (req, res) => {
  const id = req.params.id;
  const group = await db.getGroup(id);
  if (!group) return res.status(404).send(notFoundView("Groupe introuvable"));
  const dataShape = { [id]: { options: group.options, urls: group.urls } };
  res.send(adminDetailView(id, dataShape));
});

// Analytics overview
router.get('/panel/:id/analytics', async (req, res) => {
  const id = req.params.id;
  const group = await db.getGroup(id);
  if (!group) return res.status(404).send(notFoundView('Groupe introuvable'));
  const data = await db.getAnalyticsOverview(id);
  res.send(require('../views/analyticsView').analyticsView(group, data));
});

// Export CSV
router.get('/panel/:id/analytics.csv', async (req, res) => {
  const id = req.params.id;
  const group = await db.getGroup(id);
  if (!group) return res.status(404).send('Not found');
  const csv = await db.exportClicksCSV(id);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="analytics-${id}.csv"`);
  res.send(csv);
});

router.post('/admin/add', async (req, res) => {
  const { urls } = req.body;
    let { id } = req.body;
  if (!urls) {
    return res.status(400).send('Les URLs sont requises.');
  }
    // Accept optional custom ID
    if (id) {
      id = String(id).trim();
      const valid = /^[A-Za-z0-9_-]{3,20}$/.test(id);
      if (!valid) return res.status(400).send('ID invalide (utilisez 3-20 caractères: lettres, chiffres, - et _)');
      // Ensure uniqueness
      const exists = await db.getGroup(id);
      if (exists) return res.status(409).send('ID déjà utilisé. Choisissez un autre.');
    } else {
      id = genId();
    }
  const urlList = urls
    .split(/[\n,]+/)
    .map(u => u.trim())
    .filter(Boolean);
  await db.createGroupWithUrls(id, urlList);
  res.redirect(`/panel/${id}`);
});

router.post('/admin/add-links/:id', async (req, res) => {
  const { urls } = req.body;
  const id = req.params.id;
  if (!urls) {
    return res.status(400).send('Les URLs sont requises.');
  }
  const newUrls = urls
    .split(/[\n,]+/)
    .map(u => u.trim())
    .filter(Boolean);
  try {
  await db.addLinks(id, newUrls);
  } catch (e) {
    return res.status(404).send('ID non trouvé.');
  }
  res.redirect(`/panel/${id}`);
});

router.post('/admin/update-options/:id', async (req, res) => {
  const { random } = req.body;
  const id = req.params.id;
  const ok = await db.setRandom(id, random === 'true');
  if (!ok) return res.status(404).send('ID non trouvé.');
  res.redirect(`/panel/${id}`);
});

router.post('/admin/delete/:id/:index', async (req, res) => {
  const { id, index } = req.params;
  const { deleted, groupDeleted } = await db.deleteLinkAtIndex(id, index);
  if (groupDeleted) return res.redirect('/panel');
  res.redirect(`/panel/${id}`);
});

module.exports = router;
