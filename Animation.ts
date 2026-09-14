import type { Fighter } from './Fighter';
import type { Point } from './types';

const TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => v * v * (3 - 2 * v);

function place(point: Point, fighter: Fighter, x: number, y: number) {
  point.x = fighter.x + x * fighter.facing;
  point.y = fighter.y + y;
}

function elbow(result: Point, shoulder: Point, hand: Point, bend: number) {
  const dx = hand.x - shoulder.x, dy = hand.y - shoulder.y;
  const distance = Math.max(0.001, Math.hypot(dx, dy));
  const height = Math.sqrt(Math.max(0, 35 * 35 - distance * distance / 4));
  result.x = (shoulder.x + hand.x) / 2 - dy / distance * height * bend;
  result.y = (shoulder.y + hand.y) / 2 + dx / distance * height * bend;
}

function footPosition(point: Point, f: Fighter, phase: number, spread: number, moving: boolean, front: boolean) {
  if (!moving) { place(point, f, (front ? 1 : -0.86) * spread, 0); return; }
  const p = ((phase % 1) + 1) % 1;
  const x = p < 0.6 ? spread - 2 * spread * (p / 0.6) : -spread + 2 * spread * ((p - 0.6) / 0.4);
  const y = p < 0.6 ? 0 : -Math.sin((p - 0.6) / 0.4 * Math.PI) * (f.running ? 27 : 18);
  place(point, f, x * Math.sign(f.body.vx * f.facing || 1), y);
}

