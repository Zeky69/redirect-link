const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const DB_PATH = path.resolve(__dirname, '../../data.sqlite');
const db = new sqlite3.Database(DB_PATH);

// Promisified helpers
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ changes: this.changes, lastID: this.lastID });
  });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row || null);
  });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows || []);
  });
});

// Initialize schema
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    random INTEGER NOT NULL DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    url TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    url_id INTEGER,
    ts INTEGER NOT NULL,
    ip TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    ua TEXT,
    device TEXT,
    os TEXT,
    browser TEXT,
    referer TEXT,
    path TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE SET NULL
  )`);
});

function toBoolean(i) {
  return !!Number(i);
}

async function getAllDataShape() {
  const result = {};
  const groups = await all('SELECT id, random FROM groups ORDER BY id ASC');
  const urls = await all('SELECT id, group_id, url, used FROM urls ORDER BY id ASC');
  const urlsByGroup = new Map();
  for (const u of urls) {
    if (!urlsByGroup.has(u.group_id)) urlsByGroup.set(u.group_id, []);
    urlsByGroup.get(u.group_id).push({ url: u.url, used: u.used, _id: u.id });
  }
  for (const g of groups) {
    result[g.id] = {
      options: { random: toBoolean(g.random) },
      urls: urlsByGroup.get(g.id) || [],
    };
  }
  return result;
}

async function getGroup(id) {
  const row = await get('SELECT id, random FROM groups WHERE id = ?', [id]);
  if (!row) return null;
  const urls = await all('SELECT id, url, used FROM urls WHERE group_id = ? ORDER BY id ASC', [id]);
  return { id: row.id, options: { random: toBoolean(row.random) }, urls: urls.map(u => ({ url: u.url, used: u.used, _id: u.id })) };
}

async function createGroupWithUrls(id, urls) {
  await run('BEGIN TRANSACTION');
  try {
    await run('INSERT INTO groups (id, random) VALUES (?, 1)', [id]);
    const stmt = await new Promise((resolve, reject) => {
      const s = db.prepare('INSERT INTO urls (group_id, url, used) VALUES (?, ?, 0)', err => err ? reject(err) : resolve(s));
    });
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        for (const u of urls) stmt.run([id, u]);
        stmt.finalize(err => err ? reject(err) : resolve());
      });
    });
    await run('COMMIT');
  } catch (e) {
    await run('ROLLBACK').catch(() => {});
    throw e;
  }
}

async function addLinks(id, urls) {
  const exists = await get('SELECT 1 FROM groups WHERE id = ?', [id]);
  if (!exists) throw new Error('ID non trouvé');
  await run('BEGIN TRANSACTION');
  try {
    const stmt = await new Promise((resolve, reject) => {
      const s = db.prepare('INSERT INTO urls (group_id, url, used) VALUES (?, ?, 0)', err => err ? reject(err) : resolve(s));
    });
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        for (const u of urls) stmt.run([id, u]);
        stmt.finalize(err => err ? reject(err) : resolve());
      });
    });
    await run('COMMIT');
  } catch (e) {
    await run('ROLLBACK').catch(() => {});
    throw e;
  }
}

async function setRandom(id, random) {
  const res = await run('UPDATE groups SET random = ? WHERE id = ?', [random ? 1 : 0, id]);
  return res.changes > 0;
}

async function deleteLinkAtIndex(id, index) {
  const urls = await all('SELECT id FROM urls WHERE group_id = ? ORDER BY id ASC', [id]);
  if (!urls.length) return { deleted: false, groupDeleted: false };
  const target = urls[Number(index)];
  if (!target) return { deleted: false, groupDeleted: false };

  await run('BEGIN TRANSACTION');
  try {
    await run('DELETE FROM urls WHERE id = ?', [target.id]);
    const row = await get('SELECT COUNT(*) as cnt FROM urls WHERE group_id = ?', [id]);
    let groupDeleted = false;
    if (row && row.cnt === 0) {
      await run('DELETE FROM groups WHERE id = ?', [id]);
      groupDeleted = true;
    }
    await run('COMMIT');
    return { deleted: true, groupDeleted };
  } catch (e) {
    await run('ROLLBACK').catch(() => {});
    throw e;
  }
}

async function chooseAndIncrementUrl(id) {
  const group = await getGroup(id);
  if (!group) return null;
  if (!group.urls.length) return null;

  let chosen;
  if (group.options.random) {
    const idx = Math.floor(Math.random() * group.urls.length);
    chosen = group.urls[idx];
  } else {
    let minUsed = Infinity;
    for (const u of group.urls) if (u.used < minUsed) minUsed = u.used;
    chosen = group.urls.find(u => u.used === minUsed) || group.urls[0];
  }

  await run('UPDATE urls SET used = used + 1 WHERE id = ?', [chosen._id]);
  return { url: chosen.url, urlId: chosen._id };
}

async function recordClick({ groupId, urlId, ts, ip, geo = {}, ua = {}, referer, path }) {
  await run(
    `INSERT INTO clicks (group_id, url_id, ts, ip, country, region, city, ua, device, os, browser, referer, path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      groupId,
      urlId || null,
      ts,
      ip || null,
      geo.country || null,
      geo.region || null,
      geo.city || null,
      ua.raw || null,
      ua.device || null,
      ua.os || null,
      ua.browser || null,
      referer || null,
      path || null,
    ]
  );
}

