import { CONFIG } from './Config';
import type { Fighter } from './Fighter';
import type { Capsule, Point } from './types';

const INK = '#101715';

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, color: string, outline = true) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  if (outline) { ctx.strokeStyle = INK; ctx.lineWidth = width + 4; ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function local(ctx: CanvasRenderingContext2D, f: Fighter) { ctx.translate(f.x, f.y); ctx.scale(f.facing, 1); }
function lx(f: Fighter, p: Point) { return (p.x - f.x) * f.facing; }
function ly(f: Fighter, p: Point) { return p.y - f.y; }

export function drawWeapon(ctx: CanvasRenderingContext2D, f: Fighter, time: number) {
  const p = f.pose, kind = f.weapon.data.id;
  const base = p.weaponBase, tip = p.weaponTip;
  const length = Math.hypot(tip.x - base.x, tip.y - base.y);
  ctx.save(); ctx.translate(base.x, base.y); ctx.rotate(p.weaponAngle);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'gauntlets') {
    ctx.fillStyle = f.data.accessory === 'mechanical' ? '#657675' : '#93a3a0';
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(length - 6, -13); ctx.lineTo(length + 2, -7);
    ctx.lineTo(length + 2, 9); ctx.lineTo(length - 8, 13); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d0d5c6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, -7); ctx.lineTo(length - 5, -8); ctx.moveTo(length - 3, -5); ctx.lineTo(length - 3, 6); ctx.stroke();
    ctx.fillStyle = f.data.primary; ctx.fillRect(-9, -9, 9, 18);
    if (f.data.id === 'hex') { ctx.fillStyle = '#e3745e'; ctx.fillRect(8, -3, 10, 4); }
  } else if (kind === 'spear') {
    ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-59, 0); ctx.lineTo(length - 22, 0); ctx.stroke();
    ctx.strokeStyle = '#87775a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#bac7c0';
    ctx.beginPath(); ctx.moveTo(length - 35, -7); ctx.lineTo(length, 0); ctx.lineTo(length - 35, 7); ctx.lineTo(length - 27, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e6e5ce'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(length - 34, -6); ctx.lineTo(length, 0); ctx.stroke();
    ctx.fillStyle = f.data.accent; ctx.fillRect(length - 43, -4, 8, 8);
    ctx.beginPath(); ctx.moveTo(length - 40, 4); ctx.quadraticCurveTo(length - 46, 17, length - 58 + Math.sin(time * 3) * 4, 20); ctx.lineTo(length - 43, 12); ctx.closePath(); ctx.fill();
  } else if (kind === 'axe') {
    ctx.strokeStyle = INK; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(length - 5, 0); ctx.stroke();
    ctx.strokeStyle = '#887256'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#8a9790'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(length - 23, -10); ctx.lineTo(length - 9, -29);
    ctx.quadraticCurveTo(length + 15, -17, length + 12, 19); ctx.lineTo(length - 12, 28); ctx.lineTo(length - 23, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#dedfcb'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(length - 8, -27); ctx.quadraticCurveTo(length + 13, -15, length + 10, 17); ctx.lineTo(length - 12, 26); ctx.stroke();
    ctx.fillStyle = '#b49c6e'; ctx.fillRect(length - 26, -6, 12, 12);
  } else {
    ctx.strokeStyle = INK; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-19, 0); ctx.lineTo(5, 0); ctx.stroke();
    ctx.strokeStyle = '#706b58'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = f.data.id === 'shiro' ? '#af9870' : '#a9a88b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(1, -10); ctx.lineTo(1, 10); ctx.stroke();
    ctx.fillStyle = f.data.id === 'cain' ? '#303b3e' : '#b9c7c1';
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(5, -3.5);
    if (kind === 'katana') ctx.quadraticCurveTo(length * 0.6, -4, length, 0);
    else ctx.lineTo(length, 0);
    if (kind === 'katana') ctx.quadraticCurveTo(length * 0.6, 2, 5, 3);
    else { ctx.lineTo(length - (kind === 'dagger' ? 16 : 14), 3.5); ctx.lineTo(5, 3.5); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e5e7d4'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(7, -2.5);
    if (kind === 'katana') ctx.quadraticCurveTo(length * 0.6, -3, length - 1, 0);
    else ctx.lineTo(length - 2, 0);
    ctx.stroke();
    if (f.state === 'idle' || f.state === 'guard') {
      const glint = (time * 0.11 + f.data.stance) % 1;
      if (glint < 0.64) {
        const x = 10 + glint / 0.64 * (length - 15);
        ctx.globalAlpha *= Math.sin(glint / 0.64 * Math.PI) * 0.7;
        ctx.strokeStyle = '#fbf3d9'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, -7); ctx.lineTo(x, 6); ctx.moveTo(x - 5, 0); ctx.lineTo(x + 5, 0); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export function drawFighter(ctx: CanvasRenderingContext2D, f: Fighter, time: number, shadow = true) {
  const p = f.pose, d = f.data, style = d.outfit;
  const hx = lx(f, p.hip), hy = ly(f, p.hip), nx = lx(f, p.neck), ny = ly(f, p.neck);
  const broad = style === 'vest' || style === 'fur' || style === 'armor' || style === 'apron';
  const width = broad ? 25 : 20;
  const wind = Math.sin(time * 2.1 + d.spread) * 4 + f.body.vx * f.facing * 0.035;

  ctx.save();
  if (f.invulnerable) ctx.globalAlpha = 0.57;
  if (shadow) {
    ctx.save(); ctx.globalAlpha *= 0.43; ctx.fillStyle = '#0b100f';
    ctx.beginPath(); ctx.ellipse(f.x, CONFIG.ground + 3, 48 - Math.min(23, (CONFIG.ground - f.y) * 0.09), 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Garment silhouettes are built around the animated skeleton, not substituted sprites.
  ctx.save(); local(ctx, f); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  if (style === 'cape' || style === 'robes' || style === 'hood' || d.accessory === 'short-cape') {
    ctx.fillStyle = d.id === 'talos' ? d.secondary : d.primary;
    ctx.beginPath(); ctx.moveTo(nx - 11, ny + 5); ctx.lineTo(nx - 27, ny + 14);
    ctx.quadraticCurveTo(hx - 37 - wind, hy + 6, hx - 51 - wind, hy + 55);
    ctx.lineTo(hx - 26 - wind, hy + 45); ctx.lineTo(hx - 6, hy + 53); ctx.lineTo(hx + 9, hy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = d.secondary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx - 18, ny + 22); ctx.quadraticCurveTo(hx - 25 - wind, hy, hx - 30 - wind, hy + 35); ctx.stroke();
  }
  if (style === 'coat' || style === 'haori' || style === 'apron') {
    const tail = d.id === 'cain' || d.id === 'vesper' ? 65 : style === 'haori' ? 32 : style === 'apron' ? 58 : 52;
    ctx.fillStyle = d.primary; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx - 19, hy - 10); ctx.lineTo(hx + 17, hy - 10);
    ctx.lineTo(hx + 31 - wind * 0.35, hy + tail - 7); ctx.lineTo(hx + 12, hy + tail);
    ctx.lineTo(hx + 4, hy + 10); ctx.lineTo(hx - 3 - wind * 0.3, hy + tail + 3);
    ctx.lineTo(hx - 35 - wind, hy + tail - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = d.secondary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - 13, hy + 3); ctx.lineTo(hx - 20 - wind * 0.6, hy + tail - 5); ctx.stroke();
  }
  ctx.restore();

  const pants = d.id === 'knuck' ? '#424742' : d.id === 'shiro' ? '#4b5350' : d.secondary;
  line(ctx, p.hip, p.backKnee, d.id === 'knuck' ? 23 : 15, pants);
  line(ctx, p.backKnee, p.backFoot, d.id === 'knuck' ? 19 : 12, pants);
  line(ctx, p.hip, p.knee, d.id === 'knuck' ? 24 : 16, pants);
  line(ctx, p.knee, p.foot, d.id === 'knuck' ? 20 : 13, pants);
  for (let footIndex = 0; footIndex < 2; footIndex++) {
    const front = footIndex === 1;
    const foot = front ? p.foot : p.backFoot;
    const knee = front ? p.knee : p.backKnee;
    ctx.strokeStyle = '#202927'; ctx.lineWidth = d.id === 'sylva' ? 15 : 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(foot.x + (knee.x - foot.x) * (d.id === 'sylva' ? 0.72 : 0.47), foot.y + (knee.y - foot.y) * (d.id === 'sylva' ? 0.72 : 0.47));
    ctx.lineTo(foot.x, foot.y - 4); ctx.lineTo(foot.x + f.facing * 10, foot.y - 3); ctx.stroke();
    ctx.strokeStyle = '#8c9180'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(foot.x - 4 * f.facing, foot.y + 2); ctx.lineTo(foot.x + 12 * f.facing, foot.y + 2); ctx.stroke();
  }

  const bareArms = style === 'vest' || style === 'fur' || d.id === 'raze' || d.id === 'knuck' || d.id === 'volt';
  line(ctx, p.backShoulder, p.backElbow, style === 'haori' ? 23 : bareArms ? 17 : 16, bareArms ? d.skin : d.primary);
  line(ctx, p.backElbow, p.backHand, bareArms ? 14 : 12, bareArms ? d.skin : d.secondary);

  if (f.weapon.data.id === 'dagger') {
    const h = p.backHand;
    ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x - 22 * f.facing, h.y + 31); ctx.stroke();
    ctx.strokeStyle = '#b6c5bd'; ctx.lineWidth = 3; ctx.stroke();
  }
  if (f.weapon.data.id === 'gauntlets') {
    ctx.fillStyle = d.id === 'volt' || d.id === 'knuck' ? d.accent : '#879692'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(p.backHand.x - 10, p.backHand.y - 12, 23, 24, 5); ctx.fill(); ctx.stroke();
  }

  ctx.save(); local(ctx, f); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.fillStyle = d.primary;
  ctx.beginPath(); ctx.moveTo(nx - 8, ny - 1); ctx.lineTo(nx - width, ny + 11);
  ctx.lineTo(hx - width + 3, hy + 5); ctx.lineTo(hx + width, hy + 3);
  ctx.lineTo(nx + width + 2, ny + 13); ctx.lineTo(nx + 10, ny); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = d.secondary;
  ctx.beginPath(); ctx.moveTo(nx - 3, ny + 4); ctx.lineTo(nx + 12, ny + 13); ctx.lineTo(hx + 9, hy - 2); ctx.lineTo(hx - 7, hy - 2); ctx.closePath(); ctx.fill();
  if (style === 'coat' || style === 'haori' || style === 'jacket' || style === 'vest') {
    ctx.strokeStyle = style === 'haori' ? '#ede8cf' : '#889387'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(nx - 8, ny + 3); ctx.lineTo(nx - 1, ny + 28); ctx.lineTo(hx + 7, hy - 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx + 10, ny + 5); ctx.lineTo(nx + 4, ny + 27); ctx.stroke();
  }
  if (style === 'armor' || d.id === 'solen' || d.id === 'sylva' || d.id === 'morv') {
    ctx.fillStyle = d.id === 'talos' || d.id === 'solen' ? '#a89965' : '#687774';
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx - 14, ny + 18); ctx.lineTo(nx + 15, ny + 17); ctx.lineTo(hx + 16, hy - 15); ctx.lineTo(hx + 3, hy - 6); ctx.lineTo(hx - 13, hy - 15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = d.accent;
    ctx.beginPath(); ctx.moveTo(nx + 1, ny + 20); ctx.lineTo(hx + 2, hy - 12); ctx.moveTo(hx - 12, hy - 21); ctx.lineTo(hx + 14, hy - 23); ctx.stroke();
  }
  if (d.id === 'kiro') {
    ctx.strokeStyle = '#9b8462'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(nx - 14, ny + 11); ctx.lineTo(hx + 16, hy - 8); ctx.moveTo(nx + 17, ny + 12); ctx.lineTo(hx - 15, hy - 12); ctx.stroke();
  }
  ctx.fillStyle = d.id === 'shiro' ? '#9a9275' : d.accent;
  ctx.beginPath(); ctx.moveTo(hx - 20, hy - 10); ctx.lineTo(hx + 20, hy - 12); ctx.lineTo(hx + 21, hy - 3); ctx.lineTo(hx - 20, hy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#bcb48c'; ctx.fillRect(hx + 5, hy - 10, 6, 8);
  if (d.id === 'garr') {
    ctx.strokeStyle = '#a9b0a0'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.ellipse(hx - 19 + i * 6, hy + 5 + Math.sin(i / 6 * Math.PI) * 6, 4, 3, -0.25, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (d.id === 'volt') {
    ctx.strokeStyle = d.accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(nx + 9, ny + 19); ctx.lineTo(nx - 1, ny + 33); ctx.lineTo(nx + 8, ny + 31); ctx.lineTo(hx - 2, hy - 20); ctx.stroke();
  }
  if (d.id === 'kael' || d.id === 'akari' || d.id === 'yurei') {
    ctx.fillStyle = d.accent;
    ctx.beginPath(); ctx.moveTo(hx - 15, hy - 7); ctx.quadraticCurveTo(hx - 38 - wind, hy + 8, hx - 70 - wind * 1.4, hy - 3 + Math.sin(time * 3) * 5);
    ctx.lineTo(hx - 59 - wind, hy + 11); ctx.quadraticCurveTo(hx - 32, hy + 19, hx - 13, hy + 1); ctx.closePath(); ctx.fill();
  }
  if (style === 'fur') {
    ctx.fillStyle = '#8a8068'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx - 12, ny); ctx.lineTo(nx - 29, ny + 7); ctx.lineTo(nx - 31, ny + 25);
    ctx.lineTo(nx - 23, ny + 21); ctx.lineTo(nx - 17, ny + 29); ctx.lineTo(nx - 8, ny + 17);
    ctx.lineTo(nx + 6, ny + 22); ctx.lineTo(nx + 18, ny + 13); ctx.lineTo(nx + 24, ny + 24); ctx.lineTo(nx + 28, ny + 8); ctx.lineTo(nx + 9, ny - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  const forearmColor = bareArms ? d.skin : d.primary;
  line(ctx, p.shoulder, p.elbow, style === 'haori' ? 25 : broad ? 20 : 17, bareArms ? d.skin : d.primary);
  line(ctx, p.elbow, p.hand, broad ? 15 : 12, forearmColor);
  if (d.id === 'bramm' || d.id === 'knuck' || d.id === 'volt' || d.id === 'hex') {
    ctx.strokeStyle = d.id === 'bramm' ? '#726c58' : d.id === 'hex' ? '#889c97' : d.accent;
    ctx.lineWidth = d.id === 'bramm' ? 24 : 17;
    ctx.beginPath(); ctx.moveTo(p.elbow.x * 0.65 + p.hand.x * 0.35, p.elbow.y * 0.65 + p.hand.y * 0.35); ctx.lineTo(p.hand.x, p.hand.y); ctx.stroke();
    ctx.strokeStyle = '#e0d5b2'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      const t = i / 4;
      const x = p.elbow.x + (p.hand.x - p.elbow.x) * t, y = p.elbow.y + (p.hand.y - p.elbow.y) * t;
      ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 3, y + 6); ctx.stroke();
    }
  }
  ctx.fillStyle = d.id === 'vesper' ? '#101717' : '#2e3530';
  ctx.beginPath(); ctx.arc(p.hand.x, p.hand.y, 7.5, 0, Math.PI * 2); ctx.fill();
  if (f.weapon.data.id === 'gauntlets') {
    ctx.fillStyle = d.id === 'volt' || d.id === 'knuck' ? d.accent : '#879692'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(p.hand.x - 11, p.hand.y - 12, 24, 24, 5); ctx.fill(); ctx.stroke();
  }

  if (d.accessory === 'single-pauldron' || d.id === 'talos' || d.id === 'morv' || d.id === 'aurex') {
    ctx.save(); local(ctx, f);
    ctx.fillStyle = d.id === 'talos' ? '#ba9e62' : '#707d75'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(nx - 6, ny + 3); ctx.lineTo(nx + 18, ny + 5); ctx.lineTo(nx + 31, ny + 17); ctx.lineTo(nx + 23, ny + 27); ctx.lineTo(nx + 4, ny + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#bac0a3'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(nx - 2, ny + 6); ctx.lineTo(nx + 16, ny + 8); ctx.lineTo(nx + 26, ny + 17); ctx.stroke();
    ctx.restore();
  }

  ctx.save(); ctx.translate(p.head.x, p.head.y); ctx.scale(f.facing, 1);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  const hood = style === 'hood' || d.id === 'moth' || d.id === 'morv';
  if (hood) {
    ctx.fillStyle = d.primary;
    ctx.beginPath(); ctx.moveTo(-21, 12); ctx.lineTo(-19, -9); ctx.lineTo(-6, -24); ctx.lineTo(13, -18); ctx.lineTo(24, 4); ctx.lineTo(12, 19); ctx.lineTo(-10, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = hood ? '#242a28' : d.skin;
  ctx.beginPath(); ctx.moveTo(-9, -10); ctx.quadraticCurveTo(2, -17, 11, -8); ctx.lineTo(12, -1); ctx.lineTo(17, 3); ctx.lineTo(12, 6); ctx.lineTo(10, 13); ctx.lineTo(1, 15); ctx.lineTo(-11, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!hood) {
    ctx.fillStyle = d.id === 'yurei' ? '#a5aaa0' : d.id === 'shiro' ? '#888d7f' : d.id === 'cain' ? '#92968a' : '#18201e';
    ctx.beginPath(); ctx.moveTo(-13, 4); ctx.lineTo(-16, -8); ctx.lineTo(-10, -16); ctx.lineTo(-14, -20); ctx.lineTo(-3, -17); ctx.lineTo(6, -21); ctx.lineTo(9, -15); ctx.lineTo(17, -12); ctx.lineTo(12, -6); ctx.lineTo(4, -9); ctx.lineTo(-6, -4); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = hood ? d.accent : '#e0d3b3'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(7, -1); ctx.lineTo(12, -1); ctx.stroke();
  if (d.id === 'shiro') {
    ctx.fillStyle = '#e5e3ce'; ctx.strokeStyle = '#7e8374'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(12, -7); ctx.lineTo(18, 2); ctx.lineTo(11, 6); ctx.lineTo(12, 11); ctx.lineTo(6, 8); ctx.lineTo(1, 12); ctx.lineTo(3, 3); ctx.lineTo(-1, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#343d37'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(13, 0); ctx.moveTo(5, -8); ctx.lineTo(7, -4); ctx.lineTo(4, 3); ctx.stroke();
  } else if (d.id === 'kiro' || d.id === 'nyx') {
    ctx.fillStyle = d.id === 'nyx' ? '#302638' : '#494d42';
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(14, 3); ctx.lineTo(9, 14); ctx.lineTo(-7, 11); ctx.closePath(); ctx.fill();
  } else if (d.id === 'moth') {
    ctx.fillStyle = '#c6c0a3'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(10, -14); ctx.lineTo(18, -2); ctx.lineTo(8, 20); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#252c26'; ctx.beginPath(); ctx.ellipse(7, 0, 4, 7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b7b49a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-10, -25); ctx.moveTo(8, -14); ctx.lineTo(12, -26); ctx.stroke();
  } else if (d.id === 'drak') {
    ctx.fillStyle = '#7a8984'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(12, -9); ctx.lineTo(17, 6); ctx.lineTo(10, 17); ctx.lineTo(-4, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#232e2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(12, -1); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(5, 12); ctx.moveTo(8, 5); ctx.lineTo(9, 11); ctx.stroke();
  } else if (d.id === 'hex') {
    ctx.fillStyle = '#343f3c'; ctx.fillRect(-5, -8, 21, 12);
    ctx.fillStyle = '#ed725d'; ctx.fillRect(1, -5, 16, 4);
  } else if (d.id === 'flick') {
    ctx.strokeStyle = '#443e2c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(12, -11); ctx.stroke();
    ctx.fillStyle = '#b6a16c'; ctx.beginPath(); ctx.arc(8, -12, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-1, -12, 4.5, 0, Math.PI * 2); ctx.fill();
  } else if (d.id === 'cain') {
    ctx.strokeStyle = '#8f5445'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(4, 8); ctx.stroke();
  }
  if (d.id === 'akari' || d.id === 'rei' || d.id === 'volt') {
    ctx.strokeStyle = d.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(13, -8); ctx.stroke();
  }
  ctx.restore();

  if (d.id === 'flick' || d.id === 'dante' || d.id === 'yurei') {
    ctx.save(); local(ctx, f); ctx.fillStyle = d.accent;
    ctx.beginPath(); ctx.moveTo(nx - 14, ny - 1); ctx.lineTo(nx + 13, ny + 2); ctx.lineTo(nx + 10, ny + 11); ctx.lineTo(nx - 13, ny + 13); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(nx - 12, ny + 2); ctx.quadraticCurveTo(nx - 46 - wind, ny + 11, nx - (d.id === 'flick' ? 88 : 60) - wind, ny - 2 + Math.sin(time * 2.5) * 6);
    ctx.lineTo(nx - 65 - wind, ny + 15); ctx.quadraticCurveTo(nx - 33, ny + 24, nx - 10, ny + 10); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  drawWeapon(ctx, f, time);
  if (f.flashTime > 0) {
    ctx.globalAlpha = f.flashTime * 2.1;
    ctx.strokeStyle = '#f4c2a1'; ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(p.neck.x, p.neck.y + 9); ctx.lineTo(p.hip.x, p.hip.y); ctx.stroke();
  }
  ctx.restore();
}

function debugCapsule(ctx: CanvasRenderingContext2D, c: Capsule, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = c.radius * 2; ctx.lineCap = 'round'; ctx.globalAlpha = 0.2;
  ctx.beginPath(); ctx.moveTo(c.ax, c.ay); ctx.lineTo(c.bx + 0.01, c.by); ctx.stroke();
  ctx.globalAlpha = 0.95; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c.ax, c.ay, c.radius, 0, Math.PI * 2); ctx.arc(c.bx, c.by, c.radius, 0, Math.PI * 2); ctx.moveTo(c.ax, c.ay); ctx.lineTo(c.bx, c.by); ctx.stroke();
}

export function drawDebug(ctx: CanvasRenderingContext2D, f: Fighter, now: number, parryWindow: number) {
  ctx.save();
  for (const box of f.hurtboxes) debugCapsule(ctx, box, box.part === 'head' ? '#e4df81' : '#80d9a5');
  debugCapsule(ctx, f.weapon.hitbox, f.weapon.hitbox.active ? '#ff8159' : '#859c98');
  ctx.strokeStyle = '#d3a8eb'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  ctx.strokeRect(f.x - f.body.width / 2, f.y - f.body.height, f.body.width, f.body.height); ctx.setLineDash([]);
  if (f.parryBox.enabled) debugCapsule(ctx, f.parryBox, now - f.guardStartedAt <= parryWindow ? '#b8eff5' : '#e5bd75');
  ctx.fillStyle = '#101b18'; ctx.globalAlpha = 0.92; ctx.fillRect(f.x - 95, f.pose.head.y - 85, 190, 45); ctx.globalAlpha = 1;
  ctx.fillStyle = f.phase === 'active' ? '#ff9067' : '#d5e8d7'; ctx.textAlign = 'center'; ctx.font = '12px monospace';
  ctx.fillText(`${f.state.toUpperCase()} ${f.phase || ''}`, f.x, f.pose.head.y - 65);
  ctx.fillText(`STA ${f.stamina.toFixed(1)}  ${f.attackData?.name || 'SEM HITBOX ATIVA'}`, f.x, f.pose.head.y - 48);
  if (f.attackData) {
    ctx.fillStyle = '#dfbd65'; ctx.fillRect(f.x - 80, f.pose.head.y - 37, 160 * f.startup / f.attackDuration, 3);
    ctx.fillStyle = '#ef7b58'; ctx.fillRect(f.x - 80 + 160 * f.startup / f.attackDuration, f.pose.head.y - 37, 160 * f.attackData.active / f.attackDuration, 3);
    ctx.fillStyle = '#7d9990'; ctx.fillRect(f.x - 80 + 160 * (f.startup + f.attackData.active) / f.attackDuration, f.pose.head.y - 37, 160 * f.attackData.recovery / f.attackDuration, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(f.x - 80 + 160 * f.attackTime / f.attackDuration, f.pose.head.y - 40, 2, 9);
  }
  ctx.restore();
}