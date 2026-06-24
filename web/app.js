const MODE_LABELS = [
  "ORIGINAL", "MASSA", "PONTOS", "LINHAS", "PARTÍCULAS", "GRID", "ECO",
  "PERLIN", "AREIA", "PELÚCIA", "CONTORNO", "NERVURAS", "EXPANDE",
  "ENCOLHE", "MALHA", "RASTRO", "ONDAS",
];
const BASE_MODES = [0, 12, 13];
const GENERATIVE_MODES = [1, 2, 4, 5, 6, 7, 8, 9, 11, 15, 16];
const DEFORMATION_LABELS = ["SUTIL", "PULSO", "EXPLODIR", "ONDULAR", "FATIAR", "CAMPO", "GLITCH"];
const PALETTES = [
  ["#efebe8", "#9e9b98"],
  ["#a63df2", "#3d9df2"],
  ["#ff2c2c", "#ffffff"],
  ["#ffe600", "#00e5ff"],
  ["#ff6b24", "#f1b52b"],
  ["#3d9df2", "#42d8c7"],
];

const defaults = {
  mode: 0,
  deformationMode: 0,
  frozen: false,
  enabled: true,
  background: "dark",
  pointCount: 2600,
  pointSize: 1.4,
  intensity: 1,
  deformation: 38,
  noise: 0.65,
  displacement: 34,
  stroke: 2.2,
  scale: 0.16,
  rotation: 0.04,
  fragmentation: 0.55,
  returnSpeed: 0.085,
  attack: 0.13,
  complexity: 0.65,
  opacity: 0.95,
  bass: 1,
  mid: 1,
  treble: 1,
  soundIntensity: 1.4,
  smoothing: 0.62,
  primary: "#a63df2",
  secondary: "#3d9df2",
  activeBrand: "eclode",
  activeSound: "visual",
};

const state = { ...defaults };
const canvas = document.querySelector("#mutationCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".stage");
const meter = document.querySelector("#audioMeter");
const meterCtx = meter.getContext("2d");
const sourceCanvas = document.createElement("canvas");
const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
let sourceImage = new Image();
let sourcePoints = [];
let sourceEdgePoints = [];
let sourceFillPoints = [];
let particles = [];
let time = 0;
let energy = 0;
let bass = 0;
let mid = 0;
let treble = 0;
let lastFrame = performance.now();
let audioContext = null;
let analyser = null;
let audioData = null;
let masterGain = null;
let synthNodes = [];
let synthTimer = null;
let sampleAudio = null;
let sampleSourceNode = null;
let micStream = null;
let toastTimer = null;

const sliderGroups = {
  pointSliders: [
    ["pointCount", "Quantidade", 150, 7200, 50],
    ["pointSize", "Grossura", 0.5, 4, 0.1],
  ],
  shapeSliders: [
    ["deformation", "Deformação", 0, 160, 1],
    ["scale", "Escala", 0, 0.55, 0.01],
    ["stroke", "Traço", 0.4, 12, 0.1],
  ],
  motionSliders: [
    ["rotation", "Rotação", -0.35, 0.35, 0.01],
    ["displacement", "Deslocamento", 0, 150, 1],
    ["attack", "Ataque", 0.02, 0.32, 0.005],
    ["returnSpeed", "Retorno", 0.01, 0.22, 0.005],
  ],
  textureSliders: [
    ["noise", "Ruído", 0.05, 2, 0.01],
    ["fragmentation", "Fragmentação", 0, 1, 0.01],
    ["complexity", "Complexidade", 0.1, 1, 0.01],
    ["opacity", "Opacidade", 0.1, 1, 0.01],
  ],
};

const brandApps = {
  eclode: {
    label: "Eclode",
    source: "../data/eclode_header_logo.svg",
    fileName: "Aplicação Eclode",
    colors: ["#a63df2", "#3d9df2"],
    background: "dark",
    preset: { mode: 12, deformationMode: 1, pointCount: 3600, pointSize: 1.25, stroke: 2.3, deformation: 42, complexity: 0.82, noise: 0.5, intensity: 1.25 },
  },
  cocacola: {
    label: "Coca‑Cola",
    source: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360">
      <rect width="900" height="360" rx="62" fill="#e31b23"/>
      <path d="M112 221c38-106 162-129 198-57 19 39-14 84-56 71-36-11-34-67 10-66 22 0 29 14 29 14-13-44-94-43-121 25-20 50 9 96 70 99 66 3 112-48 132-96 22-54 46-92 92-97 38-4 71 19 79 51 18-39 53-62 94-62 57 0 91 43 72 89-20 47-90 49-108 8-10-24 7-52 34-54 19-1 31 11 31 11-12-34-68-27-92 25-20 42-5 85 43 90 64 7 112-42 145-94" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round"/>
      <text x="450" y="214" text-anchor="middle" fill="#fff" font-family="Georgia, serif" font-size="112" font-style="italic" font-weight="700">Cola</text>
      <path d="M96 278c178 36 332 34 470 5 92-19 171-21 245 10" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" opacity=".92"/>
    </svg>`),
    fileName: "Aplicação Coca‑Cola",
    colors: ["#ff2c2c", "#ffffff"],
    background: "light",
    preset: { mode: 15, deformationMode: 3, pointCount: 5200, pointSize: 1.05, stroke: 2.1, deformation: 58, complexity: 1, noise: 0.38, intensity: 1.15, rotation: 0.02, opacity: 0.92 },
  },
  mtv: {
    label: "MTV",
    source: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 500">
      <rect width="700" height="500" fill="#111"/>
      <path d="M94 91h235l42 182L416 91h189v242h-80V174l-75 159h-91l-67-160v160h-76V167h-36v166H94z" fill="#ffe600"/>
      <path d="M400 91h205v75h-69v167h-83V166h-53z" fill="#00e5ff"/>
      <text x="205" y="419" fill="#ff2bd6" font-family="Arial Black, Impact, sans-serif" font-size="110" transform="skewX(-12)">TV</text>
      <path d="M72 383c83-34 165-31 248 9s172 42 278-16" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/>
    </svg>`),
    fileName: "Aplicação MTV",
    colors: ["#ffe600", "#00e5ff"],
    background: "dark",
    preset: { mode: 5, deformationMode: 6, pointCount: 4400, pointSize: 1.55, stroke: 2.8, deformation: 84, displacement: 96, complexity: 0.78, noise: 1.25, intensity: 1.45, rotation: -0.08, fragmentation: 0.75 },
  },
};

