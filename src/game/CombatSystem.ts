import { CONFIG } from './Config';
import { sweptCapsules } from './HitboxSystem';
import type { Fighter } from './Fighter';
import type { Effects } from './Effects';
import type { GameAudio } from './Audio';
import type { Settings } from './types';

export interface CombatEvent {
  kind: 'hit' | 'block' | 'parry' | 'guardbreak' | 'clash';
  attacker: number; defender: number; damage: number; heavy: boolean; part: string;
}

export function guardFaces(defender: Fighter, attacker: Fighter) {
  const dx = attacker.x - defender.x;
  const dy = attacker.pose.hip.y - defender.pose.hip.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return dx * defender.guardDirection.facing / length > defender.guardDirection.minimumDot;
}

export class CombatSystem {
  hitstop = 0;
  onEvent: ((event: CombatEvent) => void) | null = null;
  constructor(private effects: Effects, private audio: GameAudio, private settings: Settings) {}

  setSettings(settings: Settings) { this.settings = settings; }

  resolve(a: Fighter, b: Fighter, now: number) {
    const ah = a.weapon.hitbox, bh = b.weapon.hitbox;
    if (!ah.active && !bh.active) return;
    if (a.hp <= 0 || b.hp <= 0) return;
    const distance = Math.abs(a.x - b.x);
    const reach = a.weapon.data.reach + b.weapon.data.reach + 160;
    if (distance > reach) return;

    if (ah.active && bh.active && !a.clashed && !b.clashed && !a.hitMask && !b.hitMask && sweptCapsules(ah, bh)) {
      a.clashed = b.clashed = true;
      const x = (ah.bx + bh.bx) / 2, y = (ah.by + bh.by) / 2;
      this.effects.burst(x, y, 'clash');
      this.audio.play('clash');
      this.hitstop = 0.04;
      const aHeavy = !!a.attackData?.heavy, bHeavy = !!b.attackData?.heavy;
      if (aHeavy && !bHeavy) b.stun(0.24, 85, a.facing);
      else if (bHeavy && !aHeavy) a.stun(0.24, 85, b.facing);
      else {
        a.stun(0.2, 80, -a.facing); b.stun(0.2, 80, -b.facing);
        a.stamina = Math.max(0, a.stamina - 3); b.stamina = Math.max(0, b.stamina - 3);
      }
      this.onEvent?.({ kind: 'clash', attacker: a.player, defender: b.player, damage: 0, heavy: aHeavy || bHeavy, part: 'weapon' });
      return;
    }
    this.strike(a, b, now);
    this.strike(b, a, now);
  }

