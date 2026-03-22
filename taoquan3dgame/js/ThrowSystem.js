import * as THREE from 'three';
import { TABLE_SURF } from './GameScene.js';

// Table bounds for clamping the aim point
const TABLE_X  = 1.0;
const TABLE_Z_NEAR = -0.15;
const TABLE_Z_FAR  = -1.45;

// Power charge timing
const MIN_CHARGE = 0.15; // seconds for min power
const MAX_CHARGE = 1.6;  // seconds for max power (full bar)

// Launch position offset from camera (in camera local space)
const LAUNCH_OFFSET = new THREE.Vector3(0, -0.15, -0.55);

export class ThrowSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {THREE.Camera} camera
   */
  constructor(canvas, camera) {
    this.canvas  = canvas;
    this.camera  = camera;
    this.enabled = false;

    this._mouseNDC   = new THREE.Vector2();
    this._raycaster  = new THREE.Raycaster();
    this._aimPlane   = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TABLE_SURF);

    this.aimPoint    = new THREE.Vector3(0, TABLE_SURF, -0.6);
    this.aimLabel    = ''; // points label of the target closest to aim

    this.isCharging  = false;
    this.chargeTime  = 0;
    this.power       = 0; // 0–1

    /** @type {Function|null} called with throwData when ring is released */
    this.onThrow = null;

    this._boundMove = this._onMove.bind(this);
    this._boundDown = this._onDown.bind(this);
    this._boundUp   = this._onUp.bind(this);
    canvas.addEventListener('mousemove', this._boundMove);
    canvas.addEventListener('mousedown', this._boundDown);
    // Listen on window so mouseup fires even if cursor leaves canvas
    window.addEventListener('mouseup', this._boundUp);
  }

  enable()  { this.enabled = true; }
  disable() { this.enabled = false; this.isCharging = false; this.chargeTime = 0; this.power = 0; }

  // ── events ────────────────────────────────────────────────────────────────

  _onMove(e) {
    this._mouseNDC.set(
      (e.clientX / window.innerWidth)  * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
  }

  _onDown(e) {
    if (!this.enabled || e.button !== 0) return;
    this.isCharging = true;
    this.chargeTime = 0;
  }

  _onUp(e) {
    if (!this.enabled || e.button !== 0 || !this.isCharging) return;
    this.isCharging = false;
    if (this.onThrow) this.onThrow(this._computeThrow());
    this.chargeTime = 0;
    this.power = 0;
  }

  // ── per-frame update ─────────────────────────────────────────────────────

  update(dt) {
    // Raycast mouse → table plane
    this._raycaster.setFromCamera(this._mouseNDC, this.camera);
    const hit = new THREE.Vector3();
    if (this._raycaster.ray.intersectPlane(this._aimPlane, hit)) {
      hit.x = Math.max(-TABLE_X, Math.min(TABLE_X, hit.x));
      hit.z = Math.max(TABLE_Z_FAR, Math.min(TABLE_Z_NEAR, hit.z));
      this.aimPoint.copy(hit);
    }

    if (this.isCharging) {
      this.chargeTime += dt;
      this.power = Math.min((this.chargeTime - MIN_CHARGE) / (MAX_CHARGE - MIN_CHARGE), 1.0);
      this.power = Math.max(this.power, 0);
    }
  }

  // ── throw calculation ────────────────────────────────────────────────────

  /**
   * Computes launch position and velocity such that:
   *   - At full power (1.0): flat, fast arc to aim point
   *   - At low power (0.0): high lobbing arc (may fall short)
   *
   * Uses ballistic formula: target = launch + v*t + 0.5*g*t²
   */
  _computeThrow() {
    const G = -9.82;

    // Launch pos: just in front/below camera
    const localOff = LAUNCH_OFFSET.clone();
    localOff.applyQuaternion(this.camera.quaternion);
    const launchPos = this.camera.position.clone().add(localOff);

    // Flight time: high power → short time (fast+flat), low power → long time (lob)
    const p = Math.max(this.power, 0.05); // avoid division edge case
    const flightTime = 1.5 - p * 1.0; // range: 1.5s (p=0) → 0.5s (p=1)

    const dx = this.aimPoint.x - launchPos.x;
    const dy = this.aimPoint.y - launchPos.y;
    const dz = this.aimPoint.z - launchPos.z;

    const vx = dx / flightTime;
    const vy = (dy - 0.5 * G * flightTime * flightTime) / flightTime;
    const vz = dz / flightTime;

    return {
      position: launchPos,
      velocity: new THREE.Vector3(vx, vy, vz),
      power: this.power,
    };
  }

  /** Same formula — used for trajectory preview */
  getPreviewThrow() {
    return this._computeThrow();
  }

  // ── cleanup ───────────────────────────────────────────────────────────────

  dispose() {
    this.canvas.removeEventListener('mousemove', this._boundMove);
    this.canvas.removeEventListener('mousedown', this._boundDown);
    window.removeEventListener('mouseup', this._boundUp);
  }
}
