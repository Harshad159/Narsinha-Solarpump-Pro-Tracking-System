const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-local-secret';
// Store database in persistent /data directory on Render
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const DIST_PATH = path.join(__dirname, '..', 'dist');

// Create data directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Serve static frontend files
app.use(express.static(DIST_PATH));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ----- DB INIT -----
const runMigrations = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      mobile TEXT,
      aadhaar TEXT
    );

    CREATE TABLE IF NOT EXISTS installers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      mobile TEXT,
      aadhaar TEXT
    );

    CREATE TABLE IF NOT EXISTS inward_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      supplier TEXT NOT NULL,
      invoice_no TEXT NOT NULL,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS inward_materials (
      id TEXT PRIMARY KEY,
      inward_id TEXT NOT NULL,
      category TEXT NOT NULL,
      spec TEXT NOT NULL,
      qty INTEGER NOT NULL,
      serials TEXT
    );

    CREATE TABLE IF NOT EXISTS dispatch_entries (
      id TEXT PRIMARY KEY,
      challan_no TEXT NOT NULL,
      date TEXT NOT NULL,
      installer_id TEXT,
      installer_name TEXT,
      installer_mobile TEXT,
      beneficiary_id TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      farmer_mobile TEXT,
      zone TEXT,
      circle TEXT,
      division TEXT,
      sub_division TEXT,
      taluka TEXT,
      village TEXT,
      expected_date TEXT,
      vehicle_no TEXT,
      status TEXT NOT NULL,
      last_update_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dispatch_materials (
      id TEXT PRIMARY KEY,
      dispatch_id TEXT NOT NULL,
      category TEXT NOT NULL,
      spec TEXT NOT NULL,
      qty INTEGER NOT NULL,
      serials TEXT
    );

    CREATE TABLE IF NOT EXISTS dispatch_history (
      id TEXT PRIMARY KEY,
      dispatch_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT,
      image_urls TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
};

const seedDefaults = () => {
  // Check if this is the first run
  const isSetup = db.prepare('SELECT 1 FROM meta WHERE key = ?').get('db_initialized');
  
  // Only seed if this is the first run (not on every restart)
  if (!isSetup) {
    const admin = db.prepare('SELECT 1 FROM users WHERE role = ?').get('ADMIN');
    if (!admin) {
      db.prepare('INSERT INTO users (id, name, role, pin_hash, mobile) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), 'Admin', 'ADMIN', bcrypt.hashSync('1111', 8), '9999999999');
    }

    const keeper = db.prepare('SELECT 1 FROM users WHERE role = ?').get('STORE_KEEPER');
    if (!keeper) {
      db.prepare('INSERT INTO users (id, name, role, pin_hash) VALUES (?, ?, ?, ?)')
        .run(randomUUID(), 'Store Keeper', 'STORE_KEEPER', bcrypt.hashSync('2222', 8));
    }

    // Mark setup as complete so this doesn't run on every server restart
    db.prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('db_initialized', 'true');
  }

  // Always clean up legacy demo installer if present
  db.prepare('DELETE FROM installers WHERE id = ? OR name = ?').run('INST-0001', 'Demo Installer');
};

runMigrations();
seedDefaults();

// ----- HELPERS -----
const toInward = (row) => {
  const materials = db.prepare('SELECT * FROM inward_materials WHERE inward_id = ?').all(row.id).map((m) => ({
    category: m.category,
    specification: m.spec,
    quantity: m.qty,
    serialNumbers: m.serials ? JSON.parse(m.serials) : undefined,
  }));
  return {
    id: row.id,
    date: row.date,
    supplier: row.supplier,
    invoiceNo: row.invoice_no,
    remarks: row.remarks || '',
    materials,
  };
};

const toDispatch = (row) => {
  const materials = db.prepare('SELECT * FROM dispatch_materials WHERE dispatch_id = ?').all(row.id).map((m) => ({
    category: m.category,
    specification: m.spec,
    quantity: m.qty,
    serialNumbers: m.serials ? JSON.parse(m.serials) : undefined,
  }));

  const history = db.prepare('SELECT * FROM dispatch_history WHERE dispatch_id = ? ORDER BY date ASC, id ASC').all(row.id).map((h) => ({
    id: h.id,
    date: h.date,
    status: h.status,
    remarks: h.remarks || '',
    imageUrls: h.image_urls ? JSON.parse(h.image_urls) : undefined,
  }));

  return {
    id: row.id,
    challanNo: row.challan_no,
    date: row.date,
    installerId: row.installer_id || undefined,
    installerName: row.installer_name || '',
    installerMobile: row.installer_mobile || '',
    beneficiaryId: row.beneficiary_id,
    farmerName: row.farmer_name,
    farmerMobile: row.farmer_mobile || '',
    zone: row.zone || '',
    circle: row.circle || '',
    division: row.division || '',
    subDivision: row.sub_division || '',
    taluka: row.taluka || '',
    village: row.village || '',
    materials,
    expectedDate: row.expected_date || '',
    vehicleNo: row.vehicle_no || '',
    status: row.status,
    lastUpdateDate: row.last_update_date,
    history,
  };
};

const getNextChallan = () => {
  const current = db.prepare('SELECT value FROM meta WHERE key = ?').get('last_challan_no');
  const next = current ? Number(current.value) + 1 : 1;
  const formatted = `DC-${String(next).padStart(4, '0')}`;
  db.prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('last_challan_no', String(next));
  return formatted;
};

const authMiddleware = (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/health') return next();
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Unauthorized' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.use(authMiddleware);

// ----- ROUTES -----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/auth/login', (req, res) => {
  const { role, id, pin } = req.body || {};
  if (!role || !pin) return res.status(400).json({ message: 'role and pin required' });

  if (role === 'INSTALLER') {
    const installer = db.prepare('SELECT * FROM installers WHERE id = ?').get((id || '').toUpperCase());
    if (!installer) return res.status(401).json({ message: 'Invalid installer ID' });
    if (!bcrypt.compareSync(String(pin), installer.pin_hash)) return res.status(401).json({ message: 'Invalid PIN' });
    const token = jwt.sign({ sub: installer.id, role, name: installer.name }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, userName: installer.name });
  }

  const user = db.prepare('SELECT * FROM users WHERE role = ?').get(role);
  if (!user) return res.status(401).json({ message: 'User not found' });
  if (!bcrypt.compareSync(String(pin), user.pin_hash)) return res.status(401).json({ message: 'Invalid PIN' });
  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, userName: user.name });
});