async function getAnalyticsOverview(groupId) {
  const totals = await get(`SELECT COUNT(*) as clicks FROM clicks WHERE group_id = ?`, [groupId]);
  const visitorsRow = await get(`SELECT COUNT(DISTINCT ip) as visitors FROM clicks WHERE group_id = ?`, [groupId]);
  const byCountry = await all(`SELECT country, COUNT(*) as c FROM clicks WHERE group_id = ? GROUP BY country ORDER BY c DESC`, [groupId]);
  const byBrowser = await all(`SELECT browser, COUNT(*) as c FROM clicks WHERE group_id = ? GROUP BY browser ORDER BY c DESC`, [groupId]);
  const byOs = await all(`SELECT os, COUNT(*) as c FROM clicks WHERE group_id = ? GROUP BY os ORDER BY c DESC`, [groupId]);
  const deviceDist = await all(`SELECT device, COUNT(*) as c FROM clicks WHERE group_id = ? GROUP BY device ORDER BY c DESC`, [groupId]);
  const topReferrers = await all(`
    SELECT COALESCE(referer, 'Direct') as referer, COUNT(*) as c
    FROM clicks WHERE group_id = ? GROUP BY referer ORDER BY c DESC LIMIT 10
  `, [groupId]);
  const urlBreakdown = await all(`
    SELECT COALESCE(u.url, 'Inconnue') as url, COUNT(*) as c
    FROM clicks c LEFT JOIN urls u ON u.id = c.url_id
    WHERE c.group_id = ?
    GROUP BY c.url_id
    ORDER BY c DESC
  `, [groupId]);
  const lastClicks = await all(`SELECT * FROM clicks WHERE group_id = ? ORDER BY ts DESC LIMIT 100`, [groupId]);
  const byDay = await all(`
    SELECT date(ts/1000, 'unixepoch') as day, COUNT(*) as c
    FROM clicks WHERE group_id = ? GROUP BY day ORDER BY day DESC LIMIT 30
  `, [groupId]);
  const byHour = await all(`
    SELECT strftime('%H', ts/1000, 'unixepoch') as hour, COUNT(*) as c
    FROM clicks WHERE group_id = ? GROUP BY hour ORDER BY hour ASC
  `, [groupId]);
  const period = await get(`SELECT MIN(ts) as start, MAX(ts) as end FROM clicks WHERE group_id = ?`, [groupId]);

  const fullTotals = { clicks: totals?.clicks || 0, visitors: visitorsRow?.visitors || 0 };
  return { totals: fullTotals, byCountry, byBrowser, byOs, deviceDist, topReferrers, urlBreakdown, lastClicks, byDay, byHour, period };
}

async function exportClicksCSV(groupId) {
  const rows = await all(`SELECT * FROM clicks WHERE group_id = ? ORDER BY ts DESC`, [groupId]);
  const header = [
    'id','group_id','url_id','ts','ip','country','region','city','ua','device','os','browser','referer','path'
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    const vals = header.map(k => {
      const v = r[k];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

module.exports = {
  getAllDataShape,
  getGroup,
  createGroupWithUrls,
  addLinks,
  setRandom,
  deleteLinkAtIndex,
  chooseAndIncrementUrl,
  recordClick,
  getAnalyticsOverview,
  exportClicksCSV,
};
