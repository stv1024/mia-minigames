// =============================================
//  幻兽帕鲁 2D  — Palworld 2D Prototype
// =============================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 900
const H = canvas.height;  // 600
const TILE = 32;
const WORLD_W = 64;
const WORLD_H = 54;

// ── Input ──────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  const prevent = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                   'KeyZ','KeyX','KeyC','Digit1','Digit2','Digit3',
                   'Digit4','Digit5','Digit6'];
  if (prevent.includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Pal Definitions ───────────────────────
const PAL_DEFS = {
  lamball:   { name: '兰兔羊', emoji: '🐑', color: '#f0e0c8', accent: '#c8a46e', size: 17, maxHp: 40, atk: 6,  spd: 65,  catchBase: 0.60, behavior: 'docile'     },
  cattiva:   { name: '猫咪伙伴', emoji: '🐱', color: '#ff9966', accent: '#cc5533', size: 16, maxHp: 32, atk: 10, spd: 95,  catchBase: 0.50, behavior: 'neutral'    },
  foxparks:  { name: '火狐',   emoji: '🦊', color: '#ff4422', accent: '#aa2200', size: 17, maxHp: 26, atk: 16, spd: 115, catchBase: 0.38, behavior: 'aggressive' },
  pengullet: { name: '企鹅君', emoji: '🐧', color: '#55aaff', accent: '#2255bb', size: 19, maxHp: 52, atk: 8,  spd: 55,  catchBase: 0.55, behavior: 'docile'     },
  chikipi:   { name: '小黄鸡', emoji: '🐤', color: '#ffe044', accent: '#bb8800', size: 14, maxHp: 22, atk: 5,  spd: 125, catchBase: 0.72, behavior: 'docile'     },
  tanzee:    { name: '坦兹',   emoji: '🐒', color: '#55cc55', accent: '#1a8822', size: 16, maxHp: 36, atk: 13, spd: 105, catchBase: 0.44, behavior: 'aggressive' },
  lifmunk:   { name: '里夫蒙克', emoji: '🐿', color: '#88dd44', accent: '#449911', size: 15, maxHp: 28, atk: 9,  spd: 110, catchBase: 0.48, behavior: 'neutral'  },
};

const PAL_KEYS = Object.keys(PAL_DEFS);

// ── World Generation ──────────────────────
const TILE_GRASS   = 0;
const TILE_TREE    = 1;
const TILE_WATER   = 2;
const TILE_FLOWER  = 3;
const TILE_SAND    = 4;
const TILE_ROCK    = 5;

function generateWorld() {
  // Simple noise-ish via layered random
  const map = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(TILE_GRASS));

  // Border walls
  for (let y = 0; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++)
      if (x === 0 || y === 0 || x === WORLD_W - 1 || y === WORLD_H - 1)
        map[y][x] = TILE_TREE;

  // Scatter features
  for (let y = 1; y < WORLD_H - 1; y++) {
    for (let x = 1; x < WORLD_W - 1; x++) {
      const r = Math.random();
      if      (r < 0.085) map[y][x] = TILE_TREE;
      else if (r < 0.115) map[y][x] = TILE_FLOWER;
      else if (r < 0.130) map[y][x] = TILE_ROCK;
    }
  }

  // Lake
  const lx = Math.floor(WORLD_W * 0.62), ly = Math.floor(WORLD_H * 0.38);
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -5; dx <= 5; dx++)
      if (dx*dx/25 + dy*dy/16 <= 1 && inBounds(lx+dx, ly+dy))
        map[ly+dy][lx+dx] = TILE_WATER;

  // Sandy shore around lake
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -7; dx <= 7; dx++) {
      const tx = lx+dx, ty = ly+dy;
      if (inBounds(tx, ty) && map[ty][tx] === TILE_GRASS && dx*dx/49 + dy*dy/36 <= 1)
        map[ty][tx] = TILE_SAND;
    }

  // Second small pond
  const lx2 = Math.floor(WORLD_W * 0.28), ly2 = Math.floor(WORLD_H * 0.7);
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -3; dx <= 3; dx++)
      if (dx*dx/9 + dy*dy/4 <= 1 && inBounds(lx2+dx, ly2+dy))
        map[ly2+dy][lx2+dx] = TILE_WATER;

  return map;
}

function inBounds(tx, ty) {
  return tx >= 0 && ty >= 0 && tx < WORLD_W && ty < WORLD_H;
}

