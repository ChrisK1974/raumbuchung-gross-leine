const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'bookings.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    room TEXT NOT NULL,
    eventType TEXT NOT NULL,
    date TEXT NOT NULL,
    days INTEGER NOT NULL DEFAULT 1,
    purpose TEXT NOT NULL,
    time TEXT NOT NULL,
    kitchen INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'neu',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function getAllBookings() {
  return db.prepare('SELECT * FROM bookings ORDER BY date ASC, createdAt DESC').all();
}

function getBookingById(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

function addBooking(data) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO bookings (
      name, address, phone, email, room, eventType, date, days, purpose,
      time, kitchen, price, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.address,
    data.phone,
    data.email,
    data.room,
    data.eventType,
    data.date,
    Number(data.days || 1),
    data.purpose,
    data.time,
    data.kitchen ? 1 : 0,
    Number(data.price || 0),
    data.status || 'neu',
    now,
    now
  );

  return getBookingById(result.lastInsertRowid);
}

function updateBooking(id, data) {
  const existing = getBookingById(id);
  if (!existing) return null;

  const updated = {
    name: data.name || existing.name,
    address: data.address || existing.address,
    phone: data.phone || existing.phone,
    email: data.email || existing.email,
    room: data.room || existing.room,
    eventType: data.eventType || existing.eventType,
    date: data.date || existing.date,
    days: Number(data.days || existing.days),
    purpose: data.purpose || existing.purpose,
    time: data.time || existing.time,
    kitchen: data.kitchen !== undefined ? (data.kitchen ? 1 : 0) : existing.kitchen,
    price: Number(data.price !== undefined ? data.price : existing.price),
    status: data.status || existing.status,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE bookings SET
      name = ?, address = ?, phone = ?, email = ?, room = ?, eventType = ?,
      date = ?, days = ?, purpose = ?, time = ?, kitchen = ?, price = ?,
      status = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.address,
    updated.phone,
    updated.email,
    updated.room,
    updated.eventType,
    updated.date,
    updated.days,
    updated.purpose,
    updated.time,
    updated.kitchen,
    updated.price,
    updated.status,
    updated.updatedAt,
    id
  );

  return getBookingById(id);
}

function deleteBooking(id) {
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return result.changes > 0;
}

function exportCsv() {
  const rows = getAllBookings();
  const headers = [
    'id',
    'name',
    'address',
    'phone',
    'email',
    'room',
    'eventType',
    'date',
    'days',
    'purpose',
    'time',
    'kitchen',
    'price',
    'status',
    'createdAt',
    'updatedAt',
  ];

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    const line = headers.map((key) => {
      const value = row[key] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    lines.push(line);
  });

  return lines.join('\n');
}

module.exports = {
  getAllBookings,
  getBookingById,
  addBooking,
  updateBooking,
  deleteBooking,
  exportCsv,
};
