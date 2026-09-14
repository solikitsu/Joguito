import { CONFIG } from './Config';
import type { ArenaData, WeaponHitbox } from './types';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; kind: number }
interface Trail { ax: number; ay: number; bx: number; by: number; life: number; maxLife: number; color: string; width: number }
interface Label { x: number; y: number; life: number; maxLife: number; text: string; color: string }

export class Effects {
  private particles: Particle[] = Array.from({ length: CONFIG.particlePool }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '', kind: 0 }));
  private trails: Trail[] = Array.from({ length: CONFIG.trailPool }, () => ({ ax: 0, ay: 0, bx: 0, by: 0, life: 0, maxLife: 1, color: '', width: 1 }));
  private labels: Label[] = Array.from({ length: CONFIG.labelPool }, () => ({ x: 0, y: 0, life: 0, maxLife: 1, text: '', color: '' }));
  private particleCursor = 0;
  private trailCursor = 0;
  private labelCursor = 0;
  private ambientTimer = 0;
  shake = 0;
  enabled = true;
  lowQuality = false;

  burst(x: number, y: number, kind: 'hit' | 'heavy' | 'parry' | 'block' | 'clash' | 'dust') {
    if (!this.enabled) return;
    const count = kind === 'parry' ? 25 : kind === 'heavy' ? 19 : kind === 'dust' ? 6 : 12;
    const color = kind === 'parry' ? '#c2eff0' : kind === 'hit' || kind === 'heavy' ? '#e58565' : kind === 'dust' ? '#a69d86' : '#e9c486';
    for (let i = 0; i < count / (this.lowQuality ? 2 : 1); i++) {
      const p = this.particles[this.particleCursor++ % this.particles.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = (kind === 'parry' ? 320 : 200) * (0.3 + Math.random());
      p.x = x; p.y = y; p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed - 25;
      p.life = p.maxLife = 0.18 + Math.random() * 0.3;
      p.size = kind === 'dust' ? 3.5 : 1 + Math.random() * 1.5;
      p.color = color; p.kind = kind === 'dust' ? 2 : 0;
    }
  }

  label(x: number, y: number, text: string, color: string) {
    const label = this.labels[this.labelCursor++ % this.labels.length];
    label.x = x; label.y = y; label.text = text; label.color = color;
    label.life = label.maxLife = 0.8;
  }

  trail(hitbox: WeaponHitbox, color: string) {
    if (!this.enabled) return;
    const trail = this.trails[this.trailCursor++ % this.trails.length];
    trail.ax = hitbox.ax; trail.ay = hitbox.ay; trail.bx = hitbox.bx; trail.by = hitbox.by;
    trail.life = trail.maxLife = 0.085;
    trail.color = color; trail.width = hitbox.radius * 1.1;
  }

  update(dt: number, arena: ArenaData, ambient: boolean) {
    this.shake = Math.max(0, this.shake - dt * 36);
    this.ambientTimer += dt;
    if (ambient && this.enabled && this.ambientTimer > (this.lowQuality ? 0.45 : 0.17)) {
      this.ambientTimer = 0;
      const p = this.particles[this.particleCursor++ % this.particles.length];
      const ember = arena.particle === 'ember';
      p.x = Math.random() * CONFIG.width;
      p.y = ember ? CONFIG.ground + Math.random() * 130 : Math.random() * CONFIG.ground;
      p.vx = -8 - Math.random() * 24; p.vy = ember ? -25 - Math.random() * 35 : 8 + Math.random() * 14;
      p.life = p.maxLife = 4 + Math.random() * 5;
      p.color = arena.color; p.size = 1 + Math.random() * 2.3; p.kind = ember ? 3 : 1;
    }
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 0 || p.kind === 2) { p.vy += dt * 380; p.vx *= 1 - dt * 2; }
      if (p.x < -20 || p.x > CONFIG.width + 20 || p.y > CONFIG.height + 20) p.life = 0;
    }
    for (const t of this.trails) if (t.life > 0) t.life -= dt;
    for (const l of this.labels) if (l.life > 0) { l.life -= dt; l.y -= dt * 24; }
  }

  drawTrails(ctx: CanvasRenderingContext2D) {
    ctx.lineCap = 'round';
    for (const t of this.trails) {
      if (t.life <= 0) continue;
      ctx.globalAlpha = t.life / t.maxLife * 0.25;
      ctx.strokeStyle = t.color; ctx.lineWidth = t.width;
      ctx.beginPath(); ctx.moveTo(t.ax, t.ay); ctx.lineTo(t.bx, t.by); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const alpha = Math.min(1, p.life / p.maxLife * 2);
      ctx.globalAlpha = alpha * (p.kind === 1 ? 0.3 : 0.85);
      ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
      if (p.kind === 0) {
        ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025); ctx.stroke();
      } else {
        ctx.fillRect(p.x, p.y, p.size * (p.kind === 1 ? 2.4 : 1), p.size);
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 17px "Arial", sans-serif';
    for (const label of this.labels) {
      if (label.life <= 0) continue;
      ctx.globalAlpha = Math.min(1, label.life / 0.2);
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, label.x, label.y);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.particles) p.life = 0;
    for (const t of this.trails) t.life = 0;
    for (const l of this.labels) l.life = 0;
    this.shake = 0;
  }
}