export class Animation {
  static update(f: Fighter, time: number, dt: number) {
    const p = f.pose;
    const weapon = f.weapon.data;
    const walking = Math.abs(f.body.vx) > 8 && (f.state === 'move' || f.state === 'crouch');
    const spread = f.data.spread * (f.running ? 1.22 : 1);
    if (walking) f.walkCycle += Math.abs(f.body.vx) * dt * 0.6 / (2 * spread);
    const breath = Math.sin(time * f.data.idleSpeed + f.data.spread) * f.data.idleAmount;
    const bounce = walking ? Math.cos(f.walkCycle * TAU * 2) * 2.5 : breath;
    let lean = f.data.stance * 30;
    let drop = f.state === 'crouch' ? 34 : f.state === 'dodge' ? 49 : 0;
    let handX = weapon.id === 'gauntlets' ? 45 : weapon.id === 'spear' ? 35 : 43;
    let handY = weapon.id === 'gauntlets' ? -133 : weapon.id === 'spear' ? -96 : -107;
    let backHandX = weapon.id === 'gauntlets' ? 15 : 17;
    let backHandY = weapon.id === 'gauntlets' ? -126 : -93;
    const idleAngle = weapon.id === 'spear' ? -0.12 : weapon.id === 'axe' ? -1.12 : weapon.id === 'katana' ? -0.31 : weapon.id === 'gauntlets' ? -0.12 : -0.58;
    let angle = idleAngle + breath * 0.012;
    const reach = weapon.reach * f.weapon.reachMultiplier;
    let rearPunch = false;

    if (f.state === 'guard') {
      lean -= 4;
      handX = 42; handY = -122;
      backHandX = 25; backHandY = -116;
      angle = weapon.id === 'gauntlets' ? -0.95 : -1.33;
    } else if (f.state === 'dodge') {
      lean += 28;
      handX = 38; handY = -105;
      backHandX = -29; backHandY = -87;
      angle = 0.35;
    } else if (f.state === 'attack' && f.attackData) {
      const a = f.attackData;
      // Extra attack reach comes from extension and footwork, never a growing blade.
      const extensionBonus = Math.min(10, Math.max(0, a.reach - weapon.reach) * 0.4);
      const active = clamp((f.attackTime - f.startup) / a.active);
      const startup = smooth(clamp(f.attackTime / f.startup));
      const recovery = smooth(clamp((f.attackTime - f.startup - a.active) / a.recovery));
      const low = a.direction === 'down', high = a.direction === 'up';
      const baseY = low ? -63 : high ? -127 : -110;
      const idleHandX = handX, idleHandY = handY;
      if (a.motion === 'thrust' || a.motion === 'punch') {
        const extension = Math.sin(active * Math.PI / 2);
        rearPunch = a.motion === 'punch' && !a.heavy && f.comboIndex % 2 === 1;
        const hook = a.motion === 'punch' && !a.heavy && f.comboIndex === 2 && !high && !low;
        const targetX = (a.motion === 'punch' ? rearPunch ? 82 : 76 : 72) + (a.heavy ? 7 : 0) + extensionBonus;
        const windupX = a.heavy ? 7 : 20;
        const targetY = high && a.motion === 'punch' ? mix(baseY, -167, extension) : hook ? baseY - Math.sin(active * Math.PI) * 30 : baseY;
        const targetAngle = high ? -0.35 - (a.motion === 'punch' ? active * 0.65 : 0) : low ? 0.18 : hook ? -0.6 + active * 0.9 : -0.06;
        handX = f.phase === 'startup' ? mix(idleHandX, windupX, startup) : mix(mix(windupX, targetX, extension), idleHandX, recovery);
        handY = f.phase === 'startup' ? mix(idleHandY, baseY, startup) : mix(targetY, idleHandY, recovery);
        angle = f.phase === 'startup' ? mix(idleAngle, high ? -0.35 : low ? 0.18 : hook ? -0.6 : -0.06, startup) : mix(targetAngle, idleAngle, recovery);
        lean += f.phase === 'startup' ? -9 * startup : mix(-9, rearPunch ? 17 : 11, smooth(clamp(active * 2))) * (1 - recovery);
      } else {
        const targetAngle = mix(a.startAngle, a.endAngle, smooth(active));
        angle = f.phase === 'startup' ? mix(idleAngle, a.startAngle, startup) : mix(targetAngle, idleAngle, recovery);
        const windupX = a.heavy ? 5 : 25, windupY = a.heavy ? -143 : baseY - 8;
        const extension = smooth(clamp(active * 2));
        handX = f.phase === 'startup' ? mix(idleHandX, windupX, startup) : mix(mix(windupX, 45 + extensionBonus, extension) + Math.sin(active * Math.PI) * 19, idleHandX, recovery);
        handY = f.phase === 'startup' ? mix(idleHandY, windupY, startup) : mix(mix(windupY, baseY, extension) + Math.sin(active * Math.PI) * 6, idleHandY, recovery);
        lean += f.phase === 'startup' ? -startup * (a.heavy ? 14 : 6) : mix(a.heavy ? -14 : -6, 15, extension) * (1 - recovery);
        drop += a.heavy ? (f.phase === 'startup' ? startup : (1 - active) * (1 - recovery)) * 7 : 0;
      }
      if (weapon.id === 'spear' || weapon.id === 'axe' || a.heavy && weapon.id === 'sword') {
        backHandX = handX - Math.cos(angle) * 25;
        backHandY = handY - Math.sin(angle) * 25;
      } else if (weapon.id === 'gauntlets') {
        backHandX = 16; backHandY = -128;
      } else { backHandX = -12; backHandY = -100; }
    } else if (f.state === 'stun' || f.state === 'guardbreak') {
      const recoil = Math.sin(Math.min(1, f.stateTime / f.stunDuration) * Math.PI);
      lean -= 22 * recoil; drop += f.state === 'guardbreak' ? 24 : 5;
      angle = -2.2 + recoil * 0.4;
      handX = 17; handY = -105;
      backHandX = -27; backHandY = -111;
    } else if (f.state === 'victory') {
      const salute = smooth(clamp(f.stateTime / (0.61 + Math.abs(f.data.stance))));
      if (weapon.id === 'gauntlets') {
        handX = mix(handX, 36, salute); handY = mix(handY, -193, salute);
        backHandX = -30; backHandY = mix(-110, -188, salute); angle = -1.5;
      } else if (weapon.id === 'katana' || weapon.id === 'dagger') {
        handX = 28; handY = -83; angle = mix(idleAngle, 0.24, salute);
      } else { handX = 28 + f.data.spread * 0.13; handY = mix(handY, -151 - f.data.idleAmount * 2, salute); angle = mix(idleAngle, -1.5 + f.data.stance * 0.5, salute); }
      lean = 0;
    } else if (f.state === 'defeat') {
      const collapse = smooth(clamp(f.stateTime / (0.65 + f.data.stance)));
      drop = collapse * (57 + f.data.idleAmount * 2);
      lean = collapse * 31;
      handX = 43; handY = -70; angle = mix(idleAngle, 0.2, collapse);
      backHandX = -12; backHandY = -72;
    }

    const bodyY = drop + bounce;
    place(p.hip, f, lean * 0.35, -73 + bodyY);
    place(p.neck, f, lean, -142 + bodyY);
    place(p.head, f, lean + 3, -159 + bodyY);
    place(p.shoulder, f, lean + 5, -129 + bodyY);
    place(p.backShoulder, f, lean + (rearPunch ? 4 : -10), -130 + bodyY);
    place(p.hand, f, (rearPunch ? backHandX : handX) + lean * 0.4, (rearPunch ? backHandY : handY) + bodyY);
    place(p.backHand, f, (rearPunch ? handX : backHandX) + lean * 0.4, (rearPunch ? handY : backHandY) + bodyY);
    elbow(p.elbow, p.shoulder, p.hand, f.facing);
    elbow(p.backElbow, p.backShoulder, p.backHand, f.facing);
    footPosition(p.foot, f, f.walkCycle, spread, walking, true);
    footPosition(p.backFoot, f, f.walkCycle + 0.5, spread, walking, false);
    if (f.state === 'dodge') {
      place(p.foot, f, spread + 24, 0);
      place(p.backFoot, f, -spread - 9, 0);
    }
    if (!f.body.grounded) {
      p.foot.y -= 17; p.backFoot.y -= 32;
      p.backFoot.x += 16 * f.facing;
    }
    p.knee.x = mix(p.hip.x, p.foot.x, 0.5) + f.facing * (drop > 20 ? 15 : 7);
    p.knee.y = mix(p.hip.y, p.foot.y, 0.52) - (drop > 20 ? 8 : 0);
    p.backKnee.x = mix(p.hip.x, p.backFoot.x, 0.5) - f.facing * 6;
    p.backKnee.y = mix(p.hip.y, p.backFoot.y, 0.5);
    const weaponHand = rearPunch ? p.backHand : p.hand;
    p.weaponBase.x = weaponHand.x;
    p.weaponBase.y = weaponHand.y;
    p.weaponTip.x = weaponHand.x + Math.cos(angle) * reach * f.facing;
    p.weaponTip.y = weaponHand.y + Math.sin(angle) * reach;
    p.weaponAngle = f.facing > 0 ? angle : Math.PI - angle;
  }
}