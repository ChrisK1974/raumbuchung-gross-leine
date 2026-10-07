const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  addBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  exportCsv,
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'markische-heide-admin-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function calculatePrice(room, days, kitchen, eventType, date) {
  if (eventType === 'community') return 0;

  const month = new Date(date + 'T12:00:00').getMonth();
  const isSummer = month >= 4 && month <= 8;

  const roomRates = {
    'Sitzungsraum': { summer: 55, winter: 65, kitchen: 0 },
    'Großer Raum': { summer: 90, winter: 105, kitchen: 35 },
  };

  const base = roomRates[room] || roomRates['Sitzungsraum'];
  const rate = isSummer ? base.summer : base.winter;
  const surcharge = room === 'Großer Raum' && kitchen ? base.kitchen : 0;
  const dayCount = Number(days || 1);

  if (dayCount <= 1) return rate + surcharge;

  const extra = (rate + surcharge) * 0.5 * (dayCount - 1);
  return (rate + surcharge) + extra;
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    return res.status(401).json({ message: 'Nicht authorisiert.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token ungültig.' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Benutzername und Passwort erforderlich.' });
  }

  const validUser = username === ADMIN_USERNAME;
  const validPassword = bcrypt.compareSync(password, ADMIN_HASH);

  if (!validUser || !validPassword) {
    return res.status(401).json({ message: 'Falsche Zugangsdaten.' });
  }

  const token = jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, user: ADMIN_USERNAME });
});

app.get('/api/auth/verify', authenticateAdmin, (req, res) => {
  res.json({ ok: true, user: req.user.username });
});

app.post('/api/bookings', (req, res) => {
  const booking = req.body || {};

  if (!booking.name || !booking.address || !booking.phone || !booking.email || !booking.date || !booking.purpose) {
    return res.status(400).json({ message: 'Bitte alle Pflichtfelder ausfüllen.' });
  }

  const calculatedPrice = calculatePrice(
    booking.room || 'Sitzungsraum',
    booking.days || 1,
    booking.kitchen || false,
    booking.eventType || 'private',
    booking.date
  );

  const payload = {
    ...booking,
    kitchen: Boolean(booking.kitchen),
    days: Number(booking.days || 1),
    eventType: booking.eventType || 'private',
    room: booking.room || 'Sitzungsraum',
    price: calculatedPrice,
    status: booking.status || 'neu',
  };

  const created = addBooking(payload);
  return res.status(201).json(created);
});

app.get('/api/admin/bookings', authenticateAdmin, (req, res) => {
  res.json(getAllBookings());
});

app.get('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const booking = getBookingById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: 'Buchung nicht gefunden.' });
  }

  return res.json(booking);
});

app.put('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const existing = getBookingById(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Buchung nicht gefunden.' });
  }

  const booking = req.body || {};
  const recalc = {
    ...existing,
    ...booking,
    room: booking.room || existing.room,
    eventType: booking.eventType || existing.eventType,
    date: booking.date || existing.date,
    days: Number(booking.days || existing.days),
    kitchen: booking.kitchen !== undefined ? Boolean(booking.kitchen) : Boolean(existing.kitchen),
    price: booking.price !== undefined ? Number(booking.price) : Number(existing.price),
  };

  if (recalc.eventType !== 'community') {
    recalc.price = calculatePrice(
      recalc.room,
      recalc.days,
      recalc.kitchen,
      recalc.eventType,
      recalc.date
    );
  }

  const updated = updateBooking(req.params.id, recalc);
  return res.json(updated);
});

app.delete('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const ok = deleteBooking(req.params.id);

  if (!ok) {
    return res.status(404).json({ message: 'Buchung nicht gefunden.' });
  }

  return res.json({ success: true });
});

app.get('/api/admin/bookings/export/csv', authenticateAdmin, (req, res) => {
  const csv = exportCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="buchungen.csv"');
  res.send(csv);
});

app.use(express.static(path.join(__dirname, '..')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.get('*', (req, res) => {
  const rootPath = path.join(__dirname, '..', 'index.html');
  res.sendFile(rootPath);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`Admin-Login: ${ADMIN_USERNAME}/${ADMIN_PASSWORD}`);
});