Object.assign(brandApps.cocacola, {
  label: "Coca‑Cola",
  source: "./brands/coca-cola.svg",
  fileName: "coca cola.svg",
  colors: ["#ff2c2c", "#ffffff"],
  background: "dark",
  preset: { mode: 12, deformationMode: 3, pointCount: 5200, pointSize: 1.05, stroke: 2.1, deformation: 58, complexity: 1, noise: 0.38, intensity: 1.15, rotation: 0.02, opacity: 0.92 },
});

Object.assign(brandApps.mtv, {
  label: "MTV",
  source: "./brands/mtv.svg?v=2",
  fileName: "mtv.svg",
  colors: ["#ffe600", "#00e5ff"],
  background: "dark",
  preset: { mode: 12, deformationMode: 6, pointCount: 2800, pointSize: 1.35, stroke: 2.2, deformation: 58, displacement: 68, complexity: 0.72, noise: 0.9, intensity: 1.2, rotation: -0.04, fragmentation: 0.62 },
});

brandApps.hexa2026 = {
  label: "Hexa 2026",
  source: "./brands/hexa-2026.svg",
  fileName: "hexa2026.svg",
  colors: ["#00a859", "#ffdf00"],
  background: "dark",
  preset: { mode: 12, deformationMode: 5, pointCount: 5200, pointSize: 1.2, stroke: 2.4, deformation: 66, displacement: 72, complexity: 0.9, noise: 0.85, intensity: 1.35, rotation: 0.035, fragmentation: 0.62 },
};

function svgData(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

function makeButtons(containerId, entries, selectedKey, onClick) {
  const root = document.getElementById(containerId);
  root.innerHTML = "";
  entries.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = `button${state[selectedKey] === value ? " active" : ""}`;
    button.textContent = label;
    button.dataset.value = value;
    button.addEventListener("click", () => onClick(value));
    root.append(button);
  });
}

function makeBrandApps() {
  const root = document.querySelector("#brandApps");
  root.innerHTML = "";
  Object.entries(brandApps).forEach(([key, app]) => {
    const button = document.createElement("button");
    button.className = `brand-card${state.activeBrand === key ? " active" : ""}`;
    button.dataset.brand = key;
    button.innerHTML = `<span class="brand-logo">${app.label}</span><small>Clique para testar · ${app.fileName}</small>`;
    button.style.setProperty("--brand-a", app.colors[0]);
    button.style.setProperty("--brand-b", app.colors[1]);
    button.addEventListener("click", () => applyBrandApp(key));
    root.append(button);
  });
}

function refreshButtons() {
  makeButtons("baseModes", BASE_MODES.map((i) => [i, MODE_LABELS[i]]), "mode", selectMode);
  makeButtons("generativeModes", GENERATIVE_MODES.map((i) => [i, MODE_LABELS[i]]), "mode", selectMode);
  makeButtons("deformationModes", DEFORMATION_LABELS.map((label, i) => [i, label]), "deformationMode", selectDeformation);
  makeBrandApps();
  document.querySelectorAll(".bg-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.bg === state.background);
  });
  document.querySelectorAll(".sound-pad").forEach((button) => {
    button.classList.toggle("active", button.dataset.sound === state.activeSound);
  });
  document.querySelector("#freeze").classList.toggle("active", state.frozen);
  document.querySelector("#freeze").textContent = state.frozen ? "CONGELADO" : "CONGELAR";
  document.querySelector("#systemToggle").classList.toggle("active", state.enabled);
  document.querySelector("#systemToggle").textContent = state.enabled ? "SISTEMA LIGADO" : "SISTEMA DESLIGADO";
  document.querySelector("#hudMode").textContent = `${MODE_LABELS[state.mode]} · ${DEFORMATION_LABELS[state.deformationMode]}`;
  syncSoundIntensity();
}

function makeSliders() {
  Object.entries(sliderGroups).forEach(([containerId, definitions]) => {
    const root = document.getElementById(containerId);
    root.innerHTML = "";
    definitions.forEach(([key, label, min, max, step]) => {
      const wrapper = document.createElement("div");
      wrapper.className = "slider-control";
      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      const output = document.createElement("output");
      output.dataset.output = key;
      const input = document.createElement("input");
      input.type = "range";
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = state[key];
      input.dataset.key = key;
      input.addEventListener("input", () => {
        state[key] = Number(input.value);
        output.value = formatValue(state[key]);
      });
      wrapper.append(labelEl, output, input);
      root.append(wrapper);
    });
  });
  syncControls();
}

function formatValue(value) {
  if (Number.isInteger(value) || Math.abs(value) >= 100) return value.toFixed(0);
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(2);
}