app.get('/installers', (req, res) => {
  const rows = db.prepare('SELECT * FROM installers ORDER BY name ASC').all();
  res.json(rows.map((r) => ({ id: r.id, name: r.name, pin: '****', mobile: r.mobile || '', aadhaar: r.aadhaar || '' })));
});

app.post('/installers', (req, res) => {
  const { id, name, pin, mobile, aadhaar } = req.body || {};
  if (!name || !pin) return res.status(400).json({ message: 'name and pin required' });
  const newId = (id || `INST-${Math.random().toString(36).substr(2, 5)}`).toUpperCase();
  db.prepare('INSERT INTO installers (id, name, pin_hash, mobile, aadhaar) VALUES (?, ?, ?, ?, ?)')
    .run(newId, name, bcrypt.hashSync(String(pin), 8), mobile || null, aadhaar || null);
  const created = db.prepare('SELECT * FROM installers WHERE id = ?').get(newId);
  res.json({ id: created.id, name: created.name, pin: '****', mobile: created.mobile || '', aadhaar: created.aadhaar || '' });
});

app.delete('/installers/:id', (req, res) => {
  db.prepare('DELETE FROM installers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/inward', (req, res) => {
  const rows = db.prepare('SELECT * FROM inward_entries ORDER BY date DESC, id DESC').all();
  res.json(rows.map(toInward));
});

const insertInwardTx = db.transaction((entry) => {
  db.prepare('INSERT INTO inward_entries (id, date, supplier, invoice_no, remarks) VALUES (?, ?, ?, ?, ?)')
    .run(entry.id, entry.date, entry.supplier, entry.invoiceNo, entry.remarks || '');
  const stmt = db.prepare('INSERT INTO inward_materials (id, inward_id, category, spec, qty, serials) VALUES (?, ?, ?, ?, ?, ?)');
  entry.materials.forEach((m) => {
    stmt.run(randomUUID(), entry.id, m.category, m.specification, m.quantity, m.serialNumbers ? JSON.stringify(m.serialNumbers) : null);
  });
});

app.post('/inward', (req, res) => {
  const body = req.body || {};
  if (!body.materials || !Array.isArray(body.materials) || body.materials.length === 0) {
    return res.status(400).json({ message: 'materials required' });
  }
  const entry = {
    id: body.id || randomUUID(),
    date: body.date || new Date().toISOString().split('T')[0],
    supplier: body.supplier,
    invoiceNo: body.invoiceNo,
    remarks: body.remarks || '',
    materials: body.materials,
  };
  insertInwardTx(entry);
  const saved = db.prepare('SELECT * FROM inward_entries WHERE id = ?').get(entry.id);
  res.json(toInward(saved));
});

const updateInwardTx = db.transaction((entry) => {
  db.prepare('UPDATE inward_entries SET date = ?, supplier = ?, invoice_no = ?, remarks = ? WHERE id = ?')
    .run(entry.date, entry.supplier, entry.invoiceNo, entry.remarks || '', entry.id);
  db.prepare('DELETE FROM inward_materials WHERE inward_id = ?').run(entry.id);
  const stmt = db.prepare('INSERT INTO inward_materials (id, inward_id, category, spec, qty, serials) VALUES (?, ?, ?, ?, ?, ?)');
  entry.materials.forEach((m) => {
    stmt.run(randomUUID(), entry.id, m.category, m.specification, m.quantity, m.serialNumbers ? JSON.stringify(m.serialNumbers) : null);
  });
});

app.put('/inward/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM inward_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Inward entry not found' });
  const body = req.body || {};
  const entry = {
    id: req.params.id,
    date: body.date || existing.date,
    supplier: body.supplier || existing.supplier,
    invoiceNo: body.invoiceNo || existing.invoice_no,
    remarks: body.remarks || existing.remarks,
    materials: body.materials || [],
  };
  updateInwardTx(entry);
  const saved = db.prepare('SELECT * FROM inward_entries WHERE id = ?').get(req.params.id);
  res.json(toInward(saved));
});

