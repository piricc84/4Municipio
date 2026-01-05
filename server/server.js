const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { insertReport, listReports, updateReportStatus } = require('./db');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ADMIN_USER = process.env.ADMIN_USER || 'consigliere';
const ADMIN_PASS = process.env.ADMIN_PASS || 'BariLoseto2025!';
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const safeId = req.reportId || crypto.randomUUID();
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${safeId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  },
});

const corsOrigins = CLIENT_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const parseBasicAuth = (header) => {
  if (!header || !header.startsWith('Basic ')) return null;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const index = decoded.indexOf(':');
  if (index === -1) return null;
  return { user: decoded.slice(0, index), pass: decoded.slice(index + 1) };
};

const requireAdmin = (req, res, next) => {
  const creds = parseBasicAuth(req.headers.authorization);
  if (!creds || creds.user !== ADMIN_USER || creds.pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

const attachReportId = (req, res, next) => {
  req.reportId = crypto.randomUUID();
  next();
};

app.post('/api/reports', attachReportId, upload.single('photo'), (req, res) => {
  const { category, description, address, lat, lng, reporterFirstName, reporterLastName } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: 'category and description are required' });
  }

  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  if (String(description).trim().length < 10) {
    return res.status(400).json({ error: 'description must be at least 10 characters' });
  }

  const report = {
    id: req.reportId,
    category: String(category).trim(),
    description: String(description).trim(),
    address: address ? String(address).trim() : '',
    lat: parsedLat,
    lng: parsedLng,
    photo_path: req.file ? `/uploads/${req.file.filename}` : '',
    reporter_first_name: reporterFirstName ? String(reporterFirstName).trim() : '',
    reporter_last_name: reporterLastName ? String(reporterLastName).trim() : '',
    status: 'nuova',
    created_at: new Date().toISOString(),
  };

  insertReport(report);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({
    ...report,
    photoUrl: report.photo_path ? `${baseUrl}${report.photo_path}` : '',
  });
});

app.get('/api/reports', requireAdmin, (req, res) => {
  const { status, category, q, limit, offset } = req.query;
  const reports = listReports({
    status,
    category,
    q,
    limit: Number.parseInt(limit, 10) || 50,
    offset: Number.parseInt(offset, 10) || 0,
  });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const mapped = reports.map((report) => ({
    ...report,
    photoUrl: report.photo_path ? `${baseUrl}${report.photo_path}` : '',
  }));
  res.json(mapped);
});

const allowedStatuses = new Set(['nuova', 'in_lavorazione', 'chiusa']);

app.patch('/api/reports/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  const ok = updateReportStatus(req.params.id, status);
  if (!ok) {
    return res.status(404).json({ error: 'report not found' });
  }
  res.json({ ok: true });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
