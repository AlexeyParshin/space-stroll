const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// --- Word lists by difficulty ---
const wordSets = [
  [
    { ru: 'кот', en: 'cat', emoji: '🐱' }, { ru: 'собака', en: 'dog', emoji: '🐶' },
    { ru: 'дом', en: 'house', emoji: '🏠' }, { ru: 'дерево', en: 'tree', emoji: '🌳' },
    { ru: 'вода', en: 'water', emoji: '💧' }, { ru: 'еда', en: 'food', emoji: '🍕' },
    { ru: 'машина', en: 'car', emoji: '🚗' }, { ru: 'книга', en: 'book', emoji: '📖' },
    { ru: 'солнце', en: 'sun', emoji: '☀️' }, { ru: 'луна', en: 'moon', emoji: '🌙' },
    { ru: 'звезда', en: 'star', emoji: '⭐' }, { ru: 'ребенок', en: 'child', emoji: '👶' },
    { ru: 'игра', en: 'game', emoji: '🎮' }, { ru: 'шар', en: 'ball', emoji: '⚽' },
    { ru: 'цветок', en: 'flower', emoji: '🌸' }, { ru: 'птица', en: 'bird', emoji: '🐦' },
  ],
  [
    { ru: 'яблоко', en: 'apple', emoji: '🍎' }, { ru: 'стол', en: 'table', emoji: '🪵' },
    { ru: 'стул', en: 'chair', emoji: '🪑' }, { ru: 'одежда', en: 'clothes', emoji: '👕' },
    { ru: 'окно', en: 'window', emoji: '🪟' }, { ru: 'дверь', en: 'door', emoji: '🚪' },
    { ru: 'город', en: 'city', emoji: '🏙️' }, { ru: 'школа', en: 'school', emoji: '🏫' },
    { ru: 'друг', en: 'friend', emoji: '🤝' }, { ru: 'время', en: 'time', emoji: '⏰' },
    { ru: 'работа', en: 'work', emoji: '💼' }, { ru: 'день', en: 'day', emoji: '🌞' },
    { ru: 'ночь', en: 'night', emoji: '🌜' }, { ru: 'гора', en: 'mountain', emoji: '⛰️' },
    { ru: 'река', en: 'river', emoji: '🏞️' }, { ru: 'море', en: 'sea', emoji: '🌊' },
    { ru: 'земля', en: 'earth', emoji: '🌍' }, { ru: 'небо', en: 'sky', emoji: '🌌' },
  ],
  [
    { ru: 'самолет', en: 'airplane', emoji: '✈️' }, { ru: 'библиотека', en: 'library', emoji: '📚' },
    { ru: 'больница', en: 'hospital', emoji: '🏥' }, { ru: 'завод', en: 'factory', emoji: '🏭' },
    { ru: 'путешествие', en: 'journey', emoji: '🗺️' }, { ru: 'животное', en: 'animal', emoji: '🐾' },
    { ru: 'яйцо', en: 'egg', emoji: '🥚' }, { ru: 'ножницы', en: 'scissors', emoji: '✂️' },
    { ru: 'телескоп', en: 'telescope', emoji: '🔭' }, { ru: 'музыка', en: 'music', emoji: '🎵' },
    { ru: 'радуга', en: 'rainbow', emoji: '🌈' }, { ru: 'подарок', en: 'present', emoji: '🎁' },
    { ru: 'приключение', en: 'adventure', emoji: '🗡️' }, { ru: 'знание', en: 'knowledge', emoji: '🧠' },
    { ru: 'солнечный', en: 'sunny', emoji: '🌤️' }, { ru: 'дождливый', en: 'rainy', emoji: '🌧️' },
    { ru: 'красивый', en: 'beautiful', emoji: '😍' }, { ru: 'быстрый', en: 'fast', emoji: '💨' },
  ]
];

const powerups = [
  { text: '🔭 Vision +20%', effect: (g) => { g.visionRadius += 40; } },
  { text: '⚡ Speed Boost!', effect: (g) => { g.maxSpeed *= 1.3; setTimeout(() => g.maxSpeed /= 1.3, 5000); } },
  { text: '🛡️ Shield (+2 HP)', effect: (g) => { g.lives += 2; updateHealthBar(); } },
  { text: '❤️‍🩹 Health Kit (+3 HP)', effect: (g) => { g.lives = Math.min(g.maxLives, g.lives + 3); updateHealthBar(); showPowerupMsg('❤️‍🩹 +3 HP'); } },
];

// --- Camera / world system ---
let camera = { x: 0, y: 0 };
const shipWorld = { x: 0, y: 0 };
const SHIP_RADIUS = 18;

