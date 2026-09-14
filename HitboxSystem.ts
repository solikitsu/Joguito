import type { Capsule, Hurtbox, ParryBox, Pose } from './types';

export function capsule(radius = 5): Capsule {
  return { ax: 0, ay: 0, bx: 0, by: 0, pax: 0, pay: 0, pbx: 0, pby: 0, radius };
}

export function setCapsule(c: Capsule, ax: number, ay: number, bx: number, by: number, reset = false) {
  c.pax = reset ? ax : c.ax; c.pay = reset ? ay : c.ay;
  c.pbx = reset ? bx : c.bx; c.pby = reset ? by : c.by;
  c.ax = ax; c.ay = ay; c.bx = bx; c.by = by;
}

function pointSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
  const x = ax + t * dx - px, y = ay + t * dy - py;
  return x * x + y * y;
}

export function segmentDistanceSq(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const abx = bx - ax, aby = by - ay, cdx = dx - cx, cdy = dy - cy;
  const cross = abx * cdy - aby * cdx;
  if (Math.abs(cross) > 0.000001) {
    const acx = cx - ax, acy = cy - ay;
    const t = (acx * cdy - acy * cdx) / cross;
    const u = (acx * aby - acy * abx) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(
    pointSegmentSq(ax, ay, cx, cy, dx, dy), pointSegmentSq(bx, by, cx, cy, dx, dy),
    pointSegmentSq(cx, cy, ax, ay, bx, by), pointSegmentSq(dx, dy, ax, ay, bx, by),
  );
}

export function capsulesOverlap(a: Capsule, b: Capsule) {
  const radius = a.radius + b.radius;
  return segmentDistanceSq(a.ax, a.ay, a.bx, a.by, b.ax, b.ay, b.bx, b.by) <= radius * radius;
}

// Subdivide the relative sweep, not just the final blade position. No temporary shapes are allocated.
export function sweptCapsules(a: Capsule, b: Capsule) {
  const radius = a.radius + b.radius;
  const travel = Math.max(
    Math.hypot(a.ax - a.pax - (b.ax - b.pax), a.ay - a.pay - (b.ay - b.pay)),
    Math.hypot(a.bx - a.pbx - (b.bx - b.pbx), a.by - a.pby - (b.by - b.pby)),
  );
  const steps = Math.max(1, Math.min(32, Math.ceil(travel / Math.max(2, radius * 0.65))));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (segmentDistanceSq(
      a.pax + (a.ax - a.pax) * t, a.pay + (a.ay - a.pay) * t,
      a.pbx + (a.bx - a.pbx) * t, a.pby + (a.by - a.pby) * t,
      b.pax + (b.ax - b.pax) * t, b.pay + (b.ay - b.pay) * t,
      b.pbx + (b.bx - b.pbx) * t, b.pby + (b.by - b.pby) * t,
    ) <= radius * radius) return true;
  }
  return false;
}

export class HitboxSystem {
  static createHurtboxes(): Hurtbox[] {
    return [
      { ...capsule(13), part: 'head' }, { ...capsule(17), part: 'torso' },
      { ...capsule(7), part: 'arm' }, { ...capsule(7), part: 'arm' },
      { ...capsule(7), part: 'arm' }, { ...capsule(7), part: 'arm' },
      { ...capsule(9), part: 'leg' }, { ...capsule(8), part: 'leg' },
      { ...capsule(9), part: 'leg' }, { ...capsule(8), part: 'leg' },
    ];
  }

  static sync(p: Pose, boxes: Hurtbox[], parry: ParryBox, facing: number, guarding: boolean, reset = false) {
    setCapsule(boxes[0], p.head.x, p.head.y, p.head.x, p.head.y, reset);
    setCapsule(boxes[1], p.neck.x, p.neck.y + 5, p.hip.x, p.hip.y, reset);
    setCapsule(boxes[2], p.shoulder.x, p.shoulder.y, p.elbow.x, p.elbow.y, reset);
    setCapsule(boxes[3], p.elbow.x, p.elbow.y, p.hand.x, p.hand.y, reset);
    setCapsule(boxes[4], p.backShoulder.x, p.backShoulder.y, p.backElbow.x, p.backElbow.y, reset);
    setCapsule(boxes[5], p.backElbow.x, p.backElbow.y, p.backHand.x, p.backHand.y, reset);
    setCapsule(boxes[6], p.hip.x, p.hip.y, p.knee.x, p.knee.y, reset);
    setCapsule(boxes[7], p.knee.x, p.knee.y, p.foot.x, p.foot.y, reset);
    setCapsule(boxes[8], p.hip.x, p.hip.y, p.backKnee.x, p.backKnee.y, reset);
    setCapsule(boxes[9], p.backKnee.x, p.backKnee.y, p.backFoot.x, p.backFoot.y, reset);
    parry.enabled = guarding;
    setCapsule(parry, p.hip.x + facing * 39, p.head.y - 11, p.hip.x + facing * 39, p.hip.y + 42, reset);
  }
}