function syncControls() {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    input.value = state[input.dataset.key];
    document.querySelector(`[data-output="${input.dataset.key}"]`).value = formatValue(state[input.dataset.key]);
  });
  document.querySelector("#primaryColor").value = state.primary;
  document.querySelector("#secondaryColor").value = state.secondary;
  syncSoundIntensity();
  refreshButtons();
}

function syncSoundIntensity() {
  const output = document.querySelector("#soundIntensityValue");
  if (output) output.value = `${Math.round(state.soundIntensity * 100)}%`;
  if (masterGain) {
    const now = audioContext?.currentTime || 0;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(0.32 * state.soundIntensity, now, 0.04);
  }
  if (sampleAudio) sampleAudio.volume = Math.min(1, 0.9 * state.soundIntensity);
}

function changeSoundIntensity(delta) {
  state.soundIntensity = Math.max(0.2, Math.min(2.4, Number((state.soundIntensity + delta).toFixed(2))));
  syncSoundIntensity();
  showToast(`Intensidade do som: ${Math.round(state.soundIntensity * 100)}%`);
}

function selectMode(mode) {
  state.mode = mode;
  resetParticles();
  refreshButtons();
}

function selectDeformation(mode) {
  state.deformationMode = mode;
  refreshButtons();
}

async function applyBrandApp(key) {
  const app = brandApps[key];
  if (!app) return;
  Object.assign(state, app.preset, {
    primary: app.colors[0],
    secondary: app.colors[1],
    background: app.background,
    activeBrand: key,
  });
  syncControls();
  await setSource(app.source, app.fileName);
  showToast(`${app.label} aplicado nas camadas`);
}

function randomize() {
  const activeModes = [...BASE_MODES, ...GENERATIVE_MODES];
  state.mode = activeModes[Math.floor(Math.random() * activeModes.length)];
  state.deformationMode = Math.floor(Math.random() * DEFORMATION_LABELS.length);
  state.intensity = random(0.55, 1.9);
  state.deformation = random(8, 112);
  state.noise = random(0.12, 1.35);
  state.displacement = random(6, 96);
  state.stroke = random(0.8, 7);
  state.scale = random(0.02, 0.34);
  state.rotation = random(-0.18, 0.18);
  state.fragmentation = random(0.15, 1);
  state.complexity = random(0.25, 1);
  state.opacity = random(0.45, 1);
  applyPalette(Math.floor(Math.random() * PALETTES.length), false);
  syncControls();
  resetParticles();
  showToast("Novo DNA de mutação");
}

function reset() {
  Object.assign(state, defaults);
  syncControls();
  applyBrandApp("eclode");
  showToast("Identidade restaurada");
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function applyPalette(index, announce = true) {
  [state.primary, state.secondary] = PALETTES[index];
  document.querySelectorAll(".swatch").forEach((swatch) => {
    swatch.classList.toggle("active", Number(swatch.dataset.palette) === index);
  });
  syncControls();
  if (announce) showToast("Paleta atualizada");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 1600);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

async function setSource(src, name) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      sourceImage = image;
      document.querySelector("#brandName").textContent = name;
      sampleSource();
      resetParticles();
      resolve(true);
    };
    image.onerror = () => {
      showToast("Não foi possível abrir essa imagem");
      resolve(false);
    };
    image.src = src;
  });
}

function sampleSource() {
  const size = 520;
  sourceCanvas.width = size;
  sourceCanvas.height = size;
  sourceCtx.clearRect(0, 0, size, size);
  const scale = Math.min((size * 0.8) / sourceImage.naturalWidth, (size * 0.8) / sourceImage.naturalHeight);
  const w = sourceImage.naturalWidth * scale;
  const h = sourceImage.naturalHeight * scale;
  sourceCtx.drawImage(sourceImage, (size - w) / 2, (size - h) / 2, w, h);
  const pixels = sourceCtx.getImageData(0, 0, size, size).data;
  let minX = size;
  let minY = size;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      if (pixels[index + 3] > 28) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const bgColor = estimateBackgroundColor(pixels, size, minX, minY, maxX, maxY);
  let inkMinX = size;
  let inkMinY = size;
  let inkMaxX = 0;
  let inkMaxY = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const index = (y * size + x) * 4;
      if (isInkPixel(pixels, index, bgColor)) {
        inkMinX = Math.min(inkMinX, x);
        inkMinY = Math.min(inkMinY, y);
        inkMaxX = Math.max(inkMaxX, x);
        inkMaxY = Math.max(inkMaxY, y);
      }
    }
  }
  if (inkMaxX > inkMinX && inkMaxY > inkMinY) {
    minX = inkMinX;
    minY = inkMinY;
    maxX = inkMaxX;
    maxY = inkMaxY;
  }
  const boundsW = Math.max(1, maxX - minX);
  const boundsH = Math.max(1, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const normalizeScale = 410 / Math.max(boundsW, boundsH);
  const points = [];
  const step = 3;
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const index = (y * size + x) * 4;
      if (isInkPixel(pixels, index, bgColor)) {
        const edge = isEdgePixel(pixels, size, x, y, bgColor);
        const luma = (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255;
        points.push({
          x: (x - centerX) * normalizeScale,
          y: (y - centerY) * normalizeScale,
          edge,
          luma,
          alpha: pixels[index + 3] / 255,
          seed: Math.random() * 1000,
        });
      }
    }
  }
  sourcePoints = (points.length ? points : fallbackPoints()).sort((a, b) => {
    if (a.edge !== b.edge) return a.edge ? -1 : 1;
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
  });
  sourceEdgePoints = sourcePoints.filter((point) => point.edge);
  sourceFillPoints = sourcePoints.filter((point) => !point.edge);
}

