import * as THREE from 'three';
import { Target } from './Target.js';

// Table dimensions (world units)
const TABLE_W    = 2.2;
const TABLE_D    = 1.6;
const TABLE_SURF = 0.65; // surface Y
const TABLE_CZ   = -0.6; // center Z

export { TABLE_SURF };

export class GameScene {
  constructor(canvas, physics) {
    this.canvas  = canvas;
    this.physics = physics;
    this.targets = [];

    this._initRenderer();
    this._initCamera();
    this._initLights();
    this._initScene();
    this._initTablePhysics();
    this._initTrajectory();
    this._initAimIndicator();
  }

  // ── renderer / camera ─────────────────────────────────────────────────────

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12102a);
    this.scene.fog = new THREE.Fog(0x12102a, 10, 22);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 50);
    this.camera.position.set(0, 1.6, 3.0);
    this.camera.lookAt(0, 0.75, TABLE_CZ);
  }

  // ── lights ────────────────────────────────────────────────────────────────

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0x334466, 1.2));

    // Main warm overhead spot — like a stall lantern
    const spot = new THREE.SpotLight(0xFFEECC, 3.5);
    spot.position.set(0, 4.5, 0.5);
    spot.target.position.set(0, TABLE_SURF, TABLE_CZ);
    spot.angle   = 0.52;
    spot.penumbra = 0.35;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    this.scene.add(spot, spot.target);

    // Colored accent lights
    const rimL = new THREE.PointLight(0xFF3355, 0.8, 8);
    rimL.position.set(-3.5, 2.5, -1);
    const rimR = new THREE.PointLight(0x3355FF, 0.8, 8);
    rimR.position.set(3.5, 2.5, -1);
    this.scene.add(rimL, rimR);
  }

  // ── scene geometry ────────────────────────────────────────────────────────

  _initScene() {
    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshToonMaterial({ color: 0x1e1b38 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Table top
    const tableMat = new THREE.MeshToonMaterial({ color: 0x7B3F10 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(TABLE_W, 0.07, TABLE_D), tableMat);
    tableTop.position.set(0, TABLE_SURF, TABLE_CZ);
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    // Tablecloth (colored stripes via canvas texture)
    const stripeTex = this._makeStripeTexture();
    const cloth = new THREE.Mesh(
      new THREE.PlaneGeometry(TABLE_W - 0.06, TABLE_D - 0.06),
      new THREE.MeshToonMaterial({ map: stripeTex }),
    );
    cloth.rotation.x = -Math.PI / 2;
    cloth.position.set(0, TABLE_SURF + 0.036, TABLE_CZ);
    this.scene.add(cloth);

    // Table legs
    const legMat = new THREE.MeshToonMaterial({ color: 0x5C2E00 });
    const legH   = TABLE_SURF - 0.035;
    [[-TABLE_W/2+0.1, -TABLE_D/2+0.1], [TABLE_W/2-0.1, -TABLE_D/2+0.1],
     [-TABLE_W/2+0.1,  TABLE_D/2-0.1], [TABLE_W/2-0.1,  TABLE_D/2-0.1]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, legH, 0.08), legMat);
      leg.position.set(lx, legH / 2, TABLE_CZ + lz);
      this.scene.add(leg);
    });

    // Backdrop wall
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 3.5),
      new THREE.MeshToonMaterial({ color: 0x1a0a2e }),
    );
    backdrop.position.set(0, 1.75, TABLE_CZ - TABLE_D / 2 - 0.05);
    this.scene.add(backdrop);

    // Red banner
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 0.45),
      new THREE.MeshToonMaterial({ color: 0xCC2200 }),
    );
    banner.position.set(0, 3.1, TABLE_CZ - TABLE_D / 2);
    this.scene.add(banner);

    // Decorative bulbs along the top
    this._addBulbs();
  }

  _makeStripeTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const cols = ['#CC1111','#FFFFFF','#1133CC','#FFFFFF'];
    cols.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(i * 32, 0, 32, 128);
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    return tex;
  }

  _addBulbs() {
    const xs     = [-1.7, -1.2, -0.6, 0, 0.6, 1.2, 1.7];
    const colors = [0xFF4444, 0xFFFF44, 0x44FF44, 0x44AAFF, 0xFF44FF, 0xFF8844, 0x44FFFF];
    xs.forEach((x, i) => {
      const mat  = new THREE.MeshToonMaterial({ color: colors[i], emissive: new THREE.Color(colors[i]), emissiveIntensity: 0.7 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), mat);
      bulb.position.set(x, 3.2, TABLE_CZ - TABLE_D / 2 + 0.05);
      this.scene.add(bulb);
    });
  }

  // ── table physics ─────────────────────────────────────────────────────────

  _initTablePhysics() {
    const s = TABLE_SURF;
    const cz = TABLE_CZ;
    const hw = TABLE_W / 2;
    const hd = TABLE_D / 2;

    // Floor slab
    this.physics.addBody({
      type: 'static',
      position: [0, -0.1, 0],
      shape: { type: 'box', params: { hx: 12, hy: 0.1, hz: 12 } },
    });

    // Table surface
    this.physics.addBody({
      type: 'static',
      position: [0, s, cz],
      shape: { type: 'box', params: { hx: hw, hy: 0.035, hz: hd } },
    });

    // Left / right bumpers
    this.physics.addBody({ type:'static', position:[-hw-0.04, s+0.15, cz],
      shape:{ type:'box', params:{ hx:0.04, hy:0.2, hz:hd } } });
    this.physics.addBody({ type:'static', position:[ hw+0.04, s+0.15, cz],
      shape:{ type:'box', params:{ hx:0.04, hy:0.2, hz:hd } } });

    // Back wall
    this.physics.addBody({ type:'static', position:[0, s+0.25, cz - hd - 0.04],
      shape:{ type:'box', params:{ hx:hw, hy:0.3, hz:0.04 } } });
  }

  // ── targets ───────────────────────────────────────────────────────────────

  setupTargets() {
    for (const t of this.targets) t.dispose();
    this.targets = [];

    // Layout: front row (z=-0.3), mid row (z=-0.75), back row (z=-1.1)
    // Special star in the middle of mid row
    const rows = [
      { z: TABLE_CZ + 0.35, points: 10,  xs: [-0.65, 0, 0.65] },
      { z: TABLE_CZ - 0.1,  points: 25,  xs: [-0.65, 0.65]     },
      { z: TABLE_CZ - 0.55, points: 50,  xs: [-0.65, 0, 0.65]  },
    ];

    for (const row of rows) {
      for (const x of row.xs) {
        this.targets.push(new Target(this.scene, this.physics, {
          x, y: TABLE_SURF, z: row.z, points: row.points,
        }));
      }
    }

    // Special center mid
    this.targets.push(new Target(this.scene, this.physics, {
      x: 0, y: TABLE_SURF, z: TABLE_CZ - 0.1, points: 100, special: true,
    }));

    return this.targets;
  }

  // ── trajectory dots ───────────────────────────────────────────────────────

  _initTrajectory() {
    const count = 28;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.035, transparent: true, opacity: 0.5 });
    this._trajectoryPoints = new THREE.Points(geo, mat);
    this.scene.add(this._trajectoryPoints);
    this._trajCount = count;
  }

  /** @param {THREE.Vector3} origin @param {THREE.Vector3} vel */
  updateTrajectory(origin, vel) {
    const geo  = this._trajectoryPoints.geometry;
    const attr = geo.attributes.position;
    const arr  = attr.array;
    const g    = -9.82;
    const dt   = 0.05;
    let x = origin.x, y = origin.y, z = origin.z;
    let vx = vel.x,   vy = vel.y,   vz = vel.z;
    let visible = 0;

    for (let i = 0; i < this._trajCount; i++) {
      x += vx * dt;
      y += vy * dt + 0.5 * g * dt * dt;
      z += vz * dt;
      vy += g * dt;
      vx *= 0.99; vz *= 0.99; // slight drag approximation

      if (y < -0.2) break;
      arr[i*3]   = x;
      arr[i*3+1] = y;
      arr[i*3+2] = z;
      visible++;
    }

    geo.setDrawRange(0, visible);
    attr.needsUpdate = true;
  }

  hideTrajectory() {
    this._trajectoryPoints.geometry.setDrawRange(0, 0);
  }

  // ── aim indicator ─────────────────────────────────────────────────────────

  _initAimIndicator() {
    const geo = new THREE.RingGeometry(0.06, 0.10, 20);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
    this._aimRing = new THREE.Mesh(geo, mat);
    this._aimRing.rotation.x = -Math.PI / 2;
    this._aimRing.visible    = false;
    this.scene.add(this._aimRing);
  }

  setAimIndicator(x, y, z, visible) {
    this._aimRing.position.set(x, y + 0.015, z);
    this._aimRing.visible = visible;
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  /** Project a world position to screen coords. */
  worldToScreen(worldPos) {
    const v = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-(v.y * 0.5) + 0.5) * window.innerHeight,
    };
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