const WORLD = generateWorld();

function isSolid(tx, ty) {
  if (!inBounds(tx, ty)) return true;
  const t = WORLD[ty][tx];
  return t === TILE_TREE || t === TILE_WATER || t === TILE_ROCK;
}

function canMoveTo(x, y, radius) {
  const m = radius * 0.65;
  return !isSolid(Math.floor((x - m) / TILE), Math.floor((y - m) / TILE)) &&
         !isSolid(Math.floor((x + m) / TILE), Math.floor((y - m) / TILE)) &&
         !isSolid(Math.floor((x - m) / TILE), Math.floor((y + m) / TILE)) &&
         !isSolid(Math.floor((x + m) / TILE), Math.floor((y + m) / TILE));
}

function randomFreePos(size) {
  for (let i = 0; i < 2000; i++) {
    const x = (1 + Math.random() * (WORLD_W - 2)) * TILE;
    const y = (1 + Math.random() * (WORLD_H - 2)) * TILE;
    if (canMoveTo(x, y, size)) return { x, y };
  }
  return { x: WORLD_W * TILE / 2, y: WORLD_H * TILE / 2 };
}

// ── Player ────────────────────────────────
const startPos = randomFreePos(14);
const player = {
  x: startPos.x, y: startPos.y,
  size: 14,
  hp: 100, maxHp: 100,
  speed: 160,
  facing: 'down',
  animTimer: 0,
  attackCooldown: 0,
  throwCooldown: 0,
  invincible: 0,      // frames of invincibility after being hit
  caughtPals: [],     // [{type, name, color, accent, size, hp, maxHp, atk, spd}]
};

// ── Wild Pals ─────────────────────────────
let palIdCounter = 0;

function createWildPal(type, x, y) {
  const def = PAL_DEFS[type];
  return {
    id: palIdCounter++,
    type, ...def,
    x, y,
    hp: def.maxHp,
    state: 'wander',    // wander | flee | attack | dead | caught
    wanderTarget: null,
    idleTimer: Math.random() * 3,
    attackTimer: 1 + Math.random(),
    bobTimer: Math.random() * Math.PI * 2,
    alpha: 1,
    catchShake: 0,      // visual shake when hit by sphere
  };
}

let wildPals = [];

function spawnInitialPals() {
  const count = 38;
  for (let i = 0; i < count; i++) {
    const type = PAL_KEYS[Math.floor(Math.random() * PAL_KEYS.length)];
    const def = PAL_DEFS[type];
    const pos = randomFreePos(def.size);
    wildPals.push(createWildPal(type, pos.x, pos.y));
  }
}
spawnInitialPals();

// ── Deployed Pal ──────────────────────────
let deployedPal = null;   // null or { ...palData, sourceIndex, attackTimer, bobTimer }

// ── Projectiles (Pal Spheres) ─────────────
let projectiles = [];   // { x, y, vx, vy, target, elapsed, duration }

// ── Particles ─────────────────────────────
let particles = [];

function emitParticles(x, y, color, count = 10, speed = 120) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.5 + Math.random() * 0.8);
    particles.push({
      x, y, color,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40,
      size: 2.5 + Math.random() * 3,
      life: 0.35 + Math.random() * 0.4,
      maxLife: 0,
    });
    particles[particles.length - 1].maxLife = particles[particles.length - 1].life;
  }
}

// ── Floating Texts ────────────────────────
let floats = [];   // { x, y, text, color, life }

function addFloat(x, y, text, color = '#fff') {
  floats.push({ x, y, text, color, life: 1.3, vy: -50 });
}

// ── Message Log ───────────────────────────
let messages = [];  // { text, color, life }

function log(text, color = '#eeeeee') {
  messages.unshift({ text, color, life: 4.0 });
  if (messages.length > 6) messages.pop();
}

// ── Respawn Queue ─────────────────────────
let respawnQueue = [];  // { timer, type }

// ── Camera ────────────────────────────────
const cam = { x: 0, y: 0 };

// ── Helpers ───────────────────────────────
function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}
function dist(a, b) { return Math.sqrt(dist2(a, b)); }

