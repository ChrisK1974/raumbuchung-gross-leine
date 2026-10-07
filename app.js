const today = new Date();
const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const bookings = [
  "2026-10-09",
  "2026-10-10",
  "2026-10-18",
  "2026-10-25",
  "2026-11-07",
  "2026-11-08",
  "2026-11-14",
  "2026-11-21",
  "2026-11-28",
  "2026-12-04",
  "2026-12-05",
  "2026-12-12",
  "2026-12-19",
  "2027-01-09",
  "2027-01-16",
  "2027-01-22",
  "2027-02-13",
];

const state = {
  currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDate: "",
};

const dateInput = document.getElementById("dateInput");
const roomSelect = document.getElementById("roomSelect");
const eventTypeSelect = document.getElementById("eventTypeSelect");
const kitchenToggle = document.getElementById("kitchenToggle");
const daysSelect = document.getElementById("daysSelect");
const monthTitle = document.getElementById("monthTitle");
const calendar = document.getElementById("calendar");
const totalPriceEl = document.getElementById("totalPrice");
const summaryRoomEl = document.getElementById("summaryRoom");
const summaryCategoryEl = document.getElementById("summaryCategory");
const summaryPeriodEl = document.getElementById("summaryPeriod");
const heroPricePreview = document.getElementById("heroPricePreview");
const downloadButton = document.getElementById("downloadApplication");
const applicationPreview = document.getElementById("applicationPreview");
const bookingForm = document.getElementById("bookingForm");

const roomRates = {
  "Sitzungsraum": {
    baseSummer: 55,
    baseWinter: 65,
    category: "Kategorie I",
    kitchenSurcharge: 0,
  },
  "Großer Raum": {
    baseSummer: 90,
    baseWinter: 105,
    category: "Kategorie II",
    kitchenSurcharge: 35,
  },
};

function formatEuro(value) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function isBooked(dateString) {
  return bookings.includes(dateString);
}

function getSeason(date) {
  const month = date.getMonth();
  if (month >= 4 && month <= 8) {
    return "summer";
  }
  return "winter";
}

function getDaysFromSelection() {
  return Number(daysSelect.value || 1);
}