function estimateBackgroundColor(pixels, size, minX, minY, maxX, maxY) {
  if (maxX <= minX || maxY <= minY) {
    return { r: 0, g: 0, b: 0, a: 0, n: 1 };
  }
  const samples = [
    (minY * size + minX) * 4,
    (minY * size + maxX) * 4,
    (maxY * size + minX) * 4,
    (maxY * size + maxX) * 4,
    (Math.floor((minY + maxY) / 2) * size + minX) * 4,
    (Math.floor((minY + maxY) / 2) * size + maxX) * 4,
  ];
  const opaque = samples.filter((index) => pixels[index + 3] > 20);
  const source = opaque.length ? opaque : samples;
  return source.reduce((acc, index) => {
    acc.r += pixels[index];
    acc.g += pixels[index + 1];
    acc.b += pixels[index + 2];
    acc.a += pixels[index + 3];
    return acc;
  }, { r: 0, g: 0, b: 0, a: 0, n: source.length });
}

function isInkPixel(pixels, index, bg) {
  const alpha = pixels[index + 3];
  if (alpha <= 28) return false;
  const luma = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
  if (alpha > 80 && luma < 246) return true;
  if (bg.a / bg.n < 28) return alpha > 80;
  const br = bg.r / bg.n;
  const bgc = bg.g / bg.n;
  const bb = bg.b / bg.n;
  const dr = pixels[index] - br;
  const dg = pixels[index + 1] - bgc;
  const db = pixels[index + 2] - bb;
  return Math.hypot(dr, dg, db) > 42;
}

function isEdgePixel(pixels, size, x, y, bg) {
  const radius = 3;
  for (let oy = -radius; oy <= radius; oy += radius) {
    for (let ox = -radius; ox <= radius; ox += radius) {
      if (!ox && !oy) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) return true;
      if (!isInkPixel(pixels, (ny * size + nx) * 4, bg)) return true;
    }
  }
  return false;
}

function fallbackPoints() {
  const points = [];
  for (let i = 0; i < 1200; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 110;
    points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, edge: Math.random() > 0.55, luma: 0.5, alpha: 1, seed: Math.random() * 1000 });
  }
  return points;
}

function resetParticles() {
  particles = sourcePoints.map((point) => ({
    x: point.x,
    y: point.y,
    vx: random(-1, 1),
    vy: random(-1, 1),
    seed: point.seed,
  }));
}

function deformationFor(point, index, t, drive) {
  const dist = Math.hypot(point.x, point.y);
  const angle = Math.atan2(point.y, point.x);
  const audioBias = bass * state.bass * 1.1 + mid * state.mid * 0.7 + treble * state.treble * 0.55;
  const amount = state.deformation * (drive + audioBias * 0.22) * 0.3;
  let dx = 0;
  let dy = 0;
  switch (state.deformationMode) {
    case 1: {
      const pulse = Math.sin(t * 3 + dist * 0.025) * amount;
      dx = Math.cos(angle) * pulse;
      dy = Math.sin(angle) * pulse;
      break;
    }
    case 2: {
      dx = Math.cos(angle) * amount * 1.7;
      dy = Math.sin(angle) * amount * 1.7;
      break;
    }
    case 3:
      dx = Math.sin(point.y * 0.028 + t * 2.2) * amount;
      dy = Math.cos(point.x * 0.024 + t * 1.7) * amount;
      break;
    case 4:
      dx = (Math.floor(point.y / 22) % 2 ? 1 : -1) * amount;
      break;
    case 5:
      dx = Math.sin(angle * 5 + t) * amount;
      dy = Math.cos(angle * 4 - t) * amount;
      break;
    case 6:
      dx = Math.sin(index * 91.17 + Math.floor(t * 14 + treble * 10)) * amount;
      dy = Math.cos(index * 47.31 + Math.floor(t * 12 + bass * 8)) * amount * 0.4;
      break;
    default:
      dx = Math.sin(point.seed + t) * amount * 0.14;
      dy = Math.cos(point.seed * 1.3 + t) * amount * 0.14;
  }
  const noise = Math.sin(point.seed + t * state.noise + point.x * 0.01) * state.noise * 5 * drive;
  return { x: point.x + dx + noise, y: point.y + dy + noise * 0.4 };
}

