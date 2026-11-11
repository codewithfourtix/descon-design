/* Shared clock-in store for Assure LIQS (Vercel serverless function + Upstash Redis REST).
   GET  /api/clock?since=<ver>  -> { ok, ver, same:true } when nothing changed,
                                   else { ok, ver, attendance:[], devices:[], handovers:[] }
   POST /api/clock {action,...} -> attendance | link | unlink | handover | reset
   Env vars come from the Vercel Upstash integration (any prefix). */
const env = process.env;
const pick = (sfx) => { const k = Object.keys(env).find((n) => n.endsWith(sfx) && env[n]); return k ? env[k] : ''; };
const URL_ = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || pick('KV_REST_API_URL') || pick('REDIS_REST_URL');
const TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || pick('KV_REST_API_TOKEN') || pick('REDIS_REST_TOKEN');
const K = { att: 'assure:attendance', dev: 'assure:devices', ho: 'assure:handovers', ver: 'assure:ver' };

async function redis(commands) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('store ' + r.status);
  return r.json();
}
const asList = (flat) => { const out = []; for (let i = 0; i < (flat || []).length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch (e) {} } return out; };
const clean = (o) => { const s = JSON.stringify(o || {}); if (s.length > 4000) throw new Error('Record too large'); return JSON.parse(s); };
const okId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{2,40}$/.test(v);
const write = async (cmd) => { const out = await redis([cmd, ['INCR', K.ver]]); return String(out[1].result); };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ ok: false, error: 'Store not configured' });
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false, error: 'Origin not allowed' }); } catch (e) { return res.status(403).json({ ok: false }); } }
  try {
    if (req.method === 'GET') {
      const [v] = await redis([['GET', K.ver]]);
      const ver = String(v.result == null ? '0' : v.result);
      if (req.query && req.query.since === ver) return res.status(200).json({ ok: true, ver, same: true });
      const [a, d, h] = await redis([['HGETALL', K.att], ['HGETALL', K.dev], ['HGETALL', K.ho]]);
      const attendance = asList(a.result).sort((x, y) => (y.inAt || 0) - (x.inAt || 0)).slice(0, 400);
      const devices = asList(d.result);
      const handovers = asList(h.result).sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 200);
      return res.status(200).json({ ok: true, ver, attendance, devices, handovers });
    }
    if (req.method !== 'POST') return res.status(405).json({ ok: false });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { action } = body;
    if (action === 'attendance') {
      const r = clean(body.record); if (!okId(r.id) || !r.user) throw new Error('Bad record');
      return res.status(200).json({ ok: true, ver: await write(['HSET', K.att, r.id, JSON.stringify(r)]) });
    }
    if (action === 'link') {
      const d = clean(body.device); if (!okId(d.id) || !d.user) throw new Error('Bad phone');
      const [cur] = await redis([['HGETALL', K.dev]]);
      const taken = asList(cur.result).find((x) => x.user === d.user && x.id !== d.id);
      if (taken) return res.status(409).json({ ok: false, error: 'This person already has a linked phone. Ask a supervisor to unlink it first.' });
      return res.status(200).json({ ok: true, ver: await write(['HSET', K.dev, d.id, JSON.stringify(d)]) });
    }
    if (action === 'unlink') {
      if (!okId(body.id)) throw new Error('Bad phone');
      return res.status(200).json({ ok: true, ver: await write(['HDEL', K.dev, body.id]) });
    }
    if (action === 'handover') {
      const l = clean(body.log); if (!okId(l.id) || !l.by) throw new Error('Bad handover');
      return res.status(200).json({ ok: true, ver: await write(['HSET', K.ho, l.id, JSON.stringify(l)]) });
    }
    if (action === 'reset') {
      await redis([['DEL', K.att, K.dev, K.ho]]);
      return res.status(200).json({ ok: true, ver: await write(['INCR', K.ver]) });
    }
    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    const msg = String((e && e.message) || e);
    return res.status(/^Bad|too large/.test(msg) ? 400 : 500).json({ ok: false, error: msg });
  }
};