function calculatePrice() {
  const room = roomSelect.value;
  const selectedDate = dateInput.value ? new Date(dateInput.value + "T12:00:00") : new Date();
  const days = getDaysFromSelection();
  const season = getSeason(selectedDate);
  const rateKey = season === "summer" ? "baseSummer" : "baseWinter";
  const roomConfig = roomRates[room];
  const kitchenFee = room === "Großer Raum" && kitchenToggle.checked ? roomConfig.kitchenSurcharge : 0;

  if (eventTypeSelect.value === "community") {
    return 0;
  }

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
  summaryPeriodEl.textContent = `${days} ${days === 1 ? "Tag" : "Tage"}`;
  totalPriceEl.textContent = formatEuro(price);

  const heroBase = room === "Großer Raum" ? "ab 90,00 €" : "ab 55,00 €";
  heroPricePreview.textContent = heroBase;
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthTitle.textContent = `${monthNames[month]} ${year}`;
  calendar.innerHTML = "";

  for (let index = 0; index < startWeekday; index += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell empty";
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(year, month, day);
    const dateString = currentDate.toISOString().slice(0, 10);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    cell.textContent = day;

    if (currentDate.toDateString() === new Date().toDateString()) {
      cell.style.outline = "2px solid rgba(14, 90, 138, 0.28)";
    }

    if (isBooked(dateString)) {
      cell.classList.add("booked");
      cell.disabled = true;
      cell.title = "Belegt";
    } else {
      cell.title = "Verfügbar";
      if (state.selectedDate === dateString) {
        cell.classList.add("selected");
      }
      cell.addEventListener("click", () => {
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

function generateApplicationHtml(data) {
  const room = data.room;
  const kitchen = data.kitchen ? "Ja" : "Nein";
  const eventLabel = {
    private: "Private Feier",
    event: "Veranstaltung",
    community: "Gemeindeveranstaltung",
  }[data.eventType];

  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <title>Antrag zur Nutzung von gemeindeeigenen Räumen</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1d2a33; }
          h1 { font-size: 26px; }
          .box { border: 1px solid #dfe8ee; border-radius: 12px; padding: 20px; margin-top: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
          .label { font-size: 12px; color: #536674; display: block; margin-bottom: 4px; }
          .value { font-weight: bold; }
          .total { margin-top: 16px; padding-top: 16px; border-top: 1px solid #dfe8ee; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Antrag zur Nutzung von gemeindeeigenen Räumen</h1>
        <p>Ortsteil Groß Leine • Satzung vom 01.01.2024</p>

        <div class="box">
          <h2>Antragsteller</h2>
          <div class="grid">
            <div><span class="label">Name</span><span class="value">${data.name}</span></div>
            <div><span class="label">Anschrift</span><span class="value">${data.address}</span></div>
            <div><span class="label">Telefon</span><span class="value">${data.phone}</span></div>
            <div><span class="label">E-Mail</span><span class="value">${data.email}</span></div>
          </div>
        </div>

        <div class="box">
          <h2>Veranstaltungsdaten</h2>
          <div class="grid">
            <div><span class="label">Raum</span><span class="value">${room}</span></div>
            <div><span class="label">Veranstaltungsart</span><span class="value">${eventLabel}</span></div>
            <div><span class="label">Datum</span><span class="value">${data.date}</span></div>
            <div><span class="label">Anzahl Tage</span><span class="value">${data.days}</span></div>
            <div><span class="label">Zweck</span><span class="value">${data.purpose}</span></div>
            <div><span class="label">Uhrzeit</span><span class="value">${data.time}</span></div>
            <div><span class="label">Küche mitbenutzt</span><span class="value">${kitchen}</span></div>
            <div><span class="label">Gebühr</span><span class="value">${formatEuro(Number(data.total))}</span></div>
          </div>
        </div>

        <div class="box">
          <h2>Unterschrift</h2>
          <p>______________________________</p>
          <p>Ort, Datum</p>
        </div>
      </body>
    </html>
  `;
}

function renderApplication(data) {
  const html = generateApplicationHtml(data);
  applicationPreview.innerHTML = `
    <h3>Vorschau des Antrags</h3>
    <div class="preview-grid">
      <div class="preview-item"><span>Name</span><strong>${data.name}</strong></div>
      <div class="preview-item"><span>Raum</span><strong>${data.room}</strong></div>
      <div class="preview-item"><span>Datum</span><strong>${data.date}</strong></div>
      <div class="preview-item"><span>Zweck</span><strong>${data.purpose}</strong></div>
      <div class="preview-item"><span>Küche</span><strong>${data.kitchen ? "Ja" : "Nein"}</strong></div>
      <div class="preview-item"><span>Gesamt</span><strong>${formatEuro(Number(data.total))}</strong></div>
    </div>
  `;
  applicationPreview.classList.add("visible");

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  downloadButton.disabled = false;
  downloadButton.onclick = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "antrag-raumbuchung-gross-leine.html";
    link.click();
  };
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(bookingForm);
  const formObject = Object.fromEntries(formData.entries());
  const data = {
    name: formObject.name,
    address: formObject.address,
    phone: formObject.phone,
    email: formObject.email,
    room: formObject.room,
    date: formObject.date,
    days: formObject.days,
    purpose: formObject.purpose,
    time: formObject.time,
    kitchen: Boolean(formObject.kitchen),
    eventType: formObject.eventType,
    total: calculatePrice(),
  };

  if (!document.getElementById("acceptRules").checked) {
    alert("Bitte bestätigen Sie, dass Sie die Satzung gelesen und verstanden haben.");
    return;
  }

  renderApplication(data);
  window.scrollTo({ top: document.querySelector(".download-section").offsetTop, behavior: "smooth" });
}

bookingForm.addEventListener("submit", handleSubmit);

roomSelect.addEventListener("change", () => {
  if (roomSelect.value === "Sitzungsraum") {
    kitchenToggle.checked = false;
    kitchenToggle.disabled = true;
  } else {
    kitchenToggle.disabled = false;
  }
  updateSummary();
});

kitchenToggle.addEventListener("change", updateSummary);
daysSelect.addEventListener("change", updateSummary);
eventTypeSelect.addEventListener("change", updateSummary);
dateInput.addEventListener("change", updateSelectedDateFromInput);
document.getElementById("prevMonth").addEventListener("click", () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

kitchenToggle.disabled = roomSelect.value !== "Großer Raum";
renderCalendar();
updateSummary();
