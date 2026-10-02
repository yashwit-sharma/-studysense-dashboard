
"use strict";

const periodData = {
  week: {
    studyHours: "2.8",
    averageScore: "82",
    studySessions: "18",
    completionRate: "94",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    scores: [68, 72, 70, 79, 76, 84, 82],
  },
  month: {
    studyHours: "3.1",
    averageScore: "84",
    studySessions: "68",
    completionRate: "91",
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    scores: [72, 76, 80, 84],
  },
  semester: {
    studyHours: "2.6",
    averageScore: "79",
    studySessions: "214",
    completionRate: "88",
    labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    scores: [64, 69, 67, 75, 73, 79],
  },
};

const chartElement = document.querySelector("#line-chart");
const periodSelect = document.querySelector("#period-select");
const entryPage = document.querySelector("#entry-page");
const appShell = document.querySelector("#app-shell");
const entryForm = document.querySelector("#entry-form");
const entryError = document.querySelector("#entry-error");
const profileStorageKey = "studysense-profile";

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.querySelector("#greeting").textContent = greeting;
}

function showDashboard(profile) {
  document.querySelector("#user-name").textContent = profile.name;
  document.querySelector("#profile-name").textContent = profile.name;
  document.querySelector("#profile-avatar").textContent = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  updateGreeting();
  entryPage.hidden = true;
  appShell.hidden = false;
}

function showEntryError(message) {
  entryError.textContent = message;
  entryError.hidden = false;
}

try {
  const savedProfile = sessionStorage.getItem(profileStorageKey);
  if (savedProfile) {
    const profile = JSON.parse(savedProfile);
    if (typeof profile.name !== "string" || !profile.name.trim()) {
      throw new Error("Saved profile has no valid name.");
    }
    showDashboard(profile);
  }
} catch {
  showEntryError("Your profile could not be loaded from this browser session. Please enter your details again.");
}

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!entryForm.reportValidity()) {
    return;
  }

  const formData = new FormData(entryForm);
  const profile = {
    name: formData.get("name").trim(),
    phone: formData.get("phone").trim(),
    email: formData.get("email").trim(),
  };
  const phoneDigits = profile.phone.replace(/\D/g, "");

  if (!profile.name) {
    showEntryError("Please enter your name.");
    document.querySelector("#student-name").focus();
    return;
  }

  if (!/^[0-9+()\s-]{7,20}$/.test(profile.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    showEntryError("Enter a valid phone number with 7 to 15 digits.");
    document.querySelector("#student-phone").focus();
    return;
  }

  try {
    sessionStorage.setItem(profileStorageKey, JSON.stringify(profile));
  } catch {
    showEntryError("Your browser couldn't save this session. Please enable session storage and try again.");
    return;
  }

  entryError.hidden = true;
  showDashboard(profile);
});

entryForm.addEventListener("input", () => {
  entryError.hidden = true;
});

function createChart(labels, scores) {
  const width = 600;
  const height = 171;
  const left = 34;
  const right = 12;
  const top = 13;
  const bottom = 26;
  const minimum = 50;
  const maximum = 100;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const yFor = (value) => top + ((maximum - value) / (maximum - minimum)) * chartHeight;
  const xFor = (index) => left + (index / Math.max(scores.length - 1, 1)) * chartWidth;
  const points = scores.map((score, index) => `${xFor(index)},${yFor(score)}`);
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point}`).join(" ");
  const areaPath = `${linePath} L ${xFor(scores.length - 1)},${top + chartHeight} L ${left},${top + chartHeight} Z`;
  const gridValues = [50, 60, 70, 80, 90, 100];
  const grid = gridValues
    .map((value) => {
      const y = yFor(value);
      return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text class="chart-axis-label" x="${left - 9}" y="${y + 3}" text-anchor="end">${value}</text>`;
    })
    .join("");
  const xLabels = labels
    .map((label, index) => `<text class="chart-axis-label" x="${xFor(index)}" y="${height - 5}" text-anchor="middle">${label}</text>`)
    .join("");
  const markers = scores
    .map((score, index) => `<circle class="chart-point" style="--point-index: ${index}" cx="${xFor(index)}" cy="${yFor(score)}" r="3.5"><title>${labels[index]}: ${score} out of 100</title></circle>`)
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#978bea" stop-opacity=".23"></stop><stop offset="100%" stop-color="#978bea" stop-opacity="0"></stop></linearGradient></defs>
    ${grid}<path class="chart-area" d="${areaPath}"></path><path class="chart-line" pathLength="1" d="${linePath}"></path>${markers}${xLabels}
  </svg>`;
}

function updateDashboard(period) {
  const data = periodData[period];
  if (!data || !chartElement) {
    return;
  }

  document.querySelector("#study-hours").textContent = data.studyHours;
  document.querySelector("#average-score").textContent = data.averageScore;
  document.querySelector("#study-sessions").textContent = data.studySessions;
  document.querySelector("#completion-rate").textContent = data.completionRate;
  chartElement.innerHTML = createChart(data.labels, data.scores);
  chartElement.setAttribute(
    "aria-label",
    `Average assessment scores over ${period === "week" ? "the last 7 days" : period === "month" ? "the last 30 days" : "this semester"}: ${data.scores.join(", ")} out of 100.`
  );
}

periodSelect.addEventListener("change", (event) => {
  updateDashboard(event.currentTarget.value);
});

document.querySelector("#export-button").addEventListener("click", () => {
  const rows = [
    ["period", "study_hours_per_day", "average_score", "study_sessions", "tasks_completed_percent"],
    ...Object.entries(periodData).map(([period, data]) => [
      period,
      data.studyHours,
      data.averageScore,
      data.studySessions,
      data.completionRate,
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studysense-sample-data.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

updateDashboard(periodSelect.value);
