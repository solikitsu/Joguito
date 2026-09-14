import { CONFIG } from './Config';
import type { CharacterBody } from './types';

export function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}

export class Physics {
  static move(body: CharacterBody, desired: number, dt: number, acceleration = CONFIG.acceleration as number) {
    body.vx = approach(body.vx, desired, (desired === 0 ? CONFIG.deceleration : acceleration) * dt);
  }

  static integrate(body: CharacterBody, dt: number) {
    body.x += body.vx * dt;
    if (!body.grounded) {
      body.vy += CONFIG.gravity * dt;
      body.y += body.vy * dt;
      if (body.y >= CONFIG.ground) {
        body.y = CONFIG.ground; body.vy = 0; body.grounded = true;
      }
    }
    const clamped = Math.max(CONFIG.leftWall, Math.min(CONFIG.rightWall, body.x));
    if (clamped !== body.x) body.vx = 0;
    body.x = clamped;
  }

  static separate(a: CharacterBody, b: CharacterBody, allowPass: boolean) {
    if (allowPass) return;
    if (a.y - a.height >= b.y || b.y - b.height >= a.y) return;
    const gap = (a.width + b.width) / 2;
    const distance = b.x - a.x;
    if (Math.abs(distance) >= gap) return;
    const push = (gap - Math.abs(distance)) / 2;
    const sign = distance >= 0 ? 1 : -1;
    a.x = Math.max(CONFIG.leftWall, Math.min(CONFIG.rightWall, a.x - push * sign));
    b.x = Math.max(CONFIG.leftWall, Math.min(CONFIG.rightWall, b.x + push * sign));
  }
}