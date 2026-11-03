const state = {
  destination: "Moon",
  crew: 3,
  day: 1,
  score: 100,
  resources: { oxygen: 85, water: 80, food: 75, energy: 90, shield: 70, health: 95 },
  ended: false
};

const resourceNames = {
  oxygen: "Oxygen", water: "Water", food: "Food",
  energy: "Energy", shield: "Radiation shield", health: "Crew health"
};
const learning = {
  recycle: "Water recycling is essential because transporting water from Earth is expensive. Space habitats can recover water from wastewater and condensation, reducing the need for new supplies.",
  grow: "Plants can provide food and help support life-support systems. A greenhouse also needs light, water, nutrients and energy, so crop production involves trade-offs.",
  solar: "Solar panels convert sunlight into electrical energy. Dust can reduce the light reaching the panels, so keeping them clean helps maintain power generation.",
  shield: "Space radiation can harm astronauts. A protected shelter and suitable shielding materials help reduce exposure during solar events.",
  rest: "Crew wellbeing matters. Rest, good nutrition and a healthy habitat help astronauts stay effective during long missions."
};
const eventPool = [
  { title: "Dust accumulation", text: "Dust has reduced solar panel performance. Consider cleaning the panels.", type: "dust" },
  { title: "Water system check", text: "The recycling system needs attention. Water conservation is important.", type: "water" },
  { title: "Solar weather alert", text: "A solar activity warning has been received. Review radiation protection.", type: "storm" },
  { title: "Greenhouse update", text: "The greenhouse is ready for another crop cycle. Food production needs resources.", type: "crop" },
  { title: "Equipment inspection", text: "Routine maintenance helps keep the outpost reliable.", type: "maintenance" }
];

const $ = (id) => document.getElementById(id);
let selectedAction = false;
let pendingEmergency = null;
const scienceFacts = [
  "Space habitats need carefully planned life-support systems because resupply missions are limited and costly.",
  "The Moon has almost no atmosphere, so habitats need to provide pressure and breathing air.",
  "Mars has a thin atmosphere that is not breathable by humans; astronauts would need a pressurized habitat.",
  "Solar panels turn sunlight into electricity, but available power depends on location, lighting and equipment condition.",
  "Growing plants in space requires managing light, water, nutrients, temperature and energy together.",
  "Radiation protection is an important design consideration for missions beyond Earth's protective magnetic environment."
];
let factIndex = 0;

document.querySelectorAll(".destination").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".destination").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    state.destination = button.dataset.destination;
  });
});

$("startMission").addEventListener("click", startMission);
$("newMission").addEventListener("click", () => {
  if (confirm("Start a new mission? Your current progress will be lost.")) resetToWelcome();
});
$("resetMission").addEventListener("click", () => {
  if (confirm("Reset this mission and return to the welcome screen?")) resetToWelcome();
});
$("nextDay").addEventListener("click", advanceDay);
$("playAgain").addEventListener("click", resetToWelcome);
$("nextFact").addEventListener("click", () => {
  factIndex = (factIndex + 1) % scienceFacts.length;
  $("scienceFact").textContent = scienceFacts[factIndex];
});
$("emergencyModalChoices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-response]");
  if (button && pendingEmergency) respondToEmergency(Number(button.dataset.response));
});

document.querySelectorAll(".action-btn").forEach(button => {
  button.addEventListener("click", () => performAction(button.dataset.action));
});

