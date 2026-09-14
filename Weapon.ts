import { WEAPONS } from './data/WeaponData';
import { capsule, setCapsule } from './HitboxSystem';
import type { AttackDirection, CharacterData, Pose, WeaponData, WeaponHitbox } from './types';

export class Weapon {
  readonly data: WeaponData;
  readonly hitbox: WeaponHitbox = { ...capsule(), active: false };
  readonly reachMultiplier: number;
  constructor(character: CharacterData) {
    this.data = WEAPONS[character.weapon];
    this.hitbox.radius = this.data.radius;
    this.reachMultiplier = character.passive.id === 'sovereign' ? 1.05 : 1;
  }

  attack(heavy: boolean, direction: AttackDirection, combo: number) {
    return heavy ? this.data.heavy[direction] : this.data.light[direction][combo % this.data.combo];
  }

  sync(pose: Pose, active: boolean, reset = false) {
    const b = pose.weaponBase, t = pose.weaponTip;
    // Only the head of an axe and the metal tip of a spear can deal damage.
    const fraction = this.data.id === 'spear' ? 1 - 34 / (this.data.reach * this.reachMultiplier) : this.data.id === 'axe' ? 0.76 : this.data.id === 'gauntlets' ? 0.1 : 0.13;
    setCapsule(this.hitbox, b.x + (t.x - b.x) * fraction, b.y + (t.y - b.y) * fraction, t.x, t.y, reset);
    this.hitbox.active = active;
  }
}