function worldToScreen(wx, wy) {
  return { x: wx - camera.x + W / 2, y: wy - camera.y + H / 2 };
}

// --- Input ---
let keys = {};

// Mouse/touch control state
let mouseDown = false;
let mouseStartX = 0, mouseStartY = 0;
let mouseX = 0, mouseY = 0;

window.addEventListener('mousedown', e => {
  if (!game || game.transitioning) return;
  mouseDown = true;
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  mouseDown = false;
});

window.addEventListener('touchstart', e => {
  if (!game || game.transitioning) return;
  const t = e.touches[0];
  mouseDown = true;
  mouseStartX = t.clientX;
  mouseStartY = t.clientY;
  mouseX = t.clientX;
  mouseY = t.clientY;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!mouseDown) return;
  const t = e.touches[0];
  mouseX = t.clientX;
  mouseY = t.clientY;
}, { passive: true });

window.addEventListener('touchend', () => {
  mouseDown = false;
});

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- Stars (parallax layers) ---
let starLayers = [[], [], []];
function initStars() {
  for (let layer = 0; layer < 3; layer++) {
    starLayers[layer] = [];
    let count = [200, 100, 50][layer];
    for (let i = 0; i < count; i++) {
      starLayers[layer].push({
        wx: Math.random() * 4000 - 2000,
        wy: Math.random() * 4000 - 2000,
        size: [1, 1.5, 2.5][layer],
        twinkle: Math.random() * Math.PI * 2,
        speed: [0.008, 0.015, 0.025][layer],
      });
    }
  }
}
initStars();

