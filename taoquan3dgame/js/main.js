import { CannonAdapter } from './physics/CannonAdapter.js';
import { GameScene }     from './GameScene.js';
import { Game }          from './Game.js';
import { UI }            from './UI.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────

const canvas  = document.getElementById('game-canvas');
const physics = new CannonAdapter();
physics.init({ gravity: -9.82 });

const gameScene = new GameScene(canvas, physics);
const ui        = new UI();
const game      = new Game(gameScene, physics, ui);

// Wire buttons
ui.onStart(()  => game.start());
ui.onReplay(() => game.start());

// Initial state: show start screen with static scene rendered
ui.showStart();
game.state = 'idle';

// ── Game loop ─────────────────────────────────────────────────────────────

function loop(ts) {
  game.update(ts);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── Window resize ─────────────────────────────────────────────────────────

window.addEventListener('resize', () => gameScene.resize());

// ── Prevent right-click menu on canvas ───────────────────────────────────

canvas.addEventListener('contextmenu', e => e.preventDefault());
