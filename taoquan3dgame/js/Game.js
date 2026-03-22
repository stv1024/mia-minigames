import { Ring }        from './Ring.js';
import { ThrowSystem } from './ThrowSystem.js';

const TOTAL_RINGS = 10;

/**
 * Game states
 *  'idle'     – start/gameover screen showing, no physics
 *  'aiming'   – player moving mouse, ring held
 *  'charging' – mouse held, power bar filling
 *  'thrown'   – ring in flight
 *  'waiting'  – ring settled, score evaluated, short pause before next ring
 *  'gameover' – all rings used
 */
export class Game {
  constructor(gameScene, physics, ui) {
    this.gameScene = gameScene;
    this.physics   = physics;
    this.ui        = ui;

    this.state     = 'idle';
    this.score     = 0;
    this.ringsLeft = TOTAL_RINGS;

    /** @type {Ring|null} */  this.heldRing   = null;
    /** @type {Ring[]}   */  this.liveRings   = [];
    /** @type {Ring[]}   */  this.settledRings = [];

    this.targets   = [];

    this.thrower   = new ThrowSystem(gameScene.canvas, gameScene.camera);
    this.thrower.onThrow = (data) => this._onThrow(data);

    this._lastTs   = null;
  }

  // ── public API ────────────────────────────────────────────────────────────

  start() {
    // Reset counters & rings
    this.score     = 0;
    this.ringsLeft = TOTAL_RINGS;

    // Discard previous rings
    [...this.liveRings, ...this.settledRings].forEach(r => r.dispose());
    if (this.heldRing) { this.heldRing.dispose(); this.heldRing = null; }
    this.liveRings    = [];
    this.settledRings = [];

    // Setup scene targets
    this.targets = this.gameScene.setupTargets();

    this.ui.showHUD(this.ringsLeft, this.score);
    this._nextRing();
  }

  // ── main loop (called every requestAnimationFrame) ────────────────────────

  update(timestamp) {
    if (!this._lastTs) this._lastTs = timestamp;
    const dt = Math.min((timestamp - this._lastTs) / 1000, 0.05);
    this._lastTs = timestamp;

    if (this.state === 'idle') {
      this.gameScene.render();
      return;
    }

    // Step physics
    this.physics.step(dt);

    switch (this.state) {
      case 'aiming':
      case 'charging':
        this._updateAiming(dt);
        break;

      case 'thrown':
        this._updateThrown(dt);
        break;

      case 'waiting':
        // Just update live ring visuals (settling animation)
        for (const r of this.liveRings) r.update(dt);
        break;
    }

    this.gameScene.render();
  }

  // ── state handlers ────────────────────────────────────────────────────────

  _nextRing() {
    if (this.ringsLeft <= 0) {
      this._gameOver();
      return;
    }

    this.heldRing = new Ring(this.gameScene.scene, this.physics);
    this.heldRing.showHeld(this.gameScene.camera);
    this.thrower.enable();
    this.state = 'aiming';
  }

  _updateAiming(dt) {
    this.thrower.update(dt);

    // Keep held ring in hand
    if (this.heldRing) this.heldRing._syncHeld(this.gameScene.camera);

    // Aim indicator on table
    const ap = this.thrower.aimPoint;
    this.gameScene.setAimIndicator(ap.x, ap.y, ap.z, true);

    // Update aim label: find nearest target under cursor
    this._updateAimLabel(ap);

    if (this.thrower.isCharging) {
      this.state = 'charging';
      this.ui.showPowerBar();
    }

    if (this.state === 'charging') {
      this.ui.setPower(this.thrower.power);
      // Trajectory preview
      const preview = this.thrower.getPreviewThrow();
      this.gameScene.updateTrajectory(preview.position, preview.velocity);
    } else {
      this.gameScene.hideTrajectory();
      this.ui.hidePowerBar();
    }
  }

  _updateAimLabel(ap) {
    let best = Infinity, label = '';
    for (const t of this.targets) {
      if (t.scored) continue;
      const dx = ap.x - t.x, dz = ap.z - t.z;
      const d = Math.sqrt(dx*dx + dz*dz);
      if (d < 0.25 && d < best) { best = d; label = `${t.points} 分`; }
    }
    this.ui.setAimLabel(label);
  }

  _onThrow(throwData) {
    if (this.state !== 'aiming' && this.state !== 'charging') return;
    if (!this.heldRing) return;

    // Hide UI helpers
    this.ui.hidePowerBar();
    this.ui.setAimLabel('');
    this.gameScene.hideTrajectory();
    this.gameScene.setAimIndicator(0, 0, 0, false);
    this.thrower.disable();

    // Launch ring
    this.heldRing.launch(throwData.position, throwData.velocity);
    this.liveRings.push(this.heldRing);
    this.heldRing = null;

    this.ringsLeft--;
    this.ui.updateCounters(this.ringsLeft, this.score);

    this.state = 'thrown';
  }

  _updateThrown(dt) {
    for (const r of this.liveRings) r.update(dt);

    const ring = this.liveRings[this.liveRings.length - 1];
    if (!ring || !ring.settled || ring._scored) return;

    ring._scored = true;
    this.state = 'waiting';

    // Score check
    const pos = ring.getPosition();
    for (const target of this.targets) {
      if (target.checkScore(pos.x, pos.y, pos.z)) {
        this.score += target.points;
        target.markScored();
        this.ui.updateCounters(this.ringsLeft, this.score);

        // Score popup in screen space
        const screenPos = this.gameScene.worldToScreen({ x: target.x, y: target.y + 0.6, z: target.z });
        this.ui.showScorePopup(target.points, screenPos);
        break;
      }
    }

    // Move ring to settled pile (keep its physics for visual, remove after delay)
    this.settledRings.push(ring);
    this.liveRings.pop();

    // Wait then load next ring
    setTimeout(() => {
      if (this.state !== 'waiting') return; // safety
      if (this.ringsLeft > 0) {
        this._nextRing();
      } else {
        this._gameOver();
      }
    }, 1100);
  }

  _gameOver() {
    this.state = 'gameover';
    this.thrower.disable();
    this.gameScene.setAimIndicator(0, 0, 0, false);
    this.gameScene.hideTrajectory();
    this.ui.showGameOver(this.score);
  }
}