function startMission() {
  state.crew = Number($("crewSize").value);
  state.day = 1;
  state.score = 100;
  state.ended = false;
  state.resources = { oxygen: 85, water: 80, food: 75, energy: 90, shield: 70, health: 95 };
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("destinationName").textContent = state.destination.toUpperCase();
  $("scoreDestination").textContent = state.destination.toUpperCase();
  $("crewLabel").textContent = String(state.crew).padStart(2, "0");
  $("missionTitle").textContent = state.destination === "Moon" ? "Lunar research outpost" : "Martian research outpost";
  $("missionSubtitle").textContent = state.destination === "Moon"
    ? "Operate a lunar base while managing limited supplies."
    : "Operate a remote Mars habitat with carefully managed supplies.";
  $("planetScene").classList.toggle("mars-scene", state.destination === "Mars");
  $("sceneCaption").textContent = `${state.destination.toUpperCase()} OUTPOST · SYSTEMS ONLINE`;
  $("scienceFact").textContent = scienceFacts[0];
  factIndex = 0;
  $("eventBox").innerHTML = '<span class="event-badge">● SYSTEM READY</span><p>Your outpost is online. Review the resources and choose your first operation.</p>';
  $("logList").innerHTML = "";
  addLog("Mission systems initialized.");
  updateDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function performAction(action) {
  if (state.ended) return;
  const r = state.resources;
  let message = "";
  let success = true;

  if (action === "recycle") {
    if (r.energy < 10) success = false;
    else { r.energy -= 10; r.water = clamp(r.water + 18); message = "Water recycling completed: water increased by 18 points."; }
  } else if (action === "grow") {
    if (r.water < 12 || r.energy < 8) success = false;
    else { r.water -= 12; r.energy -= 8; r.food = clamp(r.food + 20); message = "Greenhouse cycle completed: food increased by 20 points."; }
  } else if (action === "solar") {
    if (r.energy < 5) success = false;
    else { r.energy = clamp(r.energy - 5 + 22); message = "Solar panels cleaned: simulated power availability improved by 17 points."; }
  } else if (action === "shield") {
    if (r.energy < 15) success = false;
    else { r.energy -= 15; r.shield = clamp(r.shield + 18); message = "Shelter improvements completed: radiation protection increased."; }
  } else if (action === "rest") {
    if (r.food < 5) success = false;
    else { r.food -= 5; r.health = clamp(r.health + 10); message = "Crew rest period completed: crew health improved."; }
  }

  if (!success) {
    showEvent("ACTION NOT AVAILABLE", "Not enough resources for this operation. Try another action or end the day carefully.", "warning");
    return;
  }
  state.score = clamp(state.score + 2);
  $("learningText").textContent = learning[action];
  showEvent("OPERATION COMPLETE", message, "success");
  addLog(message);
  updateDashboard();
}

function advanceDay() {
  if (state.ended) return;
  const r = state.resources;
  const crewUse = state.crew;
  // Simplified educational simulation: daily use is scaled by crew size.
  r.oxygen = clamp(r.oxygen - (2 + crewUse * 1.2));
  r.water = clamp(r.water - (2 + crewUse * 1.5));
  r.food = clamp(r.food - (2 + crewUse * 1.4));
  r.energy = clamp(r.energy - (3 + crewUse * 0.8));
  r.health = clamp(r.health - (r.oxygen < 25 || r.water < 20 || r.food < 20 ? 12 : 1));

  state.day += 1;
  const event = eventPool[Math.floor(Math.random() * eventPool.length)];
  state.score = calculateScore();
  addLog(`Day ${String(state.day).padStart(2, "0")} began. Daily resource use recorded.`);
  updateDashboard();

  if (state.day >= 15) {
    finishMission(true);
    return;
  }
  if (r.health <= 0 || r.oxygen <= 0 || r.water <= 0 || r.food <= 0) {
    finishMission(false);
    return;
  }
  openEmergency(event);
}

function openEmergency(event) {
  pendingEmergency = event;
  const choices = {
    dust: [
      { title: "Clean the panels", detail: "Spend 6 energy to recover power.", effect: { energy: -6, score: 4 }, lesson: "Dust can reduce the sunlight reaching solar panels. Maintenance can improve power collection but takes time and resources." },
      { title: "Switch to power-saving mode", detail: "Save energy, but reduce normal operations.", effect: { energy: 5, food: -2, score: 2 }, lesson: "Reducing non-essential electricity use can preserve power during a shortage, but some activities may need to be limited." }
    ],
    water: [
      { title: "Run water recycling", detail: "Use 10 energy to recover water.", effect: { energy: -10, water: 18, score: 4 }, lesson: "Water recovery reduces the amount of fresh water a crew must bring or receive from Earth." },
      { title: "Introduce strict water rationing", detail: "Save water, with a small crew-health trade-off.", effect: { water: 8, health: -3, score: 1 }, lesson: "Rationing can extend supplies, but conservation should be balanced with crew health and hygiene needs." }
    ],
    storm: [
      { title: "Move crew to the shelter", detail: "Use 8 energy to protect the crew.", effect: { energy: -8, health: 5, score: 5 }, lesson: "A designated shelter with suitable shielding can reduce crew exposure during a radiation event." },
      { title: "Improve shielding", detail: "Use 15 energy to strengthen protection.", effect: { energy: -15, shield: 15, score: 4 }, lesson: "Radiation protection must be considered in habitat design. This game uses a simplified shield score." }
    ],
    crop: [
      { title: "Start a greenhouse cycle", detail: "Use 12 water and 8 energy to gain food.", effect: { water: -12, energy: -8, food: 20, score: 4 }, lesson: "Growing food can improve mission resilience, but crops need water, energy, nutrients and suitable growing conditions." },
      { title: "Use stored food", detail: "Preserve water and energy, but food stores decrease.", effect: { food: -3, health: 2, score: 1 }, lesson: "Stored food provides a buffer when crops are not ready, so a mission needs a balance between reserves and production." }
    ],
    maintenance: [
      { title: "Run a full system check", detail: "Use 8 energy to reduce future risk.", effect: { energy: -8, score: 5, shield: 3 }, lesson: "Preventive maintenance can identify problems early and improve reliability, but it consumes crew time and resources." },
      { title: "Postpone maintenance", detail: "Save energy now, with a small readiness penalty.", effect: { score: -4, health: -2 }, lesson: "Postponing maintenance may save resources in the short term but can increase risk later." }
    ]
  };
  const options = choices[event.type] || choices.maintenance;
  $("emergencyModalTitle").textContent = event.title;
  $("emergencyModalDescription").textContent = event.text + " Choose a response to continue.";
  $("emergencyModalChoices").innerHTML = options.map((option, index) =>
    `<button class="emergency-choice" type="button" data-response="${index}"><b>${escapeHTML(option.title)}</b><small>${escapeHTML(option.detail)}</small></button>`
  ).join("");
  // Keep the choices visible even if another stylesheet overrides their layout.
  $("emergencyModalChoices").style.display = "grid";
  $("emergencyModalChoices").style.gridTemplateColumns = "1fr";
  $("emergencyModal").classList.remove("hidden");
}

function respondToEmergency(index) {
  const event = pendingEmergency;
  if (!event) return;
  const choices = {
    dust: [
      { effect: { energy: -6, score: 4 }, lesson: "Dust can reduce the sunlight reaching solar panels. Maintenance can improve power collection but takes time and resources." },
      { effect: { energy: 5, food: -2, score: 2 }, lesson: "Reducing non-essential electricity use can preserve power during a shortage, but some activities may need to be limited." }
    ],
    water: [
      { effect: { energy: -10, water: 18, score: 4 }, lesson: "Water recovery reduces the amount of fresh water a crew must bring or receive from Earth." },
      { effect: { water: 8, health: -3, score: 1 }, lesson: "Rationing can extend supplies, but conservation should be balanced with crew health and hygiene needs." }
    ],
    storm: [
      { effect: { energy: -8, health: 5, score: 5 }, lesson: "A designated shelter with suitable shielding can reduce crew exposure during a radiation event." },
      { effect: { energy: -15, shield: 15, score: 4 }, lesson: "Radiation protection must be considered in habitat design. This game uses a simplified shield score." }
    ],
    crop: [
      { effect: { water: -12, energy: -8, food: 20, score: 4 }, lesson: "Growing food can improve mission resilience, but crops need water, energy, nutrients and suitable growing conditions." },
      { effect: { food: -3, health: 2, score: 1 }, lesson: "Stored food provides a buffer when crops are not ready, so a mission needs a balance between reserves and production." }
    ],
    maintenance: [
      { effect: { energy: -8, score: 5, shield: 3 }, lesson: "Preventive maintenance can identify problems early and improve reliability, but it consumes crew time and resources." },
      { effect: { score: -4, health: -2 }, lesson: "Postponing maintenance may save resources in the short term but can increase risk later." }
    ]
  };
  const option = (choices[event.type] || choices.maintenance)[index];
  Object.entries(option.effect).forEach(([key, amount]) => {
    if (key === "score") state.score = clamp(state.score + amount);
    else state.resources[key] = clamp(state.resources[key] + amount);
  });
  $("learningText").textContent = option.lesson;
  $("emergencyModal").classList.add("hidden");
  addLog(`Response selected: ${event.title}.`);
  showEvent("RESPONSE RECORDED", "Your decision has been applied. Check the updated resource levels before your next operation.", "success");
  pendingEmergency = null;
  state.score = calculateScore();
  updateDashboard();
  if (state.resources.health <= 0 || state.resources.oxygen <= 0 || state.resources.water <= 0 || state.resources.food <= 0) finishMission(false);
}

function applyEvent(event) {
  const r = state.resources;
  if (event.type === "dust") r.energy = clamp(r.energy - 7);
  if (event.type === "water") r.water = clamp(r.water - 5);
  if (event.type === "storm") {
    r.shield = clamp(r.shield - 8);
    if (r.shield < 30) r.health = clamp(r.health - 5);
  }
  if (event.type === "crop") r.food = clamp(r.food + 3);
  if (event.type === "maintenance") r.energy = clamp(r.energy - 3);
}

function calculateScore() {
  const values = Object.values(state.resources);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(clamp(average));
}

function updateDashboard() {
  Object.entries(state.resources).forEach(([key, value]) => {
    $(key + "Value").textContent = Math.round(value);
    $(key + "Bar").style.width = value + "%";
    const status = $(key + "Status");
    status.textContent = value < 25 ? "CRITICAL" : value < 50 ? "LOW" : "STABLE";
    status.className = "resource-status" + (value < 25 ? " critical" : value < 50 ? " warning" : "");
  });
  $("dayNumber").textContent = String(state.day).padStart(2, "0");
  $("scoreValue").textContent = state.score;
  $("scoreBar").style.width = state.score + "%";
}

function showEvent(title, message, type) {
  const color = type === "success" ? "● OPERATION LOG" : type === "warning" ? "● ATTENTION" : "● SYSTEM MESSAGE";
  $("eventBox").innerHTML = `<span class="event-badge">${color}</span><p><b>${escapeHTML(title)}</b><br>${escapeHTML(message)}</p>`;
}

function addLog(message) {
  const item = document.createElement("p");
  item.innerHTML = `<time>DAY ${String(state.day).padStart(2, "0")}</time> ${escapeHTML(message)}`;
  $("logList").prepend(item);
}

function finishMission(success) {
  state.ended = true;
  $("modalTitle").textContent = success ? "Mission completed!" : "Mission ended";
  $("modalText").textContent = success
    ? "Your crew completed the 14-day training mission. Review your score and think about which decisions helped the outpost succeed."
    : "A critical resource ran out before the mission could be completed. Review your resource choices and try a new strategy.";
  $("reportDays").textContent = Math.min(state.day - 1, 14);
  $("reportScore").textContent = state.score;
  $("modal").classList.remove("hidden");
}

function resetToWelcome() {
  $("modal").classList.add("hidden");
  $("emergencyModal").classList.add("hidden");
  pendingEmergency = null;
  $("gameScreen").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clamp(value) { return Math.max(0, Math.min(100, value)); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}


// Emergency decision lab: outcomes are simplified for educational gameplay.
const emergencyScenarios = [
  {
    tag: "● SOLAR WEATHER ALERT",
    title: "Solar storm warning",
    description: "A solar activity warning has been detected. Your crew needs to reduce exposure.",
    choices: [
      ["shelter", "Move crew to shelter", "Safer choice · Uses time and supplies"],
      ["shield", "Improve shielding", "Uses energy to improve protection"],
      ["ignore", "Ignore the warning", "No immediate cost · Higher risk"]
    ]
  },
  {
    tag: "● LIFE-SUPPORT CHECK",
    title: "Water recycling fault",
    description: "The water recovery system is performing poorly. Fresh water is becoming limited.",
    choices: [
      ["repair", "Repair the recycler", "Uses energy · Improves water supply"],
      ["ration", "Start water rationing", "Preserves water · Crew comfort decreases"],
      ["ignorewater", "Ignore the fault", "No immediate cost · Water risk remains"]
    ]
  },
  {
    tag: "● POWER SYSTEM ALERT",
    title: "Power shortage",
    description: "Power generation has dropped. Some non-essential systems need to be paused.",
    choices: [
      ["savepower", "Enter power-saving mode", "Protects energy · Slows other work"],
      ["cleanpanels", "Clean solar panels", "Costs a little energy · Restores some power"],
      ["ignorepower", "Do nothing", "No immediate cost · Energy may become critical"]
    ]
  }
];
let emergencyIndex = 0;
let emergencyAnswered = false;

function renderEmergency() {
  const scenario = emergencyScenarios[emergencyIndex];
  $("emergencyTag").textContent = scenario.tag;
  $("emergencyTitle").textContent = scenario.title;
  $("emergencyDescription").textContent = scenario.description;
  $("emergencyFeedback").textContent = "Choose one response to run the scenario.";
  $("emergencyChoices").innerHTML = scenario.choices.map(choice =>
    `<button class="choice-btn" data-choice="${choice[0]}" type="button"><b>${choice[1]}</b><small>${choice[2]}</small></button>`
  ).join("");
  emergencyAnswered = false;
  $("emergencyChoices").querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => resolveEmergency(button.dataset.choice));
  });
}

