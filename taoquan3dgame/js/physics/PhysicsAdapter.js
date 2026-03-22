/**
 * Abstract physics adapter interface.
 * Swap implementations (Cannon-es → Rapier, etc.) without touching game code.
 *
 * Body config shape:
 * {
 *   type: 'dynamic' | 'static',
 *   mass: number,
 *   position: [x, y, z],
 *   quaternion: [x, y, z, w],       // optional, defaults to identity
 *   linearDamping: number,
 *   angularDamping: number,
 *   shape: ShapeConfig,
 *   material: 'default' | 'ring',
 * }
 *
 * ShapeConfig: { type: 'box'|'sphere'|'cylinder'|'compound', params, children? }
 */
export class PhysicsAdapter {
  /** @param {{ gravity: number }} options */
  init(options = {}) { throw new Error('Not implemented'); }

  /** @param {number} dt - seconds since last frame */
  step(dt) { throw new Error('Not implemented'); }

  /** @param {object} config @returns {number} bodyId */
  addBody(config) { throw new Error('Not implemented'); }

  /** @param {number} id */
  removeBody(id) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {{ x,y,z }} */
  getPosition(id) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {{ x,y,z,w }} */
  getQuaternion(id) { throw new Error('Not implemented'); }

  /** @param {number} id @param {number} vx @param {number} vy @param {number} vz */
  setVelocity(id, vx, vy, vz) { throw new Error('Not implemented'); }

  /** @param {number} id @param {number} wx @param {number} wy @param {number} wz */
  setAngularVelocity(id, wx, wy, wz) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {number} speed magnitude */
  getSpeed(id) { throw new Error('Not implemented'); }

  /** @param {number} id @returns {boolean} */
  isSleeping(id) { throw new Error('Not implemented'); }
}
