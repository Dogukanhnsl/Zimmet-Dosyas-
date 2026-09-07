const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Ayarlar (ortam değişkenleriyle değiştirin) ----
const APP_PASSWORD = process.env.APP_PASSWORD || 'zimmet2026';
const APP_SECRET = process.env.APP_SECRET || 'lutfen-bu-degeri-degistirin';

// Supabase ayarlanmışsa veri orada (kalıcı, ücretsiz) tutulur.
// Ayarlanmamışsa (örn. bilgisayarınızda test ederken) yerel data/state.json dosyası kullanılır.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

if (process.env.APP_PASSWORD === undefined) {
  console.warn('[UYARI] APP_PASSWORD ortam değişkeni ayarlanmadı, varsayılan şifre kullanılıyor: "zimmet2026". Lütfen production ortamında mutlaka değiştirin.');
}
if (process.env.APP_SECRET === undefined) {
  console.warn('[UYARI] APP_SECRET ortam değişkeni ayarlanmadı. Lütfen production ortamında rastgele, gizli bir değer belirleyin.');
}
if (!USE_SUPABASE) {
  console.warn('[BİLGİ] SUPABASE_URL / SUPABASE_SERVICE_KEY ayarlanmadı, veriler yerel data/state.json dosyasında tutulacak. Bu, ücretsiz hosting ortamlarında kalıcı OLMAYABİLİR — canlıya alırken Supabase kullanın (README.md).');
}

// ---- Yerel dosya (sadece Supabase yokken kullanılır) ----
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
function ensureLocalFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ people: [], transactions: [] }, null, 2));
  }
}
function readLocalState() {
  ensureLocalFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { people: [], transactions: [] };
  }
}
function writeLocalState(obj) {
  ensureLocalFile();
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// ---- Supabase (Postgres REST API) üzerinden kalıcı veri ----
async function readSupabaseState() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=data`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error('Supabase okuma hatası: ' + (await res.text()));
  const rows = await res.json();
  if (rows[0] && rows[0].data) return rows[0].data;
  return { people: [], transactions: [] };
}
async function writeSupabaseState(obj) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ id: 1, data: obj }),
  });
  if (!res.ok) throw new Error('Supabase yazma hatası: ' + (await res.text()));
}

async function readState() {
  return USE_SUPABASE ? readSupabaseState() : readLocalState();
}
async function writeState(obj) {
  return USE_SUPABASE ? writeSupabaseState(obj) : writeLocalState(obj);
}

// ---- Basit şifre koruması ----
function tokenFor(pw) {
  return crypto.createHmac('sha256', APP_SECRET).update(pw).digest('hex');
}
const VALID_TOKEN = tokenFor(APP_PASSWORD);

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.zt;
  if (token && token === VALID_TOKEN) return next();
  return res.status(401).json({ error: 'Giriş gerekli.' });
}

app.use(express.json({ limit: '3mb' }));
app.use(cookieParser());

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password === 'string' && password === APP_PASSWORD) {
    res.cookie('zt', VALID_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 90, // 90 gün
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false });
});

app.get('/api/state', requireAuth, async (req, res) => {
  try {
    res.json(await readState());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Veri okunamadı.' });
  }
});

app.post('/api/state', requireAuth, async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Geçersiz veri.' });
  }
  try {
    await writeState(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Veri kaydedilemedi.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Zimmet Defteri sunucusu http://localhost:${PORT} adresinde çalışıyor (veri: ${USE_SUPABASE ? 'Supabase' : 'yerel dosya'})`);
});

