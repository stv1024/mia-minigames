import * as CANNON from 'cannon-es';
import { PhysicsAdapter } from './PhysicsAdapter.js';

export class CannonAdapter extends PhysicsAdapter {
  constructor() {
    super();
    this.world = null;
    this._bodies = new Map(); // id → CANNON.Body
    this._nextId = 0;
    this._ringMat = null;
    this._worldMat = null;
  }

  init({ gravity = -9.82 } = {}) {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, gravity, 0),
    });

    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    // Materials for ring vs world surfaces
    this._worldMat = new CANNON.Material('world');
    this._ringMat  = new CANNON.Material('ring');

    const contact = new CANNON.ContactMaterial(this._worldMat, this._ringMat, {
      friction: 0.45,
      restitution: 0.28,
    });
    const ringRing = new CANNON.ContactMaterial(this._ringMat, this._ringMat, {
      friction: 0.3,
      restitution: 0.15,
    });
    this.world.addContactMaterial(contact);
    this.world.addContactMaterial(ringRing);
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.25;
  }

  // Smaller fixed time step reduces tunneling through thin posts
  step(dt) {
    this.world.step(1 / 120, dt, 4);
  }

  addBody(config) {
    const {
      type          = 'dynamic',
      mass          = 1,
      position      = [0, 0, 0],
      quaternion    = null,
      linearDamping  = 0.05,
      angularDamping = 0.1,
      shape,
      material      = 'world',
    } = config;

    const bodyMat = material === 'ring' ? this._ringMat : this._worldMat;

    const body = new CANNON.Body({
      mass: type === 'static' ? 0 : mass,
      material: bodyMat,
      linearDamping,
      angularDamping,
      allowSleep: true,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 0.5,
    });

    body.position.set(...position);
    if (quaternion) body.quaternion.set(...quaternion);

    this._applyShape(body, shape);
    this.world.addBody(body);

    const id = this._nextId++;
    this._bodies.set(id, body);
    return id;
  }

  _applyShape(body, shape) {
    if (!shape) return;
    const { type, params = {}, offset, rotation, children } = shape;

    if (type === 'compound') {
      for (const child of children) {
        const s   = this._makeShape(child.type, child.params || {});
        const off = child.offset ? new CANNON.Vec3(...child.offset) : new CANNON.Vec3();
        const rot = child.rotation ? new CANNON.Quaternion(...child.rotation) : new CANNON.Quaternion(0,0,0,1);
        body.addShape(s, off, rot);
      }
    } else {
      const s   = this._makeShape(type, params);
      const off = offset   ? new CANNON.Vec3(...offset)            : undefined;
      const rot = rotation ? new CANNON.Quaternion(...rotation)    : undefined;
      body.addShape(s, off, rot);
    }
  }

  _makeShape(type, p) {
    switch (type) {
      case 'sphere':   return new CANNON.Sphere(p.radius ?? 0.5);
      case 'box':      return new CANNON.Box(new CANNON.Vec3(p.hx ?? 0.5, p.hy ?? 0.5, p.hz ?? 0.5));
      case 'cylinder': return new CANNON.Cylinder(p.rTop ?? 0.5, p.rBot ?? 0.5, p.h ?? 1, p.segs ?? 8);
      case 'plane':    return new CANNON.Plane();
      default: throw new Error(`Unknown shape: ${type}`);
    }
  }

  removeBody(id) {
    const body = this._bodies.get(id);
    if (body) { this.world.removeBody(body); this._bodies.delete(id); }
  }

  getPosition(id) {
    const p = this._bodies.get(id).position;
    return { x: p.x, y: p.y, z: p.z };
  }

  getQuaternion(id) {
    const q = this._bodies.get(id).quaternion;
    return { x: q.x, y: q.y, z: q.z, w: q.w };
  }

  setVelocity(id, vx, vy, vz) {
    const b = this._bodies.get(id);
    b.velocity.set(vx, vy, vz);
    b.wakeUp();
  }

  setAngularVelocity(id, wx, wy, wz) {
    const b = this._bodies.get(id);
    b.angularVelocity.set(wx, wy, wz);
    b.wakeUp();
  }

  getSpeed(id) {
    const v = this._bodies.get(id).velocity;
    return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
  }

  isSleeping(id) {
    const b = this._bodies.get(id);
    return b.sleepState === CANNON.Body.SLEEPING;
  }
}