function drawStars(time) {
  for (let layer = 0; layer < starLayers.length; layer++) {
    let parallax = [0.3, 0.6, 1.0][layer];
    for (let s of starLayers[layer]) {
      s.twinkle += s.speed;
      let alpha = 0.2 + Math.sin(s.twinkle) * 0.25;
      let sx = s.wx - camera.x * parallax + W / 2;
      let sy = s.wy - camera.y * parallax + H / 2;

      // Wrap for infinite feel
      sx = ((sx % W) + W) % W;
      sy = ((sy % H) + H) % H;

      ctx.fillStyle = `rgba(200,210,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Sketchy helpers ---
function sketchText(text, x, y, size, color, align) {
  ctx.font = `bold ${size}px 'Press Start 2P', monospace`;
  ctx.fillStyle = color || '#9ab0d0';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillText(text, x + 2, y + 2);
  ctx.restore();
  ctx.fillText(text, x, y);
}

// --- Meteor word class ---
class Meteor {
  constructor(text, wx, wy, emoji, isObstacle) {
    this.text = text;
    this.wx = wx;
    this.wy = wy;
    this.emoji = emoji;
    this.isObstacle = isObstacle || false;
    this.radius = isObstacle ? 25 + Math.random() * 15 : (40 + text.length * 5);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.005;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.caught = false;
    this.catchProgress = 0;
    this.opacity = 1;
    // Irregular polygon shape for meteor look
    this.points = [];
    let numPoints = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numPoints; i++) {
      let angle = (i / numPoints) * Math.PI * 2;
      let r = this.radius * (0.7 + Math.random() * 0.3);
      this.points.push({ angle, r });
    }
    // Color - darker/grayer for obstacles
    let colors = ['#8a6a4a', '#6a5a7a', '#5a7a6a', '#7a5a5a', '#5a6a8a'];
    this.color = isObstacle ? '#3a3a4a' : colors[Math.floor(Math.random() * colors.length)];
  }

  update(time) {
    this.rotation += this.rotSpeed;
    this.pulsePhase += 0.03;
    if (this.caught) {
      this.catchProgress += 0.05;
      this.opacity = Math.max(0, 1 - this.catchProgress);
    }
  }

  draw() {
    if (this.opacity <= 0 || (this.caught && this.catchProgress > 1)) return;

    let sp = worldToScreen(this.wx, this.wy);

    // Cull off-screen
    if (sp.x < -150 || sp.x > W + 150 || sp.y < -150 || sp.y > H + 150) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(sp.x, sp.y);
    ctx.rotate(this.rotation);

    let pulse = 1 + Math.sin(this.pulsePhase) * 0.03;
    let r = this.radius * pulse;

    // Glow
    ctx.shadowColor = 'rgba(255,180,100,0.3)';
    ctx.shadowBlur = 20;

    // Meteor body - irregular shape
    ctx.beginPath();
    for (let i = 0; i <= this.points.length; i++) {
      let p = this.points[i % this.points.length];
      let px = Math.cos(p.angle) * p.r;
      let py = Math.sin(p.angle) * p.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Fill with gradient-like effect
    let grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
    grad.addColorStop(0, 'rgba(120,100,80,0.6)');
    grad.addColorStop(0.7, this.color);
    grad.addColorStop(1, 'rgba(40,30,20,0.8)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Sketchy outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(180,150,120,0.6)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) {
      let ox = (Math.random()-0.5)*1.5;
      ctx.beginPath();
      for (let j = 0; j <= this.points.length; j++) {
        let p = this.points[j % this.points.length];
        let px = Math.cos(p.angle) * p.r + ox;
        let py = Math.sin(p.angle) * p.r + ox;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Surface details (craters)
    ctx.fillStyle = 'rgba(30,20,10,0.3)';
    for (let i = 0; i < 3; i++) {
      let cx = (Math.random()-0.5) * r * 0.8;
      let cy = (Math.random()-0.5) * r * 0.8;
      let cr = 3 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Emoji inside meteor (not rotated, not caught, only word meteors)
    if (!this.caught && this.emoji && !this.isObstacle) {
      let emojiSize = Math.max(24, Math.min(36, this.radius * 0.7));
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, sp.x, sp.y);
      ctx.restore();
    }

    // Danger marker for obstacle meteors
    if (!this.caught && this.isObstacle) {
      ctx.save();
      ctx.globalAlpha = this.opacity * 0.6;
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('✕', sp.x, sp.y);
      ctx.restore();
    }
  }

  getScreenPos() {
    return worldToScreen(this.wx, this.wy);
  }
}

// --- Powerup class ---
class PowerUp {
  constructor(wx, wy, type) {
    this.wx = wx; this.wy = wy;
    this.type = type;
    this.radius = 25;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.opacity = 1;
  }

  update() {
    this.bobPhase += 0.04;
    if (this.collected) {
      this.opacity -= 0.03;
    }
  }

  draw() {
    if (this.opacity <= 0) return;
    let sp = worldToScreen(this.wx, this.wy);
    if (sp.x < -50 || sp.x > W + 50 || sp.y < -50 || sp.y > H + 50) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    let bob = Math.sin(this.bobPhase) * 5;

    // Glow
    ctx.shadowColor = '#f0c040';
    ctx.shadowBlur = 25;

    // Star shape
    ctx.fillStyle = 'rgba(240,192,64,0.3)';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      let angle = (i * Math.PI * 2 / 5) - Math.PI/2 + this.bobPhase * 0.5;
      let r = this.radius;
      let px = sp.x + Math.cos(angle) * r;
      let py = sp.y + bob + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);

      angle += Math.PI / 5;
      r = this.radius * 0.5;
      px = sp.x + Math.cos(angle) * r;
      py = sp.y + bob + Math.sin(angle) * r;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    sketchText(this.type.text, sp.x, sp.y + bob, 20, '#f0c040');

    ctx.restore();
  }

  getScreenPos() {
    return worldToScreen(this.wx, this.wy);
  }
}

// --- Grappling hook effect ---
class GrappleEffect {
  constructor(wx1, wy1, wx2, wy2) {
    this.wx1 = wx1; this.wy1 = wy1;
    this.wx2 = wx2; this.wy2 = wy2;
    this.progress = 0;
    this.speed = 0.08;
    this.done = false;
    this.hooked = false;
    this.retracting = false;
  }

  update() {
    if (!this.retracting) {
      this.progress += this.speed;
      if (this.progress >= 1 && !this.hooked) {
        this.hooked = true;
      }
      if (this.hooked) {
        this.retracting = true;
      }
    } else {
      this.progress -= this.speed * 0.7;
      if (this.progress <= 0) this.done = true;
    }
  }

  draw() {
    if (this.done) return;

    let s1 = worldToScreen(this.wx1, this.wy1);
    let s2 = worldToScreen(this.wx2, this.wy2);

    ctx.save();

    let currentX, currentY;
    if (!this.retracting) {
      currentX = s1.x + (s2.x - s1.x) * this.progress;
      currentY = s1.y + (s2.y - s1.y) * this.progress;
    } else {
      let endX = s1.x + (s2.x - s1.x) * (1 - this.progress);
      let endY = s1.y + (s2.y - s1.y) * (1 - this.progress);
      currentX = s1.x + (endX - s1.x) * 0.3;
      currentY = s1.y + (endY - s1.y) * 0.3;

      // Draw full line fading
      ctx.strokeStyle = `rgba(255,200,100,${this.progress * 0.5})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Hook line (solid)
    ctx.strokeStyle = 'rgba(255,200,100,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Hook tip
    if (!this.retracting || this.progress > 0.3) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle
      ctx.fillStyle = 'rgba(255,255,200,0.8)';
      for (let i = 0; i < 3; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = Math.random() * 10;
        ctx.beginPath();
        ctx.arc(currentX + Math.cos(angle)*dist, currentY + Math.sin(angle)*dist, 2, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// --- Particle system ---
class Particle {
  constructor(wx, wy, color) {
    this.wx = wx; this.wy = wy;
    this.vx = (Math.random()-0.5)*8;
    this.vy = (Math.random()-0.5)*8;
    this.life = 1;
    this.color = color || '#f0c040';
    this.size = 2 + Math.random()*4;
  }
  update() {
    this.wx += this.vx;
    this.wy += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= 0.02;
  }
  draw() {
    if (this.life <= 0) return;
    let sp = worldToScreen(this.wx, this.wy);
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, this.size * this.life, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Floating text ---
class FloatText {
  constructor(wx, wy, text, color) {
    this.wx = wx; this.wy = wy; this.text = text; this.color = color || '#f0c040';
    this.life = 1;
  }
  update() { this.wy -= 2; this.life -= 0.025; }
  draw() {
    if (this.life <= 0) return;
    let sp = worldToScreen(this.wx, this.wy);
    ctx.save();
    ctx.globalAlpha = this.life;
    sketchText(this.text, sp.x, sp.y, 32, this.color);
    ctx.restore();
  }
}

// --- Spaceship drawing (always at screen center) ---
function drawShip() {
  let sx = W / 2;
  let sy = H / 2;

  ctx.save();
  ctx.translate(sx, sy);
  if (game) ctx.rotate(game.angle + Math.PI / 2); // angle is 0=right, ship nose-up by default

  // Engine glow
  let engineGlow = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
  ctx.fillStyle = `rgba(90,200,250,${engineGlow})`;
  ctx.beginPath();
  ctx.arc(0, 18, 8, 0, Math.PI * 2);
  ctx.fill();

  // Flame when accelerating
  let isAccelerating = game && (keys['ArrowUp'] || keys['w']);
  if (isAccelerating) {
    let flameH = 15 + Math.random() * 10;
    ctx.fillStyle = 'rgba(90,200,250,0.4)';
    ctx.beginPath();
    ctx.moveTo(-6, 15);
    ctx.lineTo(0, 15 + flameH);
    ctx.lineTo(6, 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(200,230,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(-3, 15);
    ctx.lineTo(0, 15 + flameH * 0.6);
    ctx.lineTo(3, 15);
    ctx.closePath();
    ctx.fill();
  }

  // Ship body - pencil style
  ctx.strokeStyle = '#5ac8fa';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < 2; i++) {
    let ox = (Math.random()-0.5)*1;
    ctx.beginPath();
    ctx.moveTo(ox, -24);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-12, 16);
    ctx.lineTo(12, 16);
    ctx.lineTo(10, 4);
    ctx.lineTo(16, 8);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(90,200,250,0.1)';
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(-16, 8);
  ctx.lineTo(-10, 4);
  ctx.lineTo(-12, 16);
  ctx.lineTo(12, 16);
  ctx.lineTo(10, 4);
  ctx.lineTo(16, 8);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.strokeStyle = '#e8d5b7';
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    let ox = (Math.random()-0.5)*0.8;
    ctx.beginPath();
    ctx.ellipse(ox, -6, 5, 8, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(232,213,183,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, -6, 5, 8, 0, 0, Math.PI*2);
  ctx.fill();

  // Direction indicator (small triangle at nose)
  ctx.fillStyle = 'rgba(90,200,250,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-4, -24);
  ctx.lineTo(4, -24);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// --- Fog of war (camera-relative) ---
function drawFog() {
  if (!game) return;

  // Dark overlay beyond vision radius - drawn at screen center (ship position)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.arc(W/2, H/2, game.visionRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(5,5,15,0.95)';
  ctx.fill();
  ctx.restore();

  // Subtle edge glow around vision radius
  ctx.save();
  ctx.beginPath();
  ctx.arc(W/2, H/2, game.visionRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(90,200,250,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Inner glow
  let innerGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, game.visionRadius);
  innerGrad.addColorStop(0, 'rgba(90,200,250,0.03)');
  innerGrad.addColorStop(1, 'rgba(90,200,250,0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(W/2, H/2, game.visionRadius, 0, Math.PI * 2);
  ctx.fill();

  // Fade gradient at edges of vision
  let fadeGrad = ctx.createRadialGradient(W/2, H/2, game.visionRadius * 0.6, W/2, H/2, game.visionRadius);
  fadeGrad.addColorStop(0, 'rgba(10,10,26,0)');
  fadeGrad.addColorStop(1, 'rgba(10,10,26,0.5)');
  ctx.fillStyle = fadeGrad;
  ctx.beginPath();
  ctx.arc(W/2, H/2, game.visionRadius, 0, Math.PI * 2);
  ctx.fill();
}

// --- Check if point is in vision ---
function isInVision(wx, wy) {
  if (!game) return true;
  let dx = wx - shipWorld.x;
  let dy = wy - shipWorld.y;
  return Math.sqrt(dx*dx + dy*dy) < game.visionRadius;
}

// --- Health bar ---
function updateHealthBar() {
  if (!game) return;
  let maxHP = 10;
  let pct = Math.max(0, game.lives / maxHP * 100);
  document.getElementById('healthBarFill').style.width = pct + '%';

  let hearts = '';
  for (let i = 0; i < Math.min(game.lives, maxHP); i++) hearts += '❤️';
  document.getElementById('healthBarText').textContent = hearts || '💀';
}

// --- Game state ---
let game = null;
let animFrame;

function startGame() {
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('victoryScreen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('healthBarContainer').classList.remove('hidden');
  document.getElementById('controlsHint').classList.remove('hidden');

  // Reset ship and camera
  shipWorld.x = 0;
  shipWorld.y = 0;
  camera.x = 0;
  camera.y = 0;

  initLevel(1);

  if (animFrame) cancelAnimationFrame(animFrame);
  gameLoop();
}

function initLevel(level) {
  let targets = [4, 6, 10][level - 1];
  let allWords = wordSets[level - 1];
  let totalWordMeteors = targets + 8 + Math.floor(Math.random() * 5);
  let totalObstacleMeteors = 15 + level * 10;

  game = {
    level: level,
    caught: 0,
    target: targets,
    meteors: [],
    powerups: [],
    particles: [],
    floatTexts: [],
    grapples: [],
    score: 0,
    lives: 10,
    maxLives: 10,
    visionRadius: 250,
    baseVisionRadius: 250,
    correctNext: null,
    correctNextRu: '',
    transitioning: false,
    powerupChance: 0.35,
    time: 0,
    // Inertia physics
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // facing up
    acceleration: 0.15,
    rotationSpeed: 0.04,
    friction: 0.985,
    maxSpeed: 5,
    grappleCooldown: 0,
  };

  // Gigantic world - spread across huge area
  let minDist = 200;
  let maxDist = 3000 + level * 1000;

  let shuffled = shuffleArray([...allWords]);

  // Place word meteors (with emojis)
  for (let i = 0; i < totalWordMeteors; i++) {
    let angle = Math.random() * Math.PI * 2;
    let dist = minDist + Math.random() * (maxDist - minDist);
    let wx = Math.cos(angle) * dist;
    let wy = Math.sin(angle) * dist;

    // Avoid overlap with existing meteors
    let tooClose = false;
    for (let m of game.meteors) {
      let dx = m.wx - wx;
      let dy = m.wy - wy;
      if (Math.sqrt(dx*dx + dy*dy) < m.radius + 80) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) { i--; continue; }

    let wordPair = shuffled[i % shuffled.length];
    let emoji = wordPair.emoji || '🪨';
    game.meteors.push(new Meteor(wordPair.en, wx, wy, emoji, false));
  }

  // Place obstacle meteors (no emojis, just danger markers)
  for (let i = 0; i < totalObstacleMeteors; i++) {
    let angle = Math.random() * Math.PI * 2;
    let dist = minDist + Math.random() * (maxDist - minDist);
    let wx = Math.cos(angle) * dist;
    let wy = Math.sin(angle) * dist;

    // Avoid overlap with existing meteors
    let tooClose = false;
    for (let m of game.meteors) {
      let dx = m.wx - wx;
      let dy = m.wy - wy;
      if (Math.sqrt(dx*dx + dy*dy) < m.radius + 60) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) { i--; continue; }

    game.meteors.push(new Meteor('', wx, wy, '', true));
  }

  // Pick first target
  pickNextTarget();

  // Add initial powerups including health kits
  spawnPowerup();
  spawnPowerup();
  spawnHealthKit();
  spawnHealthKit();

  updateHUD();
  updateHealthBar();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickNextTarget() {
  if (!game) return;
  let uncaught = game.meteors.filter(m => !m.caught && !m.isObstacle);
  if (uncaught.length === 0) return;
  let targetMeteor = uncaught[Math.floor(Math.random() * uncaught.length)];
  game.correctNext = targetMeteor.text;

  // Find the Russian word for this English word
  let allWords = wordSets[game.level - 1];
  for (let pair of allWords) {
    if (pair.en === game.correctNext) {
      game.correctNextRu = pair.ru;
      break;
    }
  }
}

function spawnPowerup() {
  if (!game) return;
  if (Math.random() < game.powerupChance && game.meteors.length > 0) {
    let meteor = game.meteors[Math.floor(Math.random() * game.meteors.length)];
    let angle = Math.random() * Math.PI * 2;
    let dist = meteor.radius + 80;
    let wx = meteor.wx + Math.cos(angle) * dist;
    let wy = meteor.wy + Math.sin(angle) * dist;

    // Filter out health kits from regular powerups
    let regularPowerups = powerups.filter(p => p.text.includes('❤️‍🩹') === false);
    let type = regularPowerups[Math.floor(Math.random() * regularPowerups.length)];
    game.powerups.push(new PowerUp(wx, wy, type));
  }
}

function spawnHealthKit() {
  if (!game) return;
  let meteor = game.meteors[Math.floor(Math.random() * game.meteors.length)];
  let angle = Math.random() * Math.PI * 2;
  let dist = meteor.radius + 80;
  let wx = meteor.wx + Math.cos(angle) * dist;
  let wy = meteor.wy + Math.sin(angle) * dist;

  let healthKitType = powerups.find(p => p.text.includes('❤️‍🩹'));
  if (healthKitType) {
    game.powerups.push(new PowerUp(wx, wy, healthKitType));
  }
}

function updateHUD() {
  if (!game) return;
  let levelNames = ['', 'Level 1', 'Level 2', 'Level 3'];
  let levelClasses = ['', 'level-1', 'level-2', 'level-3'];
  let lt = document.getElementById('levelText');
  lt.textContent = levelNames[game.level];
  lt.className = 'level-badge ' + levelClasses[game.level];

  document.getElementById('scoreText').textContent = game.score;

  let dots = document.getElementById('progressDots');
  dots.innerHTML = '';
  for (let i = 0; i < game.target; i++) {
    let d = document.createElement('div');
    d.className = 'dot' + (i < game.caught ? ' filled' : '');
    dots.appendChild(d);
  }
}

function nextLevel() {
  if (game.level >= 3) {
    game.transitioning = true;
    setTimeout(() => {
      document.getElementById('hud').classList.add('hidden');
      document.getElementById('healthBarContainer').classList.add('hidden');
      document.getElementById('controlsHint').classList.add('hidden');
      document.getElementById('grappleHint').style.opacity = '0';
      document.getElementById('victoryScreen').classList.remove('hidden');
      game = null;
    }, 1000);
    return;
  }

  game.transitioning = true;
  game.level++;
  game.caught = 0;
  game.target = [4, 6, 10][game.level - 1];
  game.visionRadius = game.baseVisionRadius;
  game.meteors = [];
  game.powerups = [];
  game.grapples = [];
  game.vx = 0;
  game.vy = 0;

  setTimeout(() => {
    initLevel(game.level);
    game.transitioning = false;
  }, 800);
}

function showPowerupMsg(text) {
  let el = document.getElementById('powerupMsg');
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function triggerGameOver() {
  game.transitioning = true;
  document.getElementById('finalScore').textContent = game.score;
  setTimeout(() => {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('healthBarContainer').classList.add('hidden');
    document.getElementById('controlsHint').classList.add('hidden');
    document.getElementById('grappleHint').style.opacity = '0';
    document.getElementById('gameOverScreen').classList.remove('hidden');
    game = null;
  }, 500);
}

// --- Launch grapple with SPACE ---
function tryLaunchGrapple() {
  if (!game || game.transitioning) return;
  if (game.grappleCooldown > 0) return;

  // Find nearest uncaught correct meteor within range
  let best = null;
  let bestDist = Infinity;

  for (let m of game.meteors) {
    if (m.caught || m.text !== game.correctNext) continue;
    let dx = m.wx - shipWorld.x;
    let dy = m.wy - shipWorld.y;
    let dist = Math.sqrt(dx*dx + dy*dy);

    // Must be in vision radius to target
    if (dist > game.visionRadius * 1.2) continue;

    if (dist < bestDist) {
      best = m;
      bestDist = dist;
    }
  }

  if (!best) return;

  // Launch grapple!
  best.caught = true;
  game.grapples.push(new GrappleEffect(shipWorld.x, shipWorld.y, best.wx, best.wy));
  game.grappleCooldown = 30;

  game.caught++;
  game.score += 10;

  // Particles on hook arrival
  for (let i = 0; i < 25; i++) {
    game.particles.push(new Particle(best.wx, best.wy, '#f0c040'));
  }
  game.floatTexts.push(new FloatText(best.wx, best.wy - 40, '+10', '#5ac8fa'));

  // Check level complete
  if (game.caught >= game.target) {
    setTimeout(() => nextLevel(), 1200);
  } else {
    pickNextTarget();
  }
  updateHUD();
}

// --- Main loop ---
function gameLoop() {
  animFrame = requestAnimationFrame(gameLoop);
  if (!game || game.transitioning) return;

  game.time++;
  if (game.grappleCooldown > 0) game.grappleCooldown--;

  // Clear with dark space background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  drawStars(Date.now());

  // --- Inertia physics (rotation-based) ---
  if (keys['ArrowLeft'] || keys['a']) game.angle -= game.rotationSpeed;
  if (keys['ArrowRight'] || keys['d']) game.angle += game.rotationSpeed;

  // Up = accelerate in facing direction, Down = brake/reverse
  if (keys['ArrowUp'] || keys['w']) {
    game.vx += Math.cos(game.angle) * game.acceleration;
    game.vy += Math.sin(game.angle) * game.acceleration;
  }
  if (keys['ArrowDown'] || keys['s']) {
    // Brake: reduce speed in current direction
    let speed = Math.sqrt(game.vx * game.vx + game.vy * game.vy);
    if (speed > 0.1) {
      game.vx -= (game.vx / speed) * game.acceleration * 1.5;
      game.vy -= (game.vy / speed) * game.acceleration * 1.5;
    }
  }

  // Mouse/touch drag acceleration + rotation toward drag direction
  if (mouseDown) {
    let dx = mouseX - mouseStartX;
    let dy = mouseY - mouseStartY;
    let dragDist = Math.sqrt(dx * dx + dy * dy);
    if (dragDist > 5) {
      let pullAngle = Math.atan2(dy, dx);
      // Rotate ship toward drag direction (smoothly)
      let targetAngle = pullAngle;
      let angleDiff = targetAngle - game.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      game.angle += angleDiff * 0.15;

      let accelStrength = Math.min(dragDist / 100, 1) * game.acceleration * 1.5;
      game.vx += Math.cos(pullAngle) * accelStrength;
      game.vy += Math.sin(pullAngle) * accelStrength;
    }
  }

  // Friction
  game.vx *= game.friction;
  game.vy *= game.friction;

  // Speed cap
  let spd = Math.sqrt(game.vx * game.vx + game.vy * game.vy);
  if (spd > game.maxSpeed) {
    game.vx = (game.vx / spd) * game.maxSpeed;
    game.vy = (game.vy / spd) * game.maxSpeed;
  }

  // Apply velocity to ship world position
  shipWorld.x += game.vx;
  shipWorld.y += game.vy;

  // Camera follows ship (ship stays at center)
  camera.x = shipWorld.x;
  camera.y = shipWorld.y;

  // --- Meteor collision (push ship out) ---
  for (let m of game.meteors) {
    if (m.caught) continue;
    let dx = shipWorld.x - m.wx;
    let dy = shipWorld.y - m.wy;
    let dist = Math.sqrt(dx*dx + dy*dy);
    let minDist = m.radius + SHIP_RADIUS;

    if (dist < minDist && dist > 0) {
      // Push ship out
      let overlap = minDist - dist;
      let nx = dx / dist;
      let ny = dy / dist;
      shipWorld.x += nx * overlap;
      shipWorld.y += ny * overlap;

      // Bounce: reflect velocity component toward meteor
      let dot = game.vx * nx + game.vy * ny;
      if (dot < 0) {
        game.vx -= 2 * dot * nx * 0.5;
        game.vy -= 2 * dot * ny * 0.5;
      }

      // Wrong meteor contact - penalty
      if (m.text !== game.correctNext) {
        game.score = Math.max(0, game.score - 2);
        game.lives--;
        updateHealthBar();

        for (let i = 0; i < 15; i++) {
          game.particles.push(new Particle(m.wx, m.wy, '#ff4444'));
        }
        game.floatTexts.push(new FloatText(m.wx, m.wy - 40, '-2', '#ff6b6b'));

        // Red flash
        ctx.fillStyle = 'rgba(255,50,50,0.1)';
        ctx.fillRect(0, 0, W, H);

        // Check game over
        if (game.lives <= 0) {
          triggerGameOver();
          return;
        }
      }
    }
  }

  // --- Update meteors ---
  for (let m of game.meteors) {
    m.update(Date.now());
  }

  // --- Powerups ---
  for (let p of game.powerups) {
    p.update();
  }

  // Collision: ship vs powerups
  for (let p of game.powerups) {
    if (p.collected) continue;
    let dx = shipWorld.x - p.wx;
    let dy = shipWorld.y - p.wy;
    let dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < p.radius + SHIP_RADIUS) {
      p.collected = true;
      p.type.effect(game);
      showPowerupMsg(p.type.text);

      for (let i = 0; i < 25; i++) {
        game.particles.push(new Particle(p.wx, p.wy, '#f0c040'));
      }
      game.floatTexts.push(new FloatText(p.wx, p.wy - 30, 'Power-up!', '#f0c040'));
    }
  }

  // --- Grapples ---
  for (let g of game.grapples) {
    g.update();
  }
  game.grapples = game.grapples.filter(g => !g.done);

  // --- Particles ---
  for (let p of game.particles) p.update();
  game.particles = game.particles.filter(p => p.life > 0);

  // --- Float texts ---
  for (let f of game.floatTexts) f.update();
  game.floatTexts = game.floatTexts.filter(f => f.life > 0);

  // --- Spawn powerups periodically ---
  if (game.time % 400 === 0) {
    spawnPowerup();
    if (Math.random() < 0.4) spawnHealthKit();
  }

  // --- Grapple hint ---
  let grappleHintEl = document.getElementById('grappleHint');
  if (game.correctNext && game.grappleCooldown <= 0) {
    let nearCorrect = false;
    for (let m of game.meteors) {
      if (m.caught || m.text !== game.correctNext) continue;
      let dx = m.wx - shipWorld.x;
      let dy = m.wy - shipWorld.y;
      if (Math.sqrt(dx*dx + dy*dy) < game.visionRadius * 1.2) {
        nearCorrect = true;
        break;
      }
    }
    grappleHintEl.style.opacity = nearCorrect ? '1' : '0';
  } else {
    grappleHintEl.style.opacity = '0';
  }

  // --- Draw order (screen-space) ---

  // Meteors (only visible if in vision radius)
  for (let m of game.meteors) {
    if (isInVision(m.wx, m.wy)) {
      m.draw();
    }
  }

  // Powerups
  for (let p of game.powerups) {
    if (!p.collected && isInVision(p.wx, p.wy)) {
      p.draw();
    }
  }

  // Grapples
  for (let g of game.grapples) {
    g.draw();
  }

  // Particles
  for (let p of game.particles) p.draw();

  // Float texts
  for (let f of game.floatTexts) f.draw();

  // Ship (always at screen center)
  drawShip();

  // Fog overlay (on top of everything)
  drawFog();

  // Show current target hint near ship
  if (game.correctNext) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    sketchText('Find: ' + game.correctNext, W/2, H/2 - 50, 24, '#5ac8fa');
    ctx.restore();
  }

  // Direction indicator to nearest correct meteor
  if (game.correctNext && !game.grapples.length) {
    let nearest = null;
    let nearestDist = Infinity;
    for (let m of game.meteors) {
      if (m.caught || m.text !== game.correctNext) continue;
      let dx = m.wx - shipWorld.x;
      let dy = m.wy - shipWorld.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < nearestDist) {
        nearest = m;
        nearestDist = dist;
      }
    }

    if (nearest && !isInVision(nearest.wx, nearest.wy)) {
      let sp = worldToScreen(nearest.wx, nearest.wy);
      // Draw arc pointing toward it at the edge of vision
      let angle = Math.atan2(sp.y - H/2, sp.x - W/2);

      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#5ac8fa';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Arc spans ~180 degrees for rough direction indication, drawn at vision radius
      let arcSpan = Math.PI;
      ctx.beginPath();
      ctx.arc(W/2, H/2, game.visionRadius, angle - arcSpan/2, angle + arcSpan/2);
      ctx.stroke();

      ctx.restore();
    }
  }
}

function goToMenu() {
  document.getElementById('victoryScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('healthBarContainer').classList.add('hidden');
  document.getElementById('controlsHint').classList.add('hidden');
  document.getElementById('grappleHint').style.opacity = '0';
  document.getElementById('startScreen').classList.remove('hidden');
  game = null;

  // Draw space background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);
  drawStars(Date.now());
}

// --- Space key handler for grapple ---
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    tryLaunchGrapple();
  }
});

// Initial background
ctx.fillStyle = '#0a0a1a';
ctx.fillRect(0, 0, W, H);
drawStars(Date.now());
