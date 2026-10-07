const today = new Date();
const monthNames = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const bookings = [
  '2026-10-09',
  '2026-10-10',
  '2026-10-18',
  '2026-10-25',
  '2026-11-07',
  '2026-11-08',
  '2026-11-14',
  '2026-11-21',
  '2026-11-28',
  '2026-12-04',
  '2026-12-05',
  '2026-12-12',
  '2026-12-19',
  '2027-01-09',
  '2027-01-16',
  '2027-01-22',
  '2027-02-13',
];

const state = {
  currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDate: '',
};

const dateInput = document.getElementById('dateInput');
const roomSelect = document.getElementById('roomSelect');
const eventTypeSelect = document.getElementById('eventTypeSelect');
const kitchenToggle = document.getElementById('kitchenToggle');
const daysSelect = document.getElementById('daysSelect');
const monthTitle = document.getElementById('monthTitle');
const calendar = document.getElementById('calendar');
const totalPriceEl = document.getElementById('totalPrice');
const summaryRoomEl = document.getElementById('summaryRoom');
const summaryCategoryEl = document.getElementById('summaryCategory');
const summaryPeriodEl = document.getElementById('summaryPeriod');
const heroPricePreview = document.getElementById('heroPricePreview');
const downloadButton = document.getElementById('downloadApplication');
const applicationPreview = document.getElementById('applicationPreview');
const bookingForm = document.getElementById('bookingForm');

const roomRates = {
  'Sitzungsraum': {
    baseSummer: 55,
    baseWinter: 65,
    category: 'Kategorie I',
    kitchenSurcharge: 0,
  },
  'Großer Raum': {
    baseSummer: 90,
    baseWinter: 105,
    category: 'Kategorie II',
    kitchenSurcharge: 35,
  },
};

function formatEuro(value) {
  return `${Number(value).toFixed(2).replace('.', ',')} €`;
}

function isBooked(dateString) {
  return bookings.includes(dateString);
}

function getSeason(date) {
  const month = date.getMonth();
  if (month >= 4 && month <= 8) return 'summer';
  return 'winter';
}

function getDaysFromSelection() {
  return Number(daysSelect.value || 1);
}

function calculatePrice() {
  const room = roomSelect.value;
  const selectedDate = dateInput.value ? new Date(dateInput.value + 'T12:00:00') : new Date();
  const days = getDaysFromSelection();
  const season = getSeason(selectedDate);
  const rateKey = season === 'summer' ? 'baseSummer' : 'baseWinter';
  const roomConfig = roomRates[room];
  const kitchenFee = room === 'Großer Raum' && kitchenToggle.checked ? roomConfig.kitchenSurcharge : 0;

  if (eventTypeSelect.value === 'community') return 0;

  const firstDayRate = roomConfig[rateKey] + kitchenFee;
  const extraDaysRate = Math.max(days - 1, 0) * ((roomConfig[rateKey] + kitchenFee) * 0.5);

  return firstDayRate + extraDaysRate;
}