function nearest(origin, list, maxDist = Infinity) {
  let best = null, bestD = maxDist * maxDist;
  for (const e of list) {
    const d = dist2(origin, e);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

// ── UPDATE ────────────────────────────────
let lastTimestamp = 0;
let gameTime = 0;

function update(dt) {
  gameTime += dt;

  // ── Player movement
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
  if (dx < 0) player.facing = 'left';
  else if (dx > 0) player.facing = 'right';
  else if (dy < 0) player.facing = 'up';
  else if (dy > 0) player.facing = 'down';

  const nx = player.x + dx * player.speed * dt;
  const ny = player.y + dy * player.speed * dt;
  if (canMoveTo(nx, player.y, player.size)) player.x = nx;
  if (canMoveTo(player.x, ny, player.size)) player.y = ny;

  player.animTimer += dt;
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.throwCooldown  = Math.max(0, player.throwCooldown  - dt);
  player.invincible     = Math.max(0, player.invincible     - dt);

  // Camera
  cam.x = Math.max(0, Math.min(WORLD_W * TILE - W, player.x - W / 2));
  cam.y = Math.max(0, Math.min(WORLD_H * TILE - H, player.y - H / 2));

  // ── Find nearest wild pal (for targeting)
  const aliveWild = wildPals.filter(p => p.state !== 'dead' && p.state !== 'caught');
  const nearPal = nearest(player, aliveWild, 220);
  const nearDist = nearPal ? dist(player, nearPal) : Infinity;

  // ── Attack (Z or Space)
  if ((keys['KeyZ'] || keys['Space']) && player.attackCooldown <= 0) {
    player.attackCooldown = 0.38;
    if (nearPal && nearDist < 64) {
      const dmg = 12 + Math.floor(Math.random() * 10);
      nearPal.hp = Math.max(0, nearPal.hp - dmg);
      addFloat(nearPal.x, nearPal.y - 24, `-${dmg}`, '#ff5544');
      emitParticles(nearPal.x, nearPal.y, '#ff6644', 8);
      nearPal.catchShake = 0.25;

      if (nearPal.hp <= 0) {
        nearPal.state = 'dead';
        log(`${nearPal.name} 倒下了。`, '#ff9966');
        scheduleRespawn(nearPal.type);
      } else {
        nearPal.state = 'flee';
      }
    } else {
      // Swing miss visual
      const fx = player.x + (player.facing === 'right' ? 44 : player.facing === 'left' ? -44 : 0);
      const fy = player.y + (player.facing === 'down' ? 44 : player.facing === 'up' ? -44 : 0);
      emitParticles(fx, fy, '#aaaaaa', 5, 80);
    }
  }

  // ── Throw Pal Sphere (X)
  if (keys['KeyX'] && player.throwCooldown <= 0) {
    player.throwCooldown = 0.85;
    if (nearPal && nearDist < 220) {
      const duration = nearDist / 350 + 0.05;
      projectiles.push({
        x: player.x, y: player.y,
        vx: (nearPal.x - player.x) / duration,
        vy: (nearPal.y - player.y) / duration,
        target: nearPal,
        elapsed: 0, duration,
      });
      log('投出了帕鲁球！', '#88ddff');
    } else {
      log('附近没有帕鲁...', '#888888');
    }
  }

  // ── Deploy/recall pals (1–6)
  for (let i = 0; i < Math.min(player.caughtPals.length, 6); i++) {
    if (keys[`Digit${i + 1}`]) {
      keys[`Digit${i + 1}`] = false;
      if (deployedPal && deployedPal.sourceIndex === i) {
        deployedPal = null;
        log(`召回了 ${player.caughtPals[i].name}`, '#aaffaa');
      } else {
        const pd = player.caughtPals[i];
        deployedPal = { ...pd, sourceIndex: i, x: player.x + 45, y: player.y,
                        bobTimer: 0, attackTimer: 1.0 };
        log(`派出了 ${pd.name}！`, '#88ffaa');
      }
    }
  }

  // ── Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.elapsed += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const arrived = p.elapsed >= p.duration || dist2(p, p.target) < 22 * 22;
    if (arrived) {
      projectiles.splice(i, 1);
      const pal = p.target;
      if (pal.state === 'dead' || pal.state === 'caught') continue;

      // Catch formula: base rate boosted when HP is low
      const hpFrac = pal.hp / pal.maxHp;
      const catchChance = pal.catchBase * (1.1 - hpFrac * 0.8);

      if (Math.random() < catchChance) {
        pal.state = 'caught';
        emitParticles(pal.x, pal.y, '#ffdd44', 22, 160);
        emitParticles(pal.x, pal.y, '#5588ff', 12, 100);
        player.caughtPals.push({
          type: pal.type, name: pal.name, color: pal.color, accent: pal.accent,
          size: pal.size, hp: Math.ceil(pal.maxHp * 0.6), maxHp: pal.maxHp,
          atk: pal.atk, spd: pal.spd, catchBase: pal.catchBase,
        });
        addFloat(pal.x, pal.y - 36, `★ 捕获！`, '#ffdd44');
        log(`★ 成功捕获了 ${pal.name}！`, '#ffdd44');
        scheduleRespawn(pal.type);
      } else {
        emitParticles(pal.x, pal.y, '#5588ff', 10, 100);
        addFloat(pal.x, pal.y - 24, '逃脱', '#ff6666');
        log(`${pal.name} 逃脱了！`, '#ff6666');
        pal.state = 'flee';
        pal.catchShake = 0.4;
      }
    }
  }

  // ── Update wild pals
  for (const pal of wildPals) {
    pal.bobTimer += dt * 2.2;
    pal.catchShake = Math.max(0, pal.catchShake - dt);

    if (pal.state === 'dead' || pal.state === 'caught') {
      pal.alpha = Math.max(0, pal.alpha - dt * 2);
      continue;
    }

    const dPlayer = dist(player, pal);

    // State transitions
    if (pal.state === 'wander') {
      if (dPlayer < 130) {
        pal.state = pal.behavior === 'aggressive' ? 'attack' : 'flee';
      }
    }
    if (pal.state === 'flee' && dPlayer > 210) pal.state = 'wander';
    if (pal.state === 'attack' && dPlayer > 320) pal.state = 'wander';
    if (pal.hp < pal.maxHp * 0.25 && pal.state === 'attack') pal.state = 'flee';

    // State behaviors
    if (pal.state === 'wander') {
      pal.idleTimer -= dt;
      if (pal.idleTimer <= 0) {
        // Pick a new wander target
        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 100;
        pal.wanderTarget = {
          x: Math.max(TILE * 1.5, Math.min((WORLD_W - 1.5) * TILE, pal.x + Math.cos(angle) * radius)),
          y: Math.max(TILE * 1.5, Math.min((WORLD_H - 1.5) * TILE, pal.y + Math.sin(angle) * radius)),
        };
        pal.idleTimer = 1.5 + Math.random() * 3;
      }
      if (pal.wanderTarget) {
        moveToward(pal, pal.wanderTarget, pal.spd * 0.38, dt);
      }
    }

    if (pal.state === 'flee') {
      // Move away from player
      const angle = Math.atan2(pal.y - player.y, pal.x - player.x);
      const tx = pal.x + Math.cos(angle) * 80;
      const ty = pal.y + Math.sin(angle) * 80;
      moveToward(pal, { x: tx, y: ty }, pal.spd, dt);
    }

    if (pal.state === 'attack') {
      pal.attackTimer -= dt;
      if (dPlayer > 40) {
        moveToward(pal, player, pal.spd * 0.9, dt);
      } else if (pal.attackTimer <= 0) {
        pal.attackTimer = 1.4 + Math.random() * 0.6;
        if (player.invincible <= 0) {
          const dmg = pal.atk + Math.floor(Math.random() * 4);
          player.hp = Math.max(0, player.hp - dmg);
          player.invincible = 0.5;
          addFloat(player.x, player.y - 28, `-${dmg}`, '#ff2222');
          emitParticles(player.x, player.y, '#ff2222', 6);
        }
      }
    }
  }

  // ── Clean dead/caught pals after fade
  wildPals = wildPals.filter(p => p.alpha > 0);

  // ── Respawn
  for (let i = respawnQueue.length - 1; i >= 0; i--) {
    respawnQueue[i].timer -= dt;
    if (respawnQueue[i].timer <= 0) {
      const type = respawnQueue[i].type;
      respawnQueue.splice(i, 1);
      const def = PAL_DEFS[type];
      const pos = randomFreePos(def.size);
      wildPals.push(createWildPal(type, pos.x, pos.y));
    }
  }

  // ── Deployed pal AI
  if (deployedPal) {
    deployedPal.bobTimer += dt * 2.2;
    const aliveWild2 = wildPals.filter(p => p.state !== 'dead' && p.state !== 'caught');
    const palTarget = nearest(deployedPal, aliveWild2, 200);

    if (palTarget) {
      const dT = dist(deployedPal, palTarget);
      if (dT > 38) {
        moveToward(deployedPal, palTarget, deployedPal.spd, dt);
      } else {
        deployedPal.attackTimer -= dt;
        if (deployedPal.attackTimer <= 0) {
          deployedPal.attackTimer = 1.1;
          const dmg = deployedPal.atk + Math.floor(Math.random() * 5);
          palTarget.hp = Math.max(0, palTarget.hp - dmg);
          addFloat(palTarget.x, palTarget.y - 22, `-${dmg}`, '#ffaa44');
          emitParticles(palTarget.x, palTarget.y, '#ffaa44', 7);
          if (palTarget.hp <= 0) {
            palTarget.state = 'dead';
            log(`${deployedPal.name} 击倒了 ${palTarget.name}！`, '#aaffaa');
            scheduleRespawn(palTarget.type);
          } else {
            palTarget.state = 'flee';
          }
        }
      }
    } else {
      // Follow player when no enemies nearby
      const dp = dist(deployedPal, player);
      if (dp > 55) moveToward(deployedPal, player, deployedPal.spd * 1.4, dt);
    }
  }

  // ── Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 140 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Floats & messages
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].y += floats[i].vy * dt;
    floats[i].life -= dt;
    if (floats[i].life <= 0) floats.splice(i, 1);
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    messages[i].life -= dt;
    if (messages[i].life <= 0) messages.splice(i, 1);
  }

  // ── Player death (respawn)
  if (player.hp <= 0) {
    player.hp = player.maxHp;
    player.x = startPos.x;
    player.y = startPos.y;
    log('你被击倒了！回到出生点。', '#ff4444');
  }
}