function resolveEmergency(choice) {
  if (emergencyAnswered || state.ended) return;
  emergencyAnswered = true;
  const r = state.resources;
  let feedback = "";
  if (choice === "shelter") {
    r.health = clamp(r.health + 3); r.energy = clamp(r.energy - 5); r.shield = clamp(r.shield + 2);
    feedback = "Good risk-reduction choice. Moving to a protected shelter helps reduce exposure. Energy and time still matter.";
  } else if (choice === "shield") {
    if (r.energy >= 10) { r.energy = clamp(r.energy - 10); r.shield = clamp(r.shield + 15); feedback = "Shielding improved. You spent energy now to improve protection for the crew."; }
    else { r.health = clamp(r.health - 3); feedback = "There was not enough energy to improve shielding. Consider conserving resources before emergencies."; }
  } else if (choice === "ignore") {
    r.health = clamp(r.health - 12); r.score = clamp(r.score - 8);
    feedback = "Risky choice. Ignoring a warning can expose the crew to avoidable danger.";
  } else if (choice === "repair") {
    if (r.energy >= 8) { r.energy = clamp(r.energy - 8); r.water = clamp(r.water + 15); feedback = "The recycler is back online. Maintenance used energy, but recovered water."; }
    else { r.water = clamp(r.water - 5); feedback = "Insufficient energy delayed the repair. Water remains under pressure."; }
  } else if (choice === "ration") {
    r.water = clamp(r.water + 5); r.health = clamp(r.health - 2);
    feedback = "Rationing preserves some water, but long-term restrictions can affect crew wellbeing.";
  } else if (choice === "ignorewater") {
    r.water = clamp(r.water - 10); r.score = clamp(r.score - 7);
    feedback = "The fault remains unresolved and water availability drops. Early maintenance can prevent bigger problems.";
  } else if (choice === "savepower") {
    r.energy = clamp(r.energy + 10); r.food = clamp(r.food - 2);
    feedback = "Power-saving mode conserves electricity, but some activities are reduced.";
  } else if (choice === "cleanpanels") {
    r.energy = clamp(r.energy + 12);
    feedback = "Cleaning the panels improves simulated power availability. Dust management matters on planetary surfaces.";
  } else if (choice === "ignorepower") {
    r.energy = clamp(r.energy - 12); r.score = clamp(r.score - 7);
    feedback = "Power drops further. Ignoring system alerts may affect several outpost functions.";
  }
  state.score = calculateScore();
  $("emergencyFeedback").textContent = feedback;
  $("emergencyChoices").querySelectorAll("button").forEach(button => button.disabled = true);
  showEvent("DECISION LAB", feedback, "success");
  addLog("Emergency decision: " + $("emergencyTitle").textContent + ".");
  updateDashboard();
}

$("nextEmergency").addEventListener("click", () => {
  emergencyIndex = (emergencyIndex + 1) % emergencyScenarios.length;
  renderEmergency();
});
const originalStartMission = startMission;
startMission = function() {
  originalStartMission();
  const scenePlanet = $("scenePlanet");
  scenePlanet.classList.remove("moon", "mars");
  scenePlanet.classList.add(state.destination.toLowerCase());
  $("sceneDestination").textContent = state.destination === "Moon" ? "LUNAR SURFACE" : "MARTIAN SURFACE";
  $("sceneDescription").textContent = state.destination === "Moon"
    ? "Low gravity · Dusty terrain · Extreme temperature changes"
    : "Thin atmosphere · Dust storms · Long communication delays";
  emergencyIndex = 0;
  renderEmergency();
};