function updateSummary() {
  const room = roomSelect.value;
  const category = roomRates[room].category;
  const days = getDaysFromSelection();
  const price = calculatePrice();

  summaryRoomEl.textContent = room;
  summaryCategoryEl.textContent = category;
  summaryPeriodEl.textContent = `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
  totalPriceEl.textContent = formatEuro(price);

  const heroBase = room === 'Großer Raum' ? 'ab 90,00 €' : 'ab 55,00 €';
  heroPricePreview.textContent = heroBase;
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthTitle.textContent = `${monthNames[month]} ${year}`;
  calendar.innerHTML = '';

  for (let index = 0; index < startWeekday; index += 1) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(year, month, day);
    const dateString = currentDate.toISOString().slice(0, 10);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    cell.textContent = day;

    if (currentDate.toDateString() === new Date().toDateString()) {
      cell.style.outline = '2px solid rgba(14, 90, 138, 0.28)';
    }

    if (isBooked(dateString)) {
      cell.classList.add('booked');
      cell.disabled = true;
      cell.title = 'Belegt';
    } else {
      cell.title = 'Verfügbar';
      if (state.selectedDate === dateString) {
        cell.classList.add('selected');
      }
      cell.addEventListener('click', () => {
        state.selectedDate = dateString;
        dateInput.value = dateString;
        renderCalendar();
        updateSummary();
      });
    }

    calendar.appendChild(cell);
  }
}

function updateSelectedDateFromInput() {
  if (dateInput.value) {
    state.selectedDate = dateInput.value;
    renderCalendar();
  }
  updateSummary();
}

function createPdfFromBooking(data) {
  const doc = new window.jspdf.jsPDF();
  const lineHeight = 8;
  let y = 20;

  const addLine = (text) => {
    doc.text(String(text), 20, y);
    y += lineHeight;
  };

  doc.setFontSize(18);
  doc.text('Antrag zur Nutzung von gemeindeeigenen Räumen', 20, y);
  y += 12;

  doc.setFontSize(11);
  addLine('Ortsteil Groß Leine');
  addLine('');
  addLine(`Name: ${data.name}`);
  addLine(`Anschrift: ${data.address}`);
  addLine(`Telefon: ${data.phone}`);
  addLine(`E-Mail: ${data.email}`);
  addLine('');
  addLine(`Raum: ${data.room}`);
  addLine(`Veranstaltungsart: ${data.eventType}`);
  addLine(`Datum: ${data.date}`);
  addLine(`Anzahl Tage: ${data.days}`);
  addLine(`Zweck: ${data.purpose}`);
  addLine(`Uhrzeit: ${data.time}`);
  addLine(`Küche mitbenutzt: ${data.kitchen ? 'Ja' : 'Nein'}`);
  addLine(`Gesamt: ${formatEuro(data.total)}`);
  addLine('');
  addLine('Unterschrift: ______________________________');

  doc.save('antrag-raumbuchung-gross-leine.pdf');
}

function renderApplication(data) {
  applicationPreview.innerHTML = `
    <h3>Vorschau des Antrags</h3>
    <div class="preview-grid">
      <div class="preview-item"><span>Name</span><strong>${data.name}</strong></div>
      <div class="preview-item"><span>Raum</span><strong>${data.room}</strong></div>
      <div class="preview-item"><span>Datum</span><strong>${data.date}</strong></div>
      <div class="preview-item"><span>Zweck</span><strong>${data.purpose}</strong></div>
      <div class="preview-item"><span>Küche</span><strong>${data.kitchen ? 'Ja' : 'Nein'}</strong></div>
      <div class="preview-item"><span>Gesamt</span><strong>${formatEuro(Number(data.total))}</strong></div>
    </div>
  `;
  applicationPreview.classList.add('visible');

  downloadButton.disabled = false;
  downloadButton.onclick = () => createPdfFromBooking(data);
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!document.getElementById('acceptRules').checked) {
    alert('Bitte bestätigen Sie, dass Sie die Satzung gelesen und verstanden haben.');
    return;
  }

  const formData = new FormData(bookingForm);
  const payload = {
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    room: formData.get('room'),
    eventType: formData.get('eventType'),
    date: formData.get('date'),
    days: Number(formData.get('days') || 1),
    purpose: formData.get('purpose'),
    time: formData.get('time'),
    kitchen: Boolean(formData.get('kitchen')),
    status: 'neu',
    price: calculatePrice(),
  };

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Fehler beim Speichern der Buchung.');
    }

    const data = {
      ...payload,
      ...result,
      total: Number(result.price || payload.price || 0),
    };

    renderApplication(data);
    window.scrollTo({ top: document.querySelector('.download-section').offsetTop, behavior: 'smooth' });
  } catch (error) {
    alert(error.message);
  }
}

bookingForm.addEventListener('submit', handleSubmit);

roomSelect.addEventListener('change', () => {
  if (roomSelect.value === 'Sitzungsraum') {
    kitchenToggle.checked = false;
    kitchenToggle.disabled = true;
  } else {
    kitchenToggle.disabled = false;
  }
  updateSummary();
});

kitchenToggle.addEventListener('change', updateSummary);
daysSelect.addEventListener('change', updateSummary);
eventTypeSelect.addEventListener('change', updateSummary);
dateInput.addEventListener('change', updateSelectedDateFromInput);
document.getElementById('prevMonth').addEventListener('click', () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

kitchenToggle.disabled = roomSelect.value !== 'Großer Raum';
renderCalendar();
updateSummary();