app.delete('/inward/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM inward_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Inward entry not found' });

  db.transaction(() => {
    db.prepare('DELETE FROM inward_materials WHERE inward_id = ?').run(req.params.id);
    db.prepare('DELETE FROM inward_entries WHERE id = ?').run(req.params.id);
  })();

  res.json({ ok: true });
});

app.get('/dispatch', (req, res) => {
  const rows = db.prepare('SELECT * FROM dispatch_entries ORDER BY date DESC, id DESC').all();
  res.json(rows.map(toDispatch));
});

const insertDispatchTx = db.transaction((entry) => {
  db.prepare(`
    INSERT INTO dispatch_entries (
      id, challan_no, date, installer_id, installer_name, installer_mobile, beneficiary_id,
      farmer_name, farmer_mobile, zone, circle, division, sub_division, taluka, village,
      expected_date, vehicle_no, status, last_update_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
    entry.challanNo,
    entry.date,
    entry.installerId || null,
    entry.installerName || null,
    entry.installerMobile || null,
    entry.beneficiaryId,
    entry.farmerName,
    entry.farmerMobile || null,
    entry.zone || null,
    entry.circle || null,
    entry.division || null,
    entry.subDivision || null,
    entry.taluka || null,
    entry.village || null,
    entry.expectedDate || null,
    entry.vehicleNo || null,
    entry.status,
    entry.lastUpdateDate
  );

  const materialStmt = db.prepare('INSERT INTO dispatch_materials (id, dispatch_id, category, spec, qty, serials) VALUES (?, ?, ?, ?, ?, ?)');
  entry.materials.forEach((m) => {
    materialStmt.run(randomUUID(), entry.id, m.category, m.specification, m.quantity, m.serialNumbers ? JSON.stringify(m.serialNumbers) : null);
  });

  const historyStmt = db.prepare('INSERT INTO dispatch_history (id, dispatch_id, date, status, remarks, image_urls) VALUES (?, ?, ?, ?, ?, ?)');
  (entry.history || []).forEach((h) => {
    historyStmt.run(h.id || randomUUID(), entry.id, h.date, h.status, h.remarks || '', h.imageUrls ? JSON.stringify(h.imageUrls) : null);
  });
});

app.post('/dispatch', (req, res) => {
  const body = req.body || {};
  if (!body.materials || !Array.isArray(body.materials) || body.materials.length === 0) {
    return res.status(400).json({ message: 'materials required' });
  }
  const now = new Date().toISOString().split('T')[0];
  const entry = {
    id: body.id || randomUUID(),
    challanNo: body.challanNo && body.challanNo !== 'PENDING' ? body.challanNo : getNextChallan(),
    date: body.date || now,
    installerId: body.installerId,
    installerName: body.installerName,
    installerMobile: body.installerMobile,
    beneficiaryId: body.beneficiaryId,
    farmerName: body.farmerName,
    farmerMobile: body.farmerMobile,
    zone: body.zone,
    circle: body.circle,
    division: body.division,
    subDivision: body.subDivision,
    taluka: body.taluka,
    village: body.village,
    expectedDate: body.expectedDate,
    vehicleNo: body.vehicleNo,
    status: body.status || 'Not Started',
    lastUpdateDate: body.lastUpdateDate || now,
    materials: body.materials,
    history: body.history || [],
  };
  insertDispatchTx(entry);
  const saved = db.prepare('SELECT * FROM dispatch_entries WHERE id = ?').get(entry.id);
  res.json(toDispatch(saved));
});

const updateDispatchTx = db.transaction((entry) => {
  db.prepare(`
    UPDATE dispatch_entries SET 
      challan_no = ?, date = ?, installer_id = ?, installer_name = ?, installer_mobile = ?,
      beneficiary_id = ?, farmer_name = ?, farmer_mobile = ?, zone = ?, circle = ?, 
      division = ?, sub_division = ?, taluka = ?, village = ?, expected_date = ?, 
      vehicle_no = ?, status = ?, last_update_date = ?
    WHERE id = ?
  `).run(
    entry.challanNo,
    entry.date,
    entry.installerId || null,
    entry.installerName || null,
    entry.installerMobile || null,
    entry.beneficiaryId,
    entry.farmerName,
    entry.farmerMobile || null,
    entry.zone || null,
    entry.circle || null,
    entry.division || null,
    entry.subDivision || null,
    entry.taluka || null,
    entry.village || null,
    entry.expectedDate || null,
    entry.vehicleNo || null,
    entry.status,
    entry.lastUpdateDate,
    entry.id
  );

  // Delete old materials and insert new ones
  db.prepare('DELETE FROM dispatch_materials WHERE dispatch_id = ?').run(entry.id);
  const materialStmt = db.prepare('INSERT INTO dispatch_materials (id, dispatch_id, category, spec, qty, serials) VALUES (?, ?, ?, ?, ?, ?)');
  entry.materials.forEach((m) => {
    materialStmt.run(randomUUID(), entry.id, m.category, m.specification, m.quantity, m.serialNumbers ? JSON.stringify(m.serialNumbers) : null);
  });
});

app.put('/dispatch/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM dispatch_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Dispatch entry not found' });
  
  const body = req.body || {};
  const now = new Date().toISOString().split('T')[0];
  const entry = {
    id: req.params.id,
    challanNo: body.challanNo || existing.challan_no,
    date: body.date || existing.date,
    installerId: body.installerId || existing.installer_id,
    installerName: body.installerName || existing.installer_name,
    installerMobile: body.installerMobile || existing.installer_mobile,
    beneficiaryId: body.beneficiaryId || existing.beneficiary_id,
    farmerName: body.farmerName || existing.farmer_name,
    farmerMobile: body.farmerMobile || existing.farmer_mobile,
    zone: body.zone || existing.zone,
    circle: body.circle || existing.circle,
    division: body.division || existing.division,
    subDivision: body.subDivision || existing.sub_division,
    taluka: body.taluka || existing.taluka,
    village: body.village || existing.village,
    expectedDate: body.expectedDate || existing.expected_date,
    vehicleNo: body.vehicleNo || existing.vehicle_no,
    status: body.status || existing.status,
    lastUpdateDate: now,
    materials: body.materials || [],
  };
  
  updateDispatchTx(entry);
  const saved = db.prepare('SELECT * FROM dispatch_entries WHERE id = ?').get(req.params.id);
  res.json(toDispatch(saved));
});

app.patch('/site/:beneficiaryId/status', (req, res) => {
  const { status, remarks, imageUrls } = req.body || {};
  if (!status) return res.status(400).json({ message: 'status required' });
  const dispatch = db.prepare('SELECT * FROM dispatch_entries WHERE beneficiary_id = ?').get(req.params.beneficiaryId);
  if (!dispatch) return res.status(404).json({ message: 'site not found' });

  const today = new Date().toISOString().split('T')[0];
  const historyId = randomUUID();
  db.prepare('INSERT INTO dispatch_history (id, dispatch_id, date, status, remarks, image_urls) VALUES (?, ?, ?, ?, ?, ?)')
    .run(historyId, dispatch.id, today, status, remarks || '', imageUrls ? JSON.stringify(imageUrls) : null);
  db.prepare('UPDATE dispatch_entries SET status = ?, last_update_date = ? WHERE id = ?')
    .run(status, today, dispatch.id);

  const updated = db.prepare('SELECT * FROM dispatch_entries WHERE id = ?').get(dispatch.id);
  res.json(toDispatch(updated));
});

app.delete('/dispatch/:id', (req, res) => {
  const { id } = req.params;
  const entry = db.prepare('SELECT * FROM dispatch_entries WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ message: 'Dispatch entry not found' });

  // Delete cascade: history, materials, then entry
  // Note: Stock is calculated dynamically (Inward - Dispatched), so no need to restore
  db.prepare('DELETE FROM dispatch_history WHERE dispatch_id = ?').run(id);
  db.prepare('DELETE FROM dispatch_materials WHERE dispatch_id = ?').run(id);
  db.prepare('DELETE FROM dispatch_entries WHERE id = ?').run(id);

  res.json({ ok: true, message: 'Dispatch deleted successfully' });
});

// ADMIN: Clear all sample/test data (for going live)
// ⚠️ WARNING: This deletes ALL inward and dispatch data - use with caution!
app.post('/admin/reset-sample-data', (req, res) => {
  // Require admin authentication - only ADMIN role can call this
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const clearData = db.transaction(() => {
      // Delete all dispatch data
      db.prepare('DELETE FROM dispatch_history').run();
      db.prepare('DELETE FROM dispatch_materials').run();
      db.prepare('DELETE FROM dispatch_entries').run();

      // Delete all inward data
      db.prepare('DELETE FROM inward_materials').run();
      db.prepare('DELETE FROM inward_entries').run();

      // Reset challan counter
      db.prepare('DELETE FROM meta WHERE key = ?').run('last_challan_no');
    });
    
    clearData();

    res.json({ 
      ok: true, 
      message: 'All sample inward and dispatch data cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing sample data:', error);
    res.status(500).json({ message: 'Failed to clear data: ' + error.message });
  }
});

// Catch-all: serve index.html for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'), (err) => {
    if (err) res.status(404).json({ message: 'Not found' });
  });
});

app.listen(PORT, () => {
  const ip = require('os').networkInterfaces();
  const addresses = [];
  for (const name in ip) {
    for (const addr of ip[name]) {
      if (addr.family === 'IPv4' && !addr.internal) addresses.push(addr.address);
    }
  }
  console.log(`\n✅ App running on:`);
  console.log(`   Local: http://localhost:${PORT}`);
  if (addresses.length > 0) console.log(`   Network: http://${addresses[0]}:${PORT}`);
  console.log(`\n📁 Database: ${DB_PATH}\n`);
});