  private strike(attacker: Fighter, defender: Fighter, now: number) {
    const weapon = attacker.weapon.hitbox;
    const attack = attacker.attackData;
    const bit = 1 << defender.player;
    if (!weapon.active || !attack || attacker.hitMask & bit || defender.invulnerable || defender.hp <= 0) return;
    if (Math.abs(attacker.x - defender.x) > attack.reach * attacker.weapon.reachMultiplier + 125) return;
    const front = defender.state === 'guard' && guardFaces(defender, attacker);
    if (front && defender.parryBox.enabled && sweptCapsules(weapon, defender.parryBox)) {
      attacker.hitMask |= bit;
      const x = defender.parryBox.ax, y = Math.max(defender.parryBox.ay, Math.min(defender.parryBox.by, (weapon.ay + weapon.by) / 2));
      const window = this.settings.parryWindow / 1000 + (defender.passive === 'stillness' ? 0.02 : 0);
      if (now - defender.guardStartedAt >= 0 && now - defender.guardStartedAt <= window) {
        const wasHeavy = attack.heavy;
        defender.sinceParry = 0;
        defender.stamina = Math.min(defender.data.stamina, defender.stamina + (defender.passive === 'steel-reflex' ? 11 : 6));
        attacker.stun(CONFIG.parryStun, 110, -attacker.facing);
        this.effects.burst(x, y, 'parry');
        this.effects.label(x, defender.pose.head.y - 43, 'PARRY', '#c2eff0');
        this.audio.play('parry'); this.hitstop = 0.075;
        this.onEvent?.({ kind: 'parry', attacker: attacker.player, defender: defender.player, damage: 0, heavy: wasHeavy, part: 'guard' });
      } else {
        let drain = attack.guardDamage * defender.weapon.data.guard;
        if (attacker.passive === 'iron-fist') drain *= 1.12;
        if (defender.passive === 'elegant') drain *= 0.92;
        defender.stamina = Math.max(0, defender.stamina - drain);
        defender.sinceAction = 0;
        const push = attack.knockback * 0.28 * (defender.passive === 'steadfast' ? 0.8 : 1);
        defender.body.vx = push * attacker.facing;
        defender.guardRecoil = 0.12;
        if (defender.stamina <= 0) {
          defender.stun(CONFIG.guardBreakTime * (defender.passive === 'tenacious' ? 0.85 : 1), push * 1.7, attacker.facing, true);
          this.effects.label(x, defender.pose.head.y - 40, 'GUARDA QUEBRADA', '#ee9975');
          this.effects.burst(x, y, 'heavy');
          this.hitstop = 0.09;
          if (this.settings.shake) this.effects.shake = 5;
          this.audio.play('heavyHit');
          this.onEvent?.({ kind: 'guardbreak', attacker: attacker.player, defender: defender.player, damage: 0, heavy: attack.heavy, part: 'guard' });
        } else {
          this.effects.burst(x, y, 'block'); this.audio.play('block');
          this.effects.label(x, defender.pose.head.y - 35, 'DEFESA', '#dfc597');
          this.hitstop = attack.heavy ? 0.045 : 0.025;
          this.onEvent?.({ kind: 'block', attacker: attacker.player, defender: defender.player, damage: 0, heavy: attack.heavy, part: 'guard' });
        }
      }
      return;
    }

    for (const hurt of defender.hurtboxes) {
      if (!sweptCapsules(weapon, hurt)) continue;
      attacker.hitMask |= bit;
      let damage = attack.damage * attacker.data.damage * (hurt.part === 'head' ? 1.06 : 1);
      let knockback = attack.knockback;
      if (attacker.passive === 'shadow-step' && attacker.sinceDodge < 0.6 && !attack.heavy) damage *= 1.08;
      if (attacker.passive === 'serene' && attacker.lastAttackStamina >= attacker.data.stamina * 0.85) damage *= 1.06;
      if (attacker.passive === 'contained-fury' && attacker.hp / attacker.data.hp < 0.35 && attack.heavy) damage *= 1.06;
      if (attacker.passive === 'last-word' && attacker.sinceParry < 0.85) damage *= 1.08;
      if (attacker.passive === 'sentence' && attack.heavy) knockback *= 1.1;
      if (attacker.passive === 'control-zone' && Math.abs(attacker.x - defender.x) > attack.reach * 0.75) knockback *= 1.07;
      if (attacker.passive === 'second-wind' && attacker.comboIndex === 3 && !attack.heavy) attacker.stamina = Math.min(attacker.data.stamina, attacker.stamina + 4);
      damage = Math.round(damage * 10) / 10;
      const x = (hurt.ax + hurt.bx) / 2, y = (hurt.ay + hurt.by) / 2;
      defender.takeDamage(damage, knockback, attacker.facing, attack.heavy);
      attacker.sinceLandedHit = 0;
      this.effects.burst(x, y, attack.heavy ? 'heavy' : 'hit');
      this.audio.play(attack.heavy ? 'heavyHit' : 'hit');
      this.hitstop = attack.heavy ? 0.066 : 0.035;
      if (attack.heavy && this.settings.shake) this.effects.shake = 4.5;
      this.onEvent?.({ kind: 'hit', attacker: attacker.player, defender: defender.player, damage, heavy: attack.heavy, part: hurt.part });
      return;
    }
  }
}