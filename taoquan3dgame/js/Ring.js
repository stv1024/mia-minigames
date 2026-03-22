import * as THREE from 'three';

const RING_COLORS = [0xFF6644, 0x44AAFF, 0xFFDD00, 0x88FF44, 0xFF44CC, 0x44FFEE];
let _colorIdx = 0;

export class Ring {
  static MAJOR_RADIUS  = 0.13;   // ring hole radius
  static TUBE_RADIUS   = 0.028;  // ring thickness
  static SPHERE_COUNT  = 10;     // compound body approximation

  constructor(scene, physics) {
    this.scene   = scene;
    this.physics = physics;
    this.physicsId   = null;
    this.active      = false;  // true when physics body is live
    this.settled     = false;
    this._settleTimer = 0;
    this._scored     = false;

    const color = RING_COLORS[_colorIdx++ % RING_COLORS.length];
    this._buildMesh(color);
  }

  // ── mesh ──────────────────────────────────────────────────────────────────

  _buildMesh(color) {
    const geo = new THREE.TorusGeometry(
      Ring.MAJOR_RADIUS,
      Ring.TUBE_RADIUS,
      10, 32
    );
    const mat = new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow  = true;
    this.mesh.visible     = false;
    this.scene.add(this.mesh);
  }

  // ── held (pre-throw) ──────────────────────────────────────────────────────

  showHeld(camera) {
    this.mesh.visible = true;
    this.active = false;
    this._syncHeld(camera);
  }

  _syncHeld(camera) {
    // Appear in bottom-center-left of view, tilted to look "held"
    const offset = new THREE.Vector3(0.18, -0.22, -0.55);
    offset.applyQuaternion(camera.quaternion);
    this.mesh.position.copy(camera.position).add(offset);
    // Match camera orientation but tilt the ring to ~45° horizontal
    this.mesh.quaternion.copy(camera.quaternion);
    this.mesh.rotateX(-0.5);
  }

  // ── launch ────────────────────────────────────────────────────────────────

  /**
   * @param {THREE.Vector3} position
   * @param {THREE.Vector3} velocity
   */
  launch(position, velocity) {
    this.active  = true;
    this.settled = false;
    this._settleTimer = 0;
    this._scored = false;
    this.mesh.visible = true;

    // Compound body: N spheres arranged in a circle in the XZ plane
    // (matches THREE.js TorusGeometry orientation — ring hole faces +Y)
    const N = Ring.SPHERE_COUNT;
    const R = Ring.MAJOR_RADIUS;
    const r = Ring.TUBE_RADIUS;
    const children = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      children.push({
        type: 'sphere',
        params: { radius: r },
        offset: [R * Math.cos(a), 0, R * Math.sin(a)],
      });
    }

    this.physicsId = this.physics.addBody({
      type: 'dynamic',
      mass: 0.05,
      position: [position.x, position.y, position.z],
      material: 'ring',
      linearDamping: 0.08,
      angularDamping: 0.20,
      shape: { type: 'compound', children },
    });

    this.physics.setVelocity(this.physicsId, velocity.x, velocity.y, velocity.z);

    // Random tumble spin for realism
    const spin = 5 + Math.random() * 4;
    this.physics.setAngularVelocity(
      this.physicsId,
      (Math.random() - 0.5) * spin,
      (Math.random() - 0.5) * spin * 0.5,
      (Math.random() - 0.5) * spin,
    );
  }

  // ── update (call each frame while active) ─────────────────────────────────

  update(dt) {
    if (!this.active || this.physicsId === null) return;

    // Sync mesh with physics
    const p = this.physics.getPosition(this.physicsId);
    const q = this.physics.getQuaternion(this.physicsId);
    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.quaternion.set(q.x, q.y, q.z, q.w);

    if (this.settled) return;

    // Settle detection: low speed OR physics sleep
    const speed = this.physics.getSpeed(this.physicsId);
    const sleeping = this.physics.isSleeping(this.physicsId);

    if (sleeping || speed < 0.12) {
      this._settleTimer += dt;
      if (this._settleTimer > 0.4) this.settled = true;
    } else {
      this._settleTimer = 0;
    }

    // Fell off the world
    if (p.y < -3) this.settled = true;
  }

  getPosition() {
    if (this.physicsId !== null) return this.physics.getPosition(this.physicsId);
    return { x: 0, y: 0, z: 0 };
  }

  // ── cleanup ───────────────────────────────────────────────────────────────

  removePhysics() {
    if (this.physicsId !== null) {
      this.physics.removeBody(this.physicsId);
      this.physicsId = null;
    }
    this.active = false;
  }

  dispose() {
    this.removePhysics();
    this.mesh.visible = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
