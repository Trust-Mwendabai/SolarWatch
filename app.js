/* ===================================
   SOLARWATCH — APP JAVASCRIPT
   =================================== */

'use strict';

// ===================================
// NAVIGATION
// ===================================
const nav        = document.getElementById('nav');
const navToggle  = document.getElementById('navToggle');
const navLinks   = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===================================
// SCROLL REVEAL
// ===================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.flow-step, .comp-card, .sim-node, .perf-card, .sim-output-card, .section-header'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ===================================
// HERO CANVAS — SOLAR DIAGRAM
// ===================================
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;

  let t = 0;

  // Orbiting data nodes
  const nodes = [
    { label: 'PV Array',   angle: 0,       r: 160, color: '#F4B942' },
    { label: 'Controller', angle: Math.PI * 0.5, r: 160, color: '#60A5FA' },
    { label: 'Battery',    angle: Math.PI,        r: 160, color: '#4ADE80' },
    { label: 'Inverter',   angle: Math.PI * 1.5,  r: 160, color: '#A78BFA' },
  ];

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Outer rings
    [180, 148, 116].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244,185,66,${0.04 - i * 0.01})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Sun glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 72);
    grad.addColorStop(0, 'rgba(244,185,66,0.22)');
    grad.addColorStop(0.5, 'rgba(244,185,66,0.06)');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sun core
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#F4B942';
    ctx.shadowColor = '#F4B942';
    ctx.shadowBlur = 28;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sun rays
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + t * 0.4;
      const x1 = cx + Math.cos(angle) * 38;
      const y1 = cy + Math.sin(angle) * 38;
      const x2 = cx + Math.cos(angle) * (50 + Math.sin(t * 2 + i) * 4);
      const y2 = cy + Math.sin(angle) * (50 + Math.sin(t * 2 + i) * 4);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#F4B942';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Orbiting nodes
    nodes.forEach((node, i) => {
      const angle = node.angle + t * 0.3;
      const nx = cx + Math.cos(angle) * node.r;
      const ny = cy + Math.sin(angle) * node.r;

      // Connection line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `rgba(${hexToRgb(node.color)},0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node glow
      const nodeGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 28);
      nodeGrad.addColorStop(0, `rgba(${hexToRgb(node.color)},0.2)`);
      nodeGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(nx, ny, 28, 0, Math.PI * 2);
      ctx.fillStyle = nodeGrad;
      ctx.fill();

      // Node dot
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Moving particle along orbit
      const pAngle = angle + t * 0.8;
      const px = nx + Math.cos(pAngle) * 14;
      const py = ny + Math.sin(pAngle) * 14;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(node.color)},0.6)`;
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(232,237,245,0.7)';
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, nx, ny + 26);
    });

    t += 0.012;
    requestAnimationFrame(draw);
  }

  draw();
})();

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

// ===================================
// HERO LIVE STATS — GENTLE FLOAT
// ===================================
(function heroStats() {
  const solar   = document.getElementById('hsSolar');
  const battery = document.getElementById('hsBattery');
  const load    = document.getElementById('hsLoad');

  let baseS = 4.2, baseB = 87, baseL = 2.8;

  setInterval(() => {
    baseS = clamp(baseS + (Math.random() - 0.5) * 0.3, 0.5, 5.2);
    baseB = clamp(baseB + (Math.random() - 0.48) * 0.4, 20, 100);
    baseL = clamp(baseL + (Math.random() - 0.5) * 0.2, 0.5, 4.0);

    solar.textContent   = baseS.toFixed(1);
    battery.textContent = Math.round(baseB);
    load.textContent    = baseL.toFixed(1);
  }, 2000);
})();

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ===================================
// SIMULATION
// ===================================
const sliders = {
  irradiance:  document.getElementById('irradiance'),
  load:        document.getElementById('load'),
  temperature: document.getElementById('temperature'),
  socInit:     document.getElementById('socInit'),
};
const vals = {
  irradiance:  document.getElementById('irradianceVal'),
  load:        document.getElementById('loadVal'),
  temperature: document.getElementById('tempVal'),
  socInit:     document.getElementById('socInitVal'),
};

sliders.irradiance.addEventListener('input', () => {
  vals.irradiance.textContent = `${sliders.irradiance.value} W/m²`;
});
sliders.load.addEventListener('input', () => {
  vals.load.textContent = `${sliders.load.value} W`;
});
sliders.temperature.addEventListener('input', () => {
  vals.temperature.textContent = `${sliders.temperature.value} °C`;
});
sliders.socInit.addEventListener('input', () => {
  vals.socInit.textContent = `${sliders.socInit.value} %`;
});

// Toggle switches
let gridAvailable = true, cloudCover = false;

document.getElementById('toggleGrid').addEventListener('click', function() {
  gridAvailable = !gridAvailable;
  this.querySelector('.toggle-switch').classList.toggle('active', gridAvailable);
  this.querySelector('.toggle-switch').setAttribute('data-state', gridAvailable);
});
document.getElementById('toggleCloud').addEventListener('click', function() {
  cloudCover = !cloudCover;
  this.querySelector('.toggle-switch').classList.toggle('active', cloudCover);
  this.querySelector('.toggle-switch').setAttribute('data-state', cloudCover);
});

// Run simulation
document.getElementById('runSim').addEventListener('click', runSimulation);

function runSimulation() {
  const irr  = parseFloat(sliders.irradiance.value);
  const loadW = parseFloat(sliders.load.value);
  const temp  = parseFloat(sliders.temperature.value);
  const soc   = parseFloat(sliders.socInit.value);

  // Panel model: 4 × 250W, STC irradiance = 1000 W/m²
  const panelRatedW = 1000;
  const tempCoeff   = -0.004; // %/°C
  const tempDelta   = temp - 25;
  const cloudFactor = cloudCover ? 0.55 : 1.0;
  const tempFactor  = 1 + tempCoeff * tempDelta;
  const panelOutputW = panelRatedW * (irr / 1000) * tempFactor * cloudFactor;

  // MPPT efficiency 98%
  const mpptOutputW = panelOutputW * 0.98;

  // Battery: 200 Ah, 24 V = 4800 Wh usable at 80% DoD
  const battCapWh = 4800 * 0.80;
  const battAvailWh = battCapWh * (soc / 100);

  // Inverter: 93% efficiency
  const invInputW = loadW / 0.93;

  // Power balance
  const netW = mpptOutputW - invInputW;

  // Backup duration (only battery)
  const backupH = battAvailWh / loadW;

  // Efficiency
  const sysEff = panelOutputW > 0 ? (mpptOutputW * 0.93 / panelOutputW) * 100 : 0;

  // Mode logic
  let mode;
  if (panelOutputW >= loadW * 1.1) {
    mode = netW > 50 ? 'Solar + Charging' : 'Solar Only';
  } else if (panelOutputW > 0 && (panelOutputW + battAvailWh) > 0) {
    mode = gridAvailable ? 'Solar + Grid Assist' : 'Solar + Battery';
  } else if (soc > 10) {
    mode = 'Battery Backup';
  } else {
    mode = gridAvailable ? 'Grid Only' : 'Low Power';
  }

  // Update nodes
  animNode('nodePanel',    document.getElementById('snPanelVal'),    `${panelOutputW.toFixed(0)} W`);
  animNode('nodeCtrl',     document.getElementById('snCtrlVal'),     `${mpptOutputW.toFixed(0)} W`);
  animNode('nodeInverter', document.getElementById('snInvVal'),      `${(invInputW).toFixed(0)} W`);
  animNode('nodeLoad',     document.getElementById('snLoadVal'),     `${loadW} W`);

  // Battery
  const socResult = clamp(soc + (netW > 0 ? 1.5 : -1.2), 0, 100);
  const fill = document.getElementById('batteryFill');
  const pct  = document.getElementById('batteryPct');
  const bVal = document.getElementById('snBatVal');
  fill.style.width = `${socResult}%`;
  pct.textContent  = `${Math.round(socResult)}%`;
  bVal.textContent = `${Math.round(socResult)}%`;
  fill.className = 'battery-fill' + (socResult < 25 ? ' low' : socResult < 50 ? ' mid' : '');

  document.getElementById('nodeBattery').classList.add('active');

  // Outputs
  const modeEl = document.getElementById('soMode');
  modeEl.textContent = mode;
  modeEl.style.color = mode.includes('Solar') ? '#F4B942' : mode.includes('Battery') ? '#4ADE80' : '#60A5FA';

  const balEl = document.getElementById('soBalance');
  balEl.textContent = `${netW >= 0 ? '+' : ''}${netW.toFixed(0)} W`;
  balEl.style.color = netW >= 0 ? '#4ADE80' : '#F87171';

  document.getElementById('soBackup').textContent = backupH < 999
    ? `${backupH.toFixed(1)} hrs`
    : '> 100 hrs';

  document.getElementById('soEfficiency').textContent = `${sysEff.toFixed(1)}%`;

  // Wire animation
  activateWire('wirePanelCtrl', panelOutputW > 0);
  activateWire('wireCtrlBat',   panelOutputW > 0);
  activateWire('wireBatInv',    true);
  activateWire('wireInvLoad',   loadW > 0);
}

function animNode(id, valEl, text) {
  const node = document.getElementById(id);
  node.classList.add('active');
  valEl.textContent = text;
  node.style.transition = 'border-color 0.4s';
}

function activateWire(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('active', on);
}

// Auto-run on load
window.addEventListener('load', () => setTimeout(runSimulation, 600));

// ===================================
// PERFORMANCE CHART
// ===================================
(function initChart() {
  const canvas = document.getElementById('perfChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = canvas.parentElement.clientWidth - 64 || 800;
  canvas.height = 320;

  const hours = Array.from({length: 25}, (_, i) => i);
  const labels = hours.map(h => h < 10 ? `0${h}:00` : `${h}:00`);

  const datasets = {
    generation: {
      label: 'Solar Generation (kW)',
      color: '#F4B942',
      fill: 'rgba(244,185,66,0.12)',
      data: [0,0,0,0,0,0.1,0.5,1.2,2.1,3.0,3.7,4.1,4.2,3.9,3.4,2.7,1.8,0.9,0.3,0.05,0,0,0,0,0],
    },
    load: {
      label: 'Load Consumption (kW)',
      color: '#F87171',
      fill: 'rgba(248,113,113,0.10)',
      data: [1.1,0.9,0.8,0.8,0.9,1.0,1.3,1.6,1.8,2.0,1.9,1.8,1.7,1.9,2.0,2.2,2.3,2.4,2.5,2.3,2.1,1.8,1.6,1.3,1.1],
    },
    soc: {
      label: 'Battery SoC (%)',
      color: '#4ADE80',
      fill: 'rgba(74,222,128,0.10)',
      data: [55,50,46,42,38,36,34,40,52,64,76,85,92,95,97,96,92,86,78,70,62,58,56,54,52].map(v => v / 10),
      scale: 10,
    },
  };

  let activeDataset = 'generation';

  function drawChart(dsKey) {
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 20, right: 20, bottom: 48, left: 52 };
    const ds = datasets[dsKey];
    const data = ds.data;
    const scale = ds.scale || 1;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...data) * 1.15;
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const xStep  = chartW / (data.length - 1);

    function xAt(i) { return PAD.left + i * xStep; }
    function yAt(v) { return PAD.top + chartH - (v / maxVal) * chartH; }

    // Grid lines
    const gridLines = 5;
    for (let g = 0; g <= gridLines; g++) {
      const y = PAD.top + (g / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const val = maxVal * (1 - g / gridLines) * scale;
      ctx.fillStyle = 'rgba(138,149,168,0.8)';
      ctx.font = '10px "DM Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val < 5 ? 1 : 0), PAD.left - 8, y + 4);
    }

    // X axis labels (every 3h)
    hours.forEach((h, i) => {
      if (h % 3 === 0) {
        ctx.fillStyle = 'rgba(138,149,168,0.7)';
        ctx.font = '10px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], xAt(i), H - 14);
      }
    });

    // Area fill
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(data[0]));
    data.forEach((v, i) => {
      if (i === 0) return;
      const px = xAt(i - 1), nx = xAt(i);
      const py = yAt(data[i - 1]), ny = yAt(v);
      const mx = (px + nx) / 2;
      ctx.bezierCurveTo(mx, py, mx, ny, nx, ny);
    });
    ctx.lineTo(xAt(data.length - 1), PAD.top + chartH);
    ctx.lineTo(xAt(0), PAD.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, ds.fill);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(data[0]));
    data.forEach((v, i) => {
      if (i === 0) return;
      const px = xAt(i-1), nx = xAt(i);
      const py = yAt(data[i-1]), ny = yAt(v);
      const mx = (px + nx) / 2;
      ctx.bezierCurveTo(mx, py, mx, ny, nx, ny);
    });
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    ctx.shadowColor = ds.color;
    ctx.shadowBlur  = 8;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // Current time indicator (noon = 12)
    const nowI = 12;
    ctx.beginPath();
    ctx.moveTo(xAt(nowI), PAD.top);
    ctx.lineTo(xAt(nowI), PAD.top + chartH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NOW', xAt(nowI), PAD.top - 4);

    // Dots at key points (peak)
    const peakI = data.indexOf(Math.max(...data));
    ctx.beginPath();
    ctx.arc(xAt(peakI), yAt(data[peakI]), 5, 0, Math.PI * 2);
    ctx.fillStyle = ds.color;
    ctx.shadowColor = ds.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawChart(activeDataset);

  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      activeDataset = this.dataset.chart;
      drawChart(activeDataset);
    });
  });

  // Redraw on resize
  window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.clientWidth - 64 || 800;
    drawChart(activeDataset);
  });
})();
