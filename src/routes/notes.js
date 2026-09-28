const express = require('express');
const db = require('../services/db');
const notesHub = require('../services/notesHub');
const { genId } = require('../utils/id');
const { notesListView } = require('../views/notesListView');
const { noteEditorView } = require('../views/noteEditorView');
const { notFoundView } = require('../views/notFoundView');

const router = express.Router();

router.get('/panel/notes', async (req, res) => {
  const notes = await db.listNotes();
  res.send(notesListView(notes));
});

router.post('/admin/notes', async (req, res) => {
  let id = genId(10);
  while (await db.getNote(id)) id = genId(10);
  await db.createNote(id);
  res.redirect(`/n/${id}`);
});

// Public, editable by anyone who has the link
router.get('/n/:id', async (req, res) => {
  const note = await db.getNote(req.params.id);
  if (!note) return res.status(404).send(notFoundView('Note introuvable'));
  res.send(noteEditorView(note));
});

router.post('/admin/notes/:id/delete', async (req, res) => {
  const id = req.params.id;
  await notesHub.closeNote(id);
  await db.deleteNote(id);
  res.redirect('/panel/notes');
});

module.exports = router;
