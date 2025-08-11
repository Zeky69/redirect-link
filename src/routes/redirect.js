const express = require('express');
const db = require('../services/db');
const { notFoundView } = require('../views/notFoundView');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

function getIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0].trim();
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || undefined;
}

const router = express.Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const chosen = await db.chooseAndIncrementUrl(id);
  if (!chosen) return res.status(404).send(notFoundView('Identifiant introuvable'));

  // Analytics capture (non-blocking but awaited to keep data consistent)
  const ip = getIp(req);
  const geo = ip ? (geoip.lookup(ip) || {}) : {};
  const uaRaw = req.headers['user-agent'] || '';
  const ua = new UAParser(uaRaw);
  const parsedUA = {
    raw: uaRaw,
    device: [ua.getDevice().vendor, ua.getDevice().model].filter(Boolean).join(' ') || ua.getDevice().type || 'Desktop',
    os: [ua.getOS().name, ua.getOS().version].filter(Boolean).join(' '),
    browser: [ua.getBrowser().name, ua.getBrowser().version].filter(Boolean).join(' '),
  };
  await db.recordClick({
    groupId: id,
    urlId: chosen.urlId,
    ts: Date.now(),
    ip,
    geo: { country: geo.country, region: geo.region, city: geo.city },
    ua: parsedUA,
    referer: req.headers.referer || req.headers.referrer,
    path: req.originalUrl,
  });

  let url = chosen.url;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  res.redirect(url);
});

module.exports = router;