function drawImageMode(cx, cy, scale, drive) {
  const w = sourceImage.naturalWidth || 1;
  const h = sourceImage.naturalHeight || 1;
  const fit = Math.min(430 / w, 430 / h) * scale;
  const dw = w * fit;
  const dh = h * fit;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rotation * (0.5 + drive));
  const pulse = 1 + state.scale * drive * Math.sin(time * 3);
  ctx.scale(pulse, pulse);
  ctx.globalAlpha = state.opacity;
  ctx.filter = state.background === "dark" ? "brightness(1.25) saturate(1.3)" : "contrast(1.1)";
  ctx.drawImage(sourceImage, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function colorMix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)}, ${Math.round(ca.g + (cb.g - ca.g) * t)}, ${Math.round(ca.b + (cb.b - ca.b) * t)})`;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function pointColor(point, index, colorA, colorB, drive) {
  if (point.edge) return index % 3 ? colorB : colorA;
  return (index + Math.floor(time * 6 + drive * 4)) % 5 ? colorA : colorB;
}

function pointRadius(point, drive, multiplier = 1) {
  return Math.max(0.55, state.pointSize * multiplier * (point.edge ? 1.25 : 0.78) * (0.75 + drive * 0.55));
}

function getRenderSets() {
  const modeCaps = {
    3: 1200,
    5: 1500,
    7: 1200,
    10: 1700,
    11: 1600,
    14: 1500,
  };
  const cap = modeCaps[state.mode] || 3200;
  const visibleCount = Math.min(sourcePoints.length, cap, Math.round(state.pointCount * (0.55 + state.complexity * 0.75)));
  const edgeSource = sourceEdgePoints.length ? sourceEdgePoints : sourcePoints;
  const fillSource = sourceFillPoints.length ? sourceFillPoints : sourcePoints;
  const edgeTarget = Math.min(edgeSource.length, Math.round(visibleCount * 0.42));
  const fillTarget = Math.max(0, visibleCount - edgeTarget);
  const pick = (source, count) => {
    if (!source.length || count <= 0) return [];
    const step = source.length / count;
    return Array.from({ length: Math.min(count, source.length) }, (_, i) => source[Math.min(source.length - 1, Math.floor(i * step))]);
  };
  const edge = pick(edgeSource, edgeTarget);
  const fill = pick(fillSource.length ? fillSource : sourcePoints, fillTarget);
  const all = [...edge, ...fill];
  return { all, edge, fill };
}

function drawContourDots(points, drive, colorA, colorB) {
  ctx.fillStyle = colorB;
  for (let i = 0; i < points.length; i += 1) {
    const p = deformationFor(points[i], i, time, drive);
    const r = pointRadius(points[i], drive, 1.2);
    ctx.globalAlpha = state.opacity * (0.65 + treble * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 ? colorB : colorA;
    ctx.fill();
  }
}

function drawMutation() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const cx = width / 2;
  const cy = height / 2 - 10;
  const bg = state.background === "dark" ? "#090b0b" : "#efebe8";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  if (!state.enabled || !sourceImage.src) return;

  const drive = Math.min(1.7, energy * state.intensity + 0.08);
  const fit = Math.min(width, height) / 610;
  const { all: renderPoints, edge: edgePoints, fill: fillPoints } = getRenderSets();
  const colorA = state.primary;
  const colorB = state.secondary;

  if (state.mode === 0) {
    drawImageMode(cx, cy, fit, drive);
    return;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.rotation * Math.sin(time) * drive);
  ctx.scale(fit * (1 + state.scale * drive), fit * (1 + state.scale * drive));
  ctx.globalAlpha = state.opacity;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (state.mode === 3) {
    const lineSource = edgePoints.length > 30 ? edgePoints : renderPoints;
    ctx.strokeStyle = colorA;
    ctx.lineWidth = Math.max(0.6, state.stroke * 0.72);
    ctx.globalAlpha = state.opacity * 0.86;
    const strideLine = Math.max(1, Math.floor(lineSource.length / 900));
    ctx.beginPath();
    for (let i = 0; i < lineSource.length - strideLine; i += strideLine) {
      const p = deformationFor(lineSource[i], i, time, drive);
      const q = deformationFor(lineSource[i + strideLine], i + strideLine, time, drive);
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 34 + drive * 18) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
    }
    ctx.stroke();
    drawContourDots(edgePoints.filter((_, i) => i % 7 === 0), drive, colorA, colorB);
  } else if (state.mode === 7) {
    const stridePerlin = Math.max(1, Math.floor(renderPoints.length / 1300));
    for (let i = 0; i < renderPoints.length; i += stridePerlin) {
      const base = renderPoints[i];
      const p = deformationFor(base, i, time, drive);
      const angle = Math.sin(base.seed * 0.03 + time * 1.4 + base.x * 0.018) * Math.PI;
      const len = (base.edge ? 9 : 5) + drive * 20;
      ctx.globalAlpha = state.opacity * (base.edge ? 0.72 : 0.34);
      ctx.strokeStyle = pointColor(base, i, colorA, colorB, drive);
      ctx.lineWidth = Math.max(0.5, state.stroke * (base.edge ? 0.62 : 0.36));
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle) * len * 0.5, p.y - Math.sin(angle) * len * 0.5);
      ctx.lineTo(p.x + Math.cos(angle) * len, p.y + Math.sin(angle) * len);
      ctx.stroke();
    }
  } else if (state.mode === 5) {
    const cell = 16 + (1 - state.complexity) * 18;
    const gridMap = new Map();
    for (let i = 0; i < renderPoints.length; i += 1) {
      const point = renderPoints[i];
      const gx = Math.round(point.x / cell);
      const gy = Math.round(point.y / cell);
      const key = `${gx},${gy}`;
      if (!gridMap.has(key) || point.edge) gridMap.set(key, point);
    }
    ctx.lineWidth = Math.max(0.5, state.stroke * 0.58);
    for (const point of gridMap.values()) {
      const p = deformationFor(point, Math.floor(point.seed), time, drive);
      const wobble = Math.sin(point.seed + time * 2.5) * drive * 7;
      const size = cell * (point.edge ? 0.92 : 0.54);
      ctx.globalAlpha = state.opacity * (point.edge ? 0.95 : 0.42);
      ctx.strokeStyle = point.edge ? colorB : colorA;
      ctx.strokeRect(p.x - size / 2 + wobble, p.y - size / 2 - wobble, size, size);
    }
  } else if (state.mode === 1 || state.mode === 12 || state.mode === 13) {
    const s = state.mode === 12 ? 1 + drive * 0.35 : state.mode === 13 ? 1 - drive * 0.22 : 1;
    ctx.scale(s, s);
    ctx.fillStyle = colorMix(colorA, colorB, 0.22);
    ctx.beginPath();
    for (let i = 0; i < renderPoints.length; i += 1) {
      const p = deformationFor(renderPoints[i], i, time, drive);
      const r = pointRadius(renderPoints[i], drive, state.stroke * (renderPoints[i].edge ? 0.9 : 1.35));
      ctx.moveTo(p.x + r, p.y);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    drawContourDots(edgePoints.filter((_, i) => i % 2 === 0), drive, colorA, colorB);
  } else if ([2, 4, 8, 9].includes(state.mode)) {
    for (let i = 0; i < renderPoints.length; i += 1) {
      const base = renderPoints[i];
      const p = deformationFor(base, i, time, drive);
      const scatter = state.mode === 4 ? state.fragmentation * drive * (base.edge ? 130 : 58) : state.mode === 8 ? 10 + bass * 22 : 0;
      const x = p.x + Math.sin(base.seed * 7 + time * (1 + bass)) * scatter;
      const y = p.y + Math.cos(base.seed * 9 + time * 0.8) * scatter + (state.mode === 8 ? Math.sin(time * 2 + base.seed) * 10 : 0);
      const size = state.mode === 9 ? pointRadius(base, drive, state.stroke * 1.8) : pointRadius(base, drive, state.stroke * 0.62);
      ctx.globalAlpha = state.opacity * (base.edge ? 0.96 : state.mode === 7 ? 0.38 : 0.72);
      ctx.fillStyle = pointColor(base, i, colorA, colorB, drive);
      if (state.mode === 9) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(0.45, size * 0.22);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(base.seed + time) * size * 2.4, y + Math.cos(base.seed + time) * size * 2.4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if ([10, 11, 14].includes(state.mode)) {
    const linePoints = state.mode === 10 ? edgePoints : renderPoints;
    ctx.strokeStyle = state.mode === 10 ? colorB : colorA;
    ctx.lineWidth = Math.max(0.5, state.stroke * (state.mode === 10 ? 0.45 : 1));
    ctx.beginPath();
    for (let i = 0; i < linePoints.length - 2; i += state.mode === 10 ? 1 : 2) {
      const p = deformationFor(linePoints[i], i, time, drive);
      let nearest = null;
      let nearestDistance = Infinity;
      for (let j = i + 1; j < Math.min(linePoints.length, i + (state.mode === 10 ? 9 : 18)); j++) {
        const candidate = deformationFor(linePoints[j], j, time, drive);
        const distance = Math.hypot(p.x - candidate.x, p.y - candidate.y);
        if (distance < nearestDistance) {
          nearest = candidate;
          nearestDistance = distance;
        }
      }
      const q = nearest;
      if (q && nearestDistance < (state.mode === 14 ? 90 : state.mode === 10 ? 28 : 40)) {
        if (state.mode === 11) {
          ctx.moveTo(p.x * 0.18, p.y * 0.18);
          ctx.lineTo(p.x, p.y);
        } else {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        }
      }
    }
    ctx.stroke();
    if (state.mode === 10) drawContourDots(edgePoints.filter((_, i) => i % 4 === 0), drive, colorA, colorB);
  } else if (state.mode === 6 || state.mode === 15 || state.mode === 16) {
    const rings = state.mode === 15 ? 12 : 7;
    for (let ring = rings; ring >= 0; ring--) {
      ctx.strokeStyle = ring % 2 ? colorA : colorB;
      ctx.globalAlpha = state.opacity * (1 - ring / (rings + 2)) * 0.65;
      ctx.lineWidth = Math.max(0.6, state.stroke * 0.55);
      ctx.beginPath();
      const echoPoints = state.mode === 6 ? edgePoints : renderPoints;
      for (let i = 0; i < echoPoints.length; i += state.mode === 16 ? 1 : 2) {
        const p = deformationFor(echoPoints[i], i, time - ring * 0.12, drive);
        const wave = state.mode === 16 ? Math.sin(p.x * 0.03 + time * 3 + ring + bass * 4) * (10 + drive * 24) : 0;
        const offset = ring * (state.mode === 15 ? 4.2 + bass * 6 : 2.8);
        ctx.moveTo(p.x + offset, p.y + wave + ring * 0.8);
        ctx.lineTo(p.x + offset + 0.1, p.y + wave + ring * 0.8);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function updateAudio(now) {
  if (analyser && audioData) {
    analyser.getByteFrequencyData(audioData);
    const n = audioData.length;
    bass = average(audioData, 0, n * 0.12) / 255;
    mid = average(audioData, n * 0.12, n * 0.45) / 255;
    treble = average(audioData, n * 0.45, n) / 255;
  } else {
    bass = 0.28 + Math.sin(now * 0.0017) * 0.18 + Math.sin(now * 0.0061) * 0.07;
    mid = 0.22 + Math.sin(now * 0.0023 + 1.2) * 0.13;
    treble = 0.16 + Math.sin(now * 0.0041 + 2.8) * 0.1;
  }
  const target = Math.max(0, (bass * state.bass * 0.5 + mid * state.mid * 0.32 + treble * state.treble * 0.18) * state.soundIntensity);
  const smoothing = state.frozen ? 1 : state.smoothing;
  energy += (target - energy) * (1 - smoothing) * (target > energy ? 1.8 : 0.7);
  document.querySelector("#energyValue").textContent = energy.toFixed(2);
  document.querySelector("#energyDot").style.transform = `scale(${0.8 + energy * 1.8})`;
  drawMeter();
}

function average(array, start, end) {
  let total = 0;
  let count = 0;
  for (let i = Math.floor(start); i < Math.floor(end); i++) {
    total += array[i];
    count++;
  }
  return count ? total / count : 0;
}

function drawMeter() {
  const width = meter.width;
  const height = meter.height;
  meterCtx.clearRect(0, 0, width, height);
  [bass, mid, treble].forEach((value, i) => {
    const y = 4 + i * 13;
    meterCtx.fillStyle = "#222626";
    meterCtx.fillRect(0, y, width, 5);
    meterCtx.fillStyle = i === 0 ? state.primary : i === 1 ? "#687c49" : state.secondary;
    meterCtx.fillRect(0, y, width * Math.max(0, Math.min(1, value)), 5);
  });
}

function animate(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!state.frozen) time += dt;
  updateAudio(now);
  drawMutation();
  requestAnimationFrame(animate);
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  if (!masterGain) {
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.32 * state.soundIntensity;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioData = new Uint8Array(analyser.frequencyBinCount);
    masterGain.connect(analyser);
    masterGain.connect(audioContext.destination);
  }
}

function stopSynth(keepLabel = false) {
  clearInterval(synthTimer);
  synthTimer = null;
  if (sampleAudio) {
    sampleAudio.pause();
    sampleAudio.currentTime = 0;
    sampleAudio = null;
  }
  if (sampleSourceNode) {
    try {
      sampleSourceNode.disconnect();
    } catch {}
    sampleSourceNode = null;
  }
  synthNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch {}
  });
  synthNodes = [];
  if (!keepLabel && !micStream) {
    state.activeSound = "visual";
    document.querySelector("#audioStatus").textContent = "Simulação visual ativa";
  }
}

function makeOsc(type, frequency, gain = 0.08) {
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  amp.gain.value = gain;
  osc.connect(amp).connect(masterGain);
  osc.start();
  synthNodes.push(osc, amp);
  return { osc, amp };
}

function triggerKick(now = audioContext.currentTime) {
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
  amp.gain.setValueAtTime(0.48, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(amp).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.24);
}

function startFilteredNoise(filterType, frequency, q, gainValue) {
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const amp = audioContext.createGain();
  noise.buffer = createNoiseBuffer();
  noise.loop = true;
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  amp.gain.value = gainValue;
  noise.connect(filter).connect(amp).connect(masterGain);
  noise.start();
  synthNodes.push(noise, filter, amp);
  return { noise, filter, amp };
}

function triggerHorn(now = audioContext.currentTime) {
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(380 + Math.random() * 120, now);
  amp.gain.setValueAtTime(0.001, now);
  amp.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(amp).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.24);
}

async function startAudioSample(src) {
  sampleAudio = new Audio(src);
  sampleAudio.loop = true;
  sampleAudio.preload = "auto";
  sampleAudio.crossOrigin = "anonymous";
  sampleAudio.volume = Math.min(1, 0.9 * state.soundIntensity);
  sampleSourceNode = audioContext.createMediaElementSource(sampleAudio);
  const sampleGain = audioContext.createGain();
  sampleGain.gain.value = 1;
  sampleSourceNode.connect(sampleGain).connect(masterGain);
  synthNodes.push(sampleGain);
  await sampleAudio.play();
}

function createNoiseBuffer() {
  const length = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

async function legacyStartSoundPad(type) {
  if (type === "stop") {
    stopSynth();
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
    state.activeSound = "stop";
    refreshButtons();
    document.querySelector("#audioStatus").textContent = "Áudio mudo";
    showToast("Som desligado");
    return;
  }
  state.activeSound = type;
  refreshButtons();
  document.querySelector("#audioStatus").textContent = type === "beat"
    ? "Beat sintético tocando"
    : type === "pulse"
      ? "Pulso tonal tocando"
      : "Ruído generativo tocando";
  try {
    await ensureAudioContext();
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
      document.querySelector("#micButton").classList.remove("active");
      document.querySelector("#micButton").textContent = "USAR MICROFONE";
    }
    stopSynth(true);
    state.activeSound = type;
    refreshButtons();
    if (type === "beat") {
      makeOsc("sawtooth", 62, 0.035);
      makeOsc("triangle", 186, 0.025);
      triggerKick();
      synthTimer = setInterval(() => triggerKick(), 460);
    } else if (type === "pulse") {
      const { osc, amp } = makeOsc("sine", 110, 0.001);
      makeOsc("triangle", 330, 0.03);
      synthTimer = setInterval(() => {
        const now = audioContext.currentTime;
        osc.frequency.setTargetAtTime(90 + Math.random() * 80, now, 0.04);
        amp.gain.cancelScheduledValues(now);
        amp.gain.setValueAtTime(0.2, now);
        amp.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      }, 520);
    } else if (type === "noise") {
      const noise = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const amp = audioContext.createGain();
      noise.buffer = createNoiseBuffer();
      noise.loop = true;
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 2.6;
      amp.gain.value = 0.1;
      noise.connect(filter).connect(amp).connect(masterGain);
      noise.start();
      synthNodes.push(noise, filter, amp);
      synthTimer = setInterval(() => {
        filter.frequency.setTargetAtTime(260 + Math.random() * 2200, audioContext.currentTime, 0.08);
      }, 180);
    }
  } catch {
    stopSynth(true);
    document.querySelector("#audioStatus").textContent = "Clique bloqueado pelo navegador; tente clicar direto na tela";
    showToast("O navegador bloqueou o áudio automático");
    return;
  }
  showToast("Som real ativado");
}

async function startSoundPad(type) {
  state.activeSound = type;
  refreshButtons();
  const soundLabels = {
    beat: "Beat sintético tocando",
    pulse: "Pulso tonal tocando",
    noise: "Ruído generativo tocando",
    car: "Áudio de carro tocando",
    rain: "Áudio de chuva tocando",
    street: "Áudio de rua tocando",
  };
  document.querySelector("#audioStatus").textContent = soundLabels[type] || "Som generativo tocando";
  try {
    await ensureAudioContext();
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
      document.querySelector("#micButton").classList.remove("active");
      document.querySelector("#micButton").textContent = "USAR MICROFONE";
    }
    stopSynth(true);
    state.activeSound = type;
    refreshButtons();
    if (type === "beat") {
      makeOsc("sawtooth", 62, 0.055);
      makeOsc("triangle", 186, 0.04);
      triggerKick();
      synthTimer = setInterval(() => triggerKick(), 460);
    } else if (type === "pulse") {
      const { osc, amp } = makeOsc("sine", 110, 0.001);
      makeOsc("triangle", 330, 0.052);
      synthTimer = setInterval(() => {
        const now = audioContext.currentTime;
        osc.frequency.setTargetAtTime(90 + Math.random() * 80, now, 0.04);
        amp.gain.cancelScheduledValues(now);
        amp.gain.setValueAtTime(0.32, now);
        amp.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      }, 520);
    } else if (type === "noise") {
      const { filter } = startFilteredNoise("bandpass", 900, 2.6, 0.18);
      synthTimer = setInterval(() => {
        filter.frequency.setTargetAtTime(260 + Math.random() * 2200, audioContext.currentTime, 0.08);
      }, 180);
    } else if (type === "car") {
      await startAudioSample("./sounds/car.mp3?v=1");
    } else if (type === "rain") {
      await startAudioSample("./sounds/rain.mp3?v=1");
    } else if (type === "street") {
      await startAudioSample("./sounds/street.mp3?v=1");
    }
  } catch {
    stopSynth(true);
    document.querySelector("#audioStatus").textContent = "Clique bloqueado pelo navegador; tente clicar direto na tela";
    showToast("O navegador bloqueou o áudio automático");
    return;
  }
  showToast("Som real ativado");
}

async function useMicrophone() {
  try {
    stopSynth(true);
    await ensureAudioContext();
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micGain = audioContext.createGain();
    micGain.gain.value = 0;
    audioContext.createMediaStreamSource(micStream).connect(analyser);
    audioContext.createMediaStreamSource(micStream).connect(micGain).connect(audioContext.destination);
    state.activeSound = "mic";
    document.querySelector("#audioStatus").textContent = "Microfone ao vivo";
    document.querySelector("#micButton").classList.add("active");
    document.querySelector("#micButton").textContent = "MICROFONE ATIVO";
    refreshButtons();
    showToast("Entrada sonora conectada");
  } catch {
    showToast("Microfone não autorizado; mantendo simulação");
  }
}

function loadFile(file) {
  if (!file) return;
  if (!/^image\/(svg\+xml|png|jpeg|webp)$/.test(file.type) && !/\.(svg|png|jpe?g|webp)$/i.test(file.name)) {
    showToast("Use SVG, PNG, JPG ou WEBP");
    return;
  }
  state.activeBrand = "custom";
  syncControls();
  setSource(URL.createObjectURL(file), file.name).then(() => showToast("Identidade carregada"));
}

function exportPng() {
  const link = document.createElement("a");
  link.download = `eclode_mutacao_${new Date().toISOString().replaceAll(/[:.]/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("PNG exportado");
}

document.querySelector("#randomize").addEventListener("click", randomize);
document.querySelector("#reset").addEventListener("click", reset);
document.querySelector("#freeze").addEventListener("click", () => {
  state.frozen = !state.frozen;
  refreshButtons();
  showToast(state.frozen ? "Mutação congelada" : "Mutação liberada");
});
document.querySelector("#systemToggle").addEventListener("click", () => {
  state.enabled = !state.enabled;
  refreshButtons();
});
document.querySelectorAll(".bg-button").forEach((button) => button.addEventListener("click", () => {
  state.background = button.dataset.bg;
  refreshButtons();
}));
document.querySelectorAll(".swatch").forEach((swatch) => swatch.addEventListener("click", () => applyPalette(Number(swatch.dataset.palette))));
document.querySelector("#primaryColor").addEventListener("input", (event) => state.primary = event.target.value);
document.querySelector("#secondaryColor").addEventListener("input", (event) => state.secondary = event.target.value);
document.querySelector("#micButton").addEventListener("click", useMicrophone);
document.querySelectorAll(".sound-pad").forEach((button) => button.addEventListener("click", () => startSoundPad(button.dataset.sound)));
document.querySelector("#soundLess").addEventListener("click", () => changeSoundIntensity(-0.2));
document.querySelector("#soundMore").addEventListener("click", () => changeSoundIntensity(0.2));
document.querySelector("#svgInput").addEventListener("change", (event) => loadFile(event.target.files[0]));
document.querySelector("#imageInput").addEventListener("change", (event) => loadFile(event.target.files[0]));
document.querySelector("#exportPng").addEventListener("click", exportPng);
window.addEventListener("resize", resizeCanvas);

["dragenter", "dragover"].forEach((name) => stage.addEventListener(name, (event) => {
  event.preventDefault();
  stage.classList.add("dragging");
}));
["dragleave", "drop"].forEach((name) => stage.addEventListener(name, (event) => {
  event.preventDefault();
  stage.classList.remove("dragging");
}));
stage.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));

makeSliders();
refreshButtons();
resizeCanvas();
applyBrandApp("eclode");
requestAnimationFrame(animate);