function moveToward(entity, target, speed, dt) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = entity.x + (dx / d) * speed * dt;
  const ny = entity.y + (dy / d) * speed * dt;
  if (canMoveTo(nx, entity.y, entity.size)) entity.x = nx;
  if (canMoveTo(entity.x, ny, entity.size)) entity.y = ny;
}

function scheduleRespawn(type) {
  respawnQueue.push({ type, timer: 14 + Math.random() * 8 });
}

// ── DRAW ──────────────────────────────────

const TILE_BASE_COLORS = ['#4e8832','#2a5a18','#2e66cc','#5a9c32','#c0a05a','#7a7a7a'];
const treeColorPool = ['#1a4a0a', '#265c12', '#1f521a'];

function drawWorld() {
  const tx0 = Math.max(0, Math.floor(cam.x / TILE));
  const tx1 = Math.min(WORLD_W, Math.ceil((cam.x + W) / TILE) + 1);
  const ty0 = Math.max(0, Math.floor(cam.y / TILE));
  const ty1 = Math.min(WORLD_H, Math.ceil((cam.y + H) / TILE) + 1);

  for (let ty = ty0; ty < ty1; ty++) {
    for (let tx = tx0; tx < tx1; tx++) {
      const tile = WORLD[ty][tx];
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;

      ctx.fillStyle = TILE_BASE_COLORS[tile] ?? '#4e8832';
      ctx.fillRect(sx, sy, TILE, TILE);

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy, TILE, TILE);

      if (tile === TILE_TREE) {
        // Trunk
        ctx.fillStyle = '#5c3a20';
        ctx.fillRect(sx + 11, sy + 18, 10, 14);
        // Foliage
        ctx.fillStyle = treeColorPool[(tx * 5 + ty * 11) % 3];
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 13, 13, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(150,220,80,0.18)';
        ctx.beginPath();
        ctx.arc(sx + 13, sy + 10, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === TILE_WATER) {
        const wave = Math.sin(gameTime * 1.6 + tx * 0.9 + ty * 0.7) * 0.12 + 0.18;
        ctx.fillStyle = `rgba(120,190,255,${wave})`;
        ctx.fillRect(sx, sy, TILE, TILE);
      } else if (tile === TILE_FLOWER) {
        const fcs = ['#ff6699','#ffee44','#ff99cc','#ffffff','#ff8844'];
        ctx.fillStyle = fcs[(tx * 3 + ty * 7) % fcs.length];
        ctx.beginPath(); ctx.arc(sx + 8, sy + 9, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + 22, sy + 22, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#88ff44';
        ctx.fillRect(sx + 14, sy + 14, 2, 8);
      } else if (tile === TILE_ROCK) {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 20, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.ellipse(sx + 13, sy + 17, 7, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPalEntity(pal, sx, sy, glowing = false) {
  ctx.save();
  ctx.globalAlpha = pal.alpha ?? 1;

  const bob = Math.sin(pal.bobTimer) * 2.2;
  const shake = pal.catchShake > 0 ? Math.sin(pal.catchShake * 60) * 4 : 0;
  const cy = sy + bob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(sx + shake, sy + pal.size - 1, pal.size * 0.75, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (glowing) {
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 14;
  }

  // Body
  ctx.fillStyle = pal.color;
  ctx.beginPath();
  ctx.arc(sx + shake, cy, pal.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Ears (two triangles, small)
  ctx.fillStyle = pal.color;
  ctx.beginPath();
  ctx.moveTo(sx + shake - pal.size * 0.55, cy - pal.size * 0.65);
  ctx.lineTo(sx + shake - pal.size * 0.2,  cy - pal.size * 1.15);
  ctx.lineTo(sx + shake - pal.size * 0.05, cy - pal.size * 0.65);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + shake + pal.size * 0.05, cy - pal.size * 0.65);
  ctx.lineTo(sx + shake + pal.size * 0.2,  cy - pal.size * 1.15);
  ctx.lineTo(sx + shake + pal.size * 0.55, cy - pal.size * 0.65);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(sx + shake - pal.size * 0.3, cy - pal.size * 0.18, 2.8, 0, Math.PI * 2);
  ctx.arc(sx + shake + pal.size * 0.3, cy - pal.size * 0.18, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(sx + shake - pal.size * 0.28, cy - pal.size * 0.22, 1.2, 0, Math.PI * 2);
  ctx.arc(sx + shake + pal.size * 0.32, cy - pal.size * 0.22, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // HP bar (when damaged)
  if (pal.hp < pal.maxHp) {
    const bw = pal.size * 2.6, bh = 5;
    const bx = sx - bw / 2 + shake, by = cy - pal.size - 14;
    ctx.fillStyle = '#300'; ctx.fillRect(bx, by, bw, bh);
    const pct = pal.hp / pal.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#cccc44' : '#cc4444';
    ctx.fillRect(bx, by, bw * pct, bh);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  }

  // State icon
  if (pal.state === 'attack') {
    ctx.fillStyle = '#ff3333';
    ctx.font = `bold ${Math.floor(pal.size * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('!', sx + shake, cy - pal.size - 16);
  }

  ctx.restore();
}

function drawPlayer() {
  const sx = player.x - cam.x;
  const sy = player.y - cam.y;
  const moving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                 keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];
  const bob = moving ? Math.sin(player.animTimer * 9) * 2.5 : 0;
  const blink = player.invincible > 0 && Math.floor(gameTime * 12) % 2 === 0;
  if (blink) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 14, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#2255aa';
  const legOff = moving ? Math.sin(player.animTimer * 9) * 4 : 0;
  ctx.fillRect(sx - 7, sy + 4 + bob, 5, 12 + legOff);
  ctx.fillRect(sx + 2, sy + 4 + bob, 5, 12 - legOff);

  // Body
  ctx.fillStyle = '#e84420';
  ctx.beginPath();
  ctx.roundRect(sx - 9, sy - 9 + bob, 18, 16, 3);
  ctx.fill();

  // Belt
  ctx.fillStyle = '#882200';
  ctx.fillRect(sx - 9, sy + 4 + bob, 18, 3);

  // Head
  ctx.fillStyle = '#ffc899';
  ctx.beginPath();
  ctx.arc(sx, sy - 13 + bob, 11, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#553300';
  ctx.beginPath();
  ctx.arc(sx, sy - 19 + bob, 9, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes (direction-aware)
  ctx.fillStyle = '#1a1a1a';
  const eo = player.facing === 'left' ? -2 : player.facing === 'right' ? 2 : 0;
  ctx.beginPath();
  ctx.arc(sx - 4 + eo, sy - 14 + bob, 2, 0, Math.PI * 2);
  ctx.arc(sx + 4 + eo, sy - 14 + bob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Attack arm swing
  if (player.attackCooldown > 0.2) {
    const afx = sx + (player.facing === 'right' ? 22 : player.facing === 'left' ? -22 : 0);
    const afy = sy + (player.facing === 'down' ? 22 : player.facing === 'up' ? -22 : 0) + bob;
    ctx.strokeStyle = '#ffc899'; ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy + 2 + bob); ctx.lineTo(afx, afy); ctx.stroke();
    ctx.fillStyle = '#aaddff';
    ctx.beginPath(); ctx.arc(afx, afy, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    const sx = p.x - cam.x, sy = p.y - cam.y;
    const spin = p.elapsed * 12;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(spin);
    // Top half: red
    ctx.fillStyle = '#dd3322';
    ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI, 0); ctx.fill();
    // Bottom half: white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI); ctx.fill();
    // Outline + seam
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    // Center button
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawUI() {
  // ── Player HP bar (top-left)
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath(); ctx.roundRect(8, 8, 210, 30, 6); ctx.fill();
  ctx.fillStyle = '#300'; ctx.fillRect(12, 12, 202, 20);
  const hpPct = player.hp / player.maxHp;
  ctx.fillStyle = hpPct > 0.5 ? '#44cc44' : hpPct > 0.25 ? '#cccc44' : '#cc4444';
  ctx.fillRect(12, 12, Math.max(0, 202 * hpPct), 20);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(12, 12, 202, 20);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`HP  ${player.hp} / ${player.maxHp}`, 113, 26);

  // ── Pal count top-right
  const aliveCount = wildPals.filter(p => p.state !== 'dead' && p.state !== 'caught').length;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.roundRect(W - 148, 8, 140, 28, 6); ctx.fill();
  ctx.fillStyle = '#ccddff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`野生帕鲁: ${aliveCount}`, W - 78, 26);

  // ── Nearby pal info panel (center-top)
  const aliveWild = wildPals.filter(p => p.state !== 'dead' && p.state !== 'caught');
  const nearPal = nearest(player, aliveWild, 230);
  if (nearPal) {
    const nd = dist(player, nearPal);
    const inRange = nd < 66;
    const px = W / 2 - 140, py = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.roundRect(px, py, 280, 56, 8); ctx.fill();
    ctx.strokeStyle = inRange ? '#ffdd44' : '#445566';
    ctx.lineWidth = inRange ? 2 : 1;
    ctx.strokeRect(px, py, 280, 56);

    // Mini pal icon
    drawPalEntity({ ...nearPal, alpha: 1, catchShake: 0, bobTimer: gameTime * 2.2 },
                  px + 28, py + 30, false);

    // Name
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(nearPal.name, px + 52, py + 22);

    // HP bar
    const bw = 155;
    ctx.fillStyle = '#300'; ctx.fillRect(px + 52, py + 26, bw, 7);
    const pct = nearPal.hp / nearPal.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#cc8844' : '#cc4444';
    ctx.fillRect(px + 52, py + 26, bw * pct, 7);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(px + 52, py + 26, bw, 7);
    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif';
    ctx.fillText(`${nearPal.hp}/${nearPal.maxHp}`, px + 52, py + 47);

    if (inRange) {
      ctx.fillStyle = '#ffdd44'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('[Z]攻击  [X]投球', px + 276, py + 47);
    }
  }

  // ── Pal inventory (bottom bar)
  const INV_H = 82;
  ctx.fillStyle = 'rgba(10,15,25,0.88)';
  ctx.fillRect(0, H - INV_H, W, INV_H);
  ctx.strokeStyle = '#334455'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - INV_H); ctx.lineTo(W, H - INV_H); ctx.stroke();

  ctx.fillStyle = '#667788'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`我的帕鲁  ${player.caughtPals.length}/∞`, 12, H - INV_H + 15);

  const maxShow = Math.min(player.caughtPals.length, 11);
  for (let i = 0; i < maxShow; i++) {
    const pal = player.caughtPals[i];
    const isDeployed = deployedPal && deployedPal.sourceIndex === i;
    const slotX = 10 + i * 76, slotY = H - INV_H + 20;

    ctx.fillStyle = isDeployed ? 'rgba(255,220,80,0.25)' : 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.roundRect(slotX, slotY, 70, 56, 5); ctx.fill();
    ctx.strokeStyle = isDeployed ? '#ffdd44' : '#334455';
    ctx.lineWidth = isDeployed ? 2 : 1;
    ctx.strokeRect(slotX, slotY, 70, 56);

    // Pal mini icon
    ctx.fillStyle = pal.color;
    ctx.beginPath(); ctx.arc(slotX + 22, slotY + 22, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(slotX + 17, slotY + 20, 2.5, 0, Math.PI * 2);
    ctx.arc(slotX + 27, slotY + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Key label
    if (i < 6) {
      ctx.fillStyle = isDeployed ? '#ffdd44' : '#667788';
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`[${i + 1}]`, slotX + 22, slotY + 50);
    }

    // Name (short)
    ctx.fillStyle = '#ccddee'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(pal.name.substring(0, 4), slotX + 40, slotY + 18);

    // Mini HP
    ctx.fillStyle = '#300'; ctx.fillRect(slotX + 40, slotY + 22, 26, 5);
    ctx.fillStyle = '#4c4';
    ctx.fillRect(slotX + 40, slotY + 22, 26 * (pal.hp / pal.maxHp), 5);
  }

  // ── Message log (bottom-right above inventory)
  const msgX = W - 320, msgBaseY = H - INV_H - 8;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const alpha = Math.min(1, msg.life / 0.8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(msgX - 4, msgBaseY - i * 22 - 18, 316, 18, 4); ctx.fill();
    ctx.fillStyle = msg.color;
    ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(msg.text, msgX, msgBaseY - i * 22 - 4);
    ctx.globalAlpha = 1;
  }

  // ── Floating texts (world-space)
  for (const ft of floats) {
    const alpha = Math.min(1, ft.life / 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x - cam.x, ft.y - cam.y);
    ctx.globalAlpha = 1;
  }

  // ── Minimap (bottom-right corner, above inv)
  const MM_W = 120, MM_H = 90;
  const mmX = W - MM_W - 10, mmY = H - INV_H - MM_H - 14;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.roundRect(mmX - 2, mmY - 2, MM_W + 4, MM_H + 4, 5); ctx.fill();
  ctx.strokeStyle = '#334'; ctx.lineWidth = 1; ctx.strokeRect(mmX, mmY, MM_W, MM_H);

  // Draw world minimap
  const scaleX = MM_W / (WORLD_W * TILE);
  const scaleY = MM_H / (WORLD_H * TILE);
  for (let ty = 0; ty < WORLD_H; ty += 2) {
    for (let tx = 0; tx < WORLD_W; tx += 2) {
      const tile = WORLD[ty][tx];
      ctx.fillStyle = tile === TILE_TREE ? '#254a12' :
                      tile === TILE_WATER ? '#2255aa' :
                      tile === TILE_ROCK ? '#555' :
                      '#3a6622';
      ctx.fillRect(mmX + tx * TILE * scaleX, mmY + ty * TILE * scaleY, 3, 2.5);
    }
  }

  // Pals on minimap
  for (const pal of wildPals) {
    if (pal.state === 'dead' || pal.state === 'caught') continue;
    ctx.fillStyle = pal.color;
    ctx.beginPath();
    ctx.arc(mmX + pal.x * scaleX, mmY + pal.y * scaleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player on minimap
  ctx.fillStyle = '#ffdd44';
  ctx.beginPath();
  ctx.arc(mmX + player.x * scaleX, mmY + player.y * scaleY, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ── RENDER ────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);

  drawWorld();

  // Wild pals (behind player)
  for (const pal of wildPals) {
    const sx = pal.x - cam.x, sy = pal.y - cam.y;
    if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
    drawPalEntity(pal, sx, sy, false);
  }

  // Deployed pal (special glow)
  if (deployedPal) {
    const sx = deployedPal.x - cam.x, sy = deployedPal.y - cam.y;
    drawPalEntity(deployedPal, sx, sy, true);
    // Arrow indicator above
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(sx, sy - deployedPal.size - 20);
    ctx.lineTo(sx - 6, sy - deployedPal.size - 30);
    ctx.lineTo(sx + 6, sy - deployedPal.size - 30);
    ctx.closePath();
    ctx.fill();
  }

  drawProjectiles();
  drawPlayer();

  // Particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawUI();
}

// ── GAME LOOP ─────────────────────────────
function loop(ts) {
  const dt = Math.min((ts - lastTimestamp) / 1000, 0.05);
  lastTimestamp = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(ts => { lastTimestamp = ts; requestAnimationFrame(loop); });
