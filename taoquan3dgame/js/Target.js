import * as THREE from 'three';

// Prize color palette
const COLORS = [0xFF4455, 0xFF8800, 0xFFDD00, 0x44CC55, 0x44AAFF, 0xCC44FF, 0xFF44AA, 0x00DDCC];
let _colorIdx = 0;

export class Target {
  static POST_RADIUS  = 0.025;
  static POST_HEIGHT  = 0.28;
  static RING_RADIUS  = 0.13; // must match Ring.MAJOR_RADIUS

  /**
   * @param {THREE.Scene} scene
   * @param {import('./physics/PhysicsAdapter').PhysicsAdapter} physics
   * @param {{ x, y, z, points, special }} opts
   *   y = table top surface height
   */
  constructor(scene, physics, opts = {}) {
    const { x = 0, y = 0.65, z = 0, points = 10, special = false } = opts;

    this.scene   = scene;
    this.physics = physics;
    this.x = x; this.y = y; this.z = z;
    this.points  = points;
    this.special = special;
    this.scored  = false;

    this._buildMesh();
    this._buildPhysics();
  }

  // ── visuals ────────────────────────────────────────────────────────────────

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.set(this.x, this.y, this.z);

    // Post
    const postGeo = new THREE.CylinderGeometry(Target.POST_RADIUS, Target.POST_RADIUS, Target.POST_HEIGHT, 10);
    const postMat = new THREE.MeshToonMaterial({ color: 0xBBBBBB });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = Target.POST_HEIGHT / 2;
    post.castShadow = true;
    this.group.add(post);

    // Prize on top
    const color = this.special ? 0xFFD700 : COLORS[_colorIdx++ % COLORS.length];
    this._addPrize(color);

    this.scene.add(this.group);
  }

  _addPrize(color) {
    const topY = Target.POST_HEIGHT + 0.06;
    let geo;
    if (this.special)        geo = new THREE.OctahedronGeometry(0.10);
    else if (this.points >= 50) geo = new THREE.ConeGeometry(0.08, 0.18, 7);
    else if (this.points >= 25) geo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    else                        geo = new THREE.SphereGeometry(0.07, 10, 10);

    const mat = new THREE.MeshToonMaterial({ color });
    if (this.special) mat.emissive = new THREE.Color(0xFFAA00); // subtle glow
    if (this.special) mat.emissiveIntensity = 0.4;

    this.prizeMesh = new THREE.Mesh(geo, mat);
    this.prizeMesh.position.y = topY;
    this.prizeMesh.castShadow = true;
    this._prizeBaseY = topY;
    this.group.add(this.prizeMesh);
  }

  // ── physics ────────────────────────────────────────────────────────────────

  _buildPhysics() {
    // Cylinder body oriented along Y axis (cannon-es default)
    this.physicsId = this.physics.addBody({
      type: 'static',
      position: [this.x, this.y + Target.POST_HEIGHT / 2, this.z],
      shape: {
        type: 'cylinder',
        params: { rTop: Target.POST_RADIUS, rBot: Target.POST_RADIUS, h: Target.POST_HEIGHT, segs: 8 },
      },
    });
  }

  // ── game logic ─────────────────────────────────────────────────────────────

  /**
   * Returns true if the given ring position counts as scored on this post.
   * Ring center must be within ~ring radius of the post in XZ,
   * and at approximately post-top height.
   */
  checkScore(rx, ry, rz) {
    if (this.scored) return false;
    const dx = rx - this.x;
    const dz = rz - this.z;
    const horizDist = Math.sqrt(dx*dx + dz*dz);
    const postTopY  = this.y + Target.POST_HEIGHT;
    return horizDist < Target.RING_RADIUS * 0.80 && ry < postTopY + 0.08 && ry > this.y - 0.15;
  }

  markScored() {
    this.scored = true;
    this._bounceAnimate();
  }

  _bounceAnimate() {
    const base = this._prizeBaseY;
    let t = 0;
    const tick = () => {
      t += 0.06;
      this.prizeMesh.position.y = base + Math.sin(t * Math.PI) * 0.14;
      this.prizeMesh.rotation.y += 0.12;
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  reset() {
    this.scored = false;
    this.prizeMesh.position.y  = this._prizeBaseY;
    this.prizeMesh.rotation.set(0, 0, 0);
  }

  dispose() {
    this.physics.removeBody(this.physicsId);
    this.scene.remove(this.group);
  }
}
