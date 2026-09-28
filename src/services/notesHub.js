// Real-time collaboration hub for notes.
// Each open note is a Yjs document kept in memory while at least one client is connected.
// Protocol over WebSocket (/ws/notes/:id):
//   binary frames  -> Yjs updates (both directions)
//   text frames    -> JSON control messages from the server ({ type: 'presence', count })
const { WebSocketServer } = require('ws');
const Y = require('yjs');
const db = require('./db');

const SAVE_DELAY_MS = 800;
const rooms = new Map(); // id -> Promise<Room>

function snapshot(doc) {
  const title = doc.getText('title').toString().trim().slice(0, 120);
  const excerpt = doc.getText('quill').toString().replace(/\s+/g, ' ').trim().slice(0, 160);
  return { state: Buffer.from(Y.encodeStateAsUpdate(doc)), title, excerpt };
}

async function openRoom(id) {
  const row = await db.getNote(id);
  if (!row) return null;
  const doc = new Y.Doc();
  if (row.state) Y.applyUpdate(doc, new Uint8Array(row.state));

  const room = { id, doc, clients: new Set(), saveTimer: null, closed: false };

  room.save = async () => {
    clearTimeout(room.saveTimer);
    room.saveTimer = null;
    if (room.closed) return;
    try { await db.saveNoteState(id, snapshot(doc)); }
    catch (e) { console.error(`[notes] save failed for ${id}:`, e); }
  };

  doc.on('update', (update, origin) => {
    for (const client of room.clients) {
      if (client !== origin && client.readyState === client.OPEN) client.send(update);
    }
    clearTimeout(room.saveTimer);
    room.saveTimer = setTimeout(room.save, SAVE_DELAY_MS);
  });

  return room;
}

function getRoom(id) {
  if (!rooms.has(id)) {
    const p = openRoom(id).then(room => {
      if (!room) rooms.delete(id);
      else room.entry = p;
      return room;
    });
    rooms.set(id, p);
  }
  return rooms.get(id);
}

function broadcastPresence(room) {
  const msg = JSON.stringify({ type: 'presence', count: room.clients.size });
  for (const client of room.clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

async function handleConnection(ws, id) {
  // Buffer messages that arrive while the note is being loaded.
  const early = [];
  const buffer = (data, isBinary) => early.push([data, isBinary]);
  ws.on('message', buffer);

  let room = await getRoom(id);
  if (room && room.destroyed) room = await getRoom(id); // unloaded while we were waiting
  if (!room || room.closed) return ws.close(4404, 'Note introuvable');
  if (ws.readyState !== ws.OPEN) return;

  const onMessage = (data, isBinary) => {
    if (!isBinary) return;
    try { Y.applyUpdate(room.doc, new Uint8Array(data), ws); }
    catch (e) { console.warn(`[notes] invalid update on ${id}:`, e.message); }
  };

  room.clients.add(ws);
  ws.send(Y.encodeStateAsUpdate(room.doc));
  ws.off('message', buffer);
  ws.on('message', onMessage);
  early.forEach(([data, isBinary]) => onMessage(data, isBinary));
  broadcastPresence(room);

  ws.on('close', async () => {
    room.clients.delete(ws);
    if (room.clients.size) return broadcastPresence(room);
    // Last client left: flush, then unload the room unless someone rejoined meanwhile.
    await room.save();
    if (room.clients.size || room.destroyed) return;
    if (rooms.get(id) === room.entry) rooms.delete(id);
    room.destroyed = true;
    room.doc.destroy();
  });

  // Keep-alive so idle proxies don't cut the connection.
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
}

function attach(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 5 * 1024 * 1024 });

  server.on('upgrade', (req, socket, head) => {
    const match = /^\/ws\/notes\/([A-Za-z0-9_-]{3,40})$/.exec((req.url || '').split('?')[0]);
    if (!match) return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => handleConnection(ws, match[1]));
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);
  wss.on('close', () => clearInterval(interval));
  return wss;
}

// Called when a note is deleted: disconnect everyone and drop the in-memory doc without saving.
async function closeNote(id) {
  const p = rooms.get(id);
  if (!p) return;
  rooms.delete(id);
  const room = await p;
  if (!room) return;
  room.closed = true;
  clearTimeout(room.saveTimer);
  for (const client of room.clients) client.close(4404, 'Note supprimée');
}

module.exports = { attach, closeNote };
