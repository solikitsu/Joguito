import type { Fighter } from './Fighter';
import type { Command, Difficulty, FighterState } from './types';
import { clearCommand, createCommand } from './types';

interface Observation { time: number; x: number; y: number; state: FighterState; phase: string; attack: number; stamina: number }
const LEVELS = {
  easy: { reaction: 0.32, aggression: 0.4, defense: 0.36, dodge: 0.13, interval: 0.19 },
  normal: { reaction: 0.205, aggression: 0.65, defense: 0.62, dodge: 0.23, interval: 0.12 },
  hard: { reaction: 0.125, aggression: 0.84, defense: 0.8, dodge: 0.34, interval: 0.085 },
};

export class AI {
  readonly command: Command = createCommand();
  private history: Observation[] = Array.from({ length: 80 }, () => ({ time: -10, x: 800, y: 720, state: 'idle', phase: '', attack: 0, stamina: 100 }));
  private cursor = 0;
  private decisionTimer = 0;
  private guardUntil = 0;
  private attackCooldown = 0;
  private lastSeenAttack = -1;
  private moveIntent = 0;
  private retreatUntil = 0;

  constructor(public difficulty: Difficulty) {}

  reset() {
    for (const h of this.history) h.time = -10;
    this.cursor = 0; this.decisionTimer = 0; this.guardUntil = 0;
    this.attackCooldown = 0; this.lastSeenAttack = -1; this.retreatUntil = 0;
    this.moveIntent = 0; clearCommand(this.command);
  }

  update(self: Fighter, opponent: Fighter, now: number, dt: number): Command {
    const level = LEVELS[this.difficulty];
    const observation = this.history[this.cursor++ % this.history.length];
    observation.time = now; observation.x = opponent.x; observation.y = opponent.y;
    observation.state = opponent.state; observation.phase = opponent.phase || '';
    observation.attack = opponent.attackId; observation.stamina = opponent.stamina;
    this.command.light = this.command.heavy = this.command.dodge = this.command.jump = this.command.guardPressed = false;
    this.command.up = this.command.down = this.command.crouch = false;
    this.command.guard = now < this.guardUntil;
    this.command.move = this.command.guard ? 0 : this.moveIntent;
    this.attackCooldown -= dt; this.decisionTimer -= dt;
    if (this.decisionTimer > 0) return this.command;
    this.decisionTimer = level.interval * (0.8 + Math.random() * 0.5);

    // Decisions use a delayed world snapshot. The bot never receives player inputs.
    let seen: Observation | null = null;
    for (let i = 0; i < this.history.length; i++) {
      const h = this.history[i];
      if (h.time <= now - level.reaction && h.time > (seen?.time ?? -10)) seen = h;
    }
    if (!seen) return this.command;
    const dx = seen.x - self.x;
    const distance = Math.abs(dx);
    const direction = Math.sign(dx) || self.facing;
    const reach = self.weapon.data.reach * self.weapon.reachMultiplier + (self.weapon.data.id === 'gauntlets' ? 51 : 39);
    const ideal = reach * (self.weapon.data.id === 'spear' ? 0.93 : 0.84);
    const incoming = seen.state === 'attack' && seen.phase !== 'recovery' && distance < opponent.weapon.data.reach + 100;
    const freshAttack = seen.attack !== this.lastSeenAttack;

    if (incoming && freshAttack) {
      this.lastSeenAttack = seen.attack;
      if (Math.random() < level.dodge && self.stamina > 32) {
        this.command.dodge = true;
        this.moveIntent = -direction;
        this.retreatUntil = now + 0.27;
      } else if (Math.random() < level.defense && self.stamina > 14) {
        this.command.guardPressed = !this.command.guard;
        this.guardUntil = now + 0.18 + Math.random() * 0.2;
        this.command.guard = true;
      }
    }

    if (self.stamina < 23 || now < this.retreatUntil) this.moveIntent = distance < reach + 75 ? -direction : 0;
    else if (distance > ideal + 13) this.moveIntent = direction;
    else if (distance < ideal - (self.weapon.data.id === 'spear' ? 25 : 53)) this.moveIntent = -direction;
    else this.moveIntent = 0;

    this.command.run = distance > reach + 160;
    this.command.move = this.command.guard ? 0 : this.moveIntent;
    const ready = self.state === 'idle' || self.state === 'move' || self.state === 'crouch' || (self.phase === 'recovery' && self.attackDuration - self.attackTime < 0.12);
    if (ready && !this.command.guard && !this.command.dodge && distance < reach + 14 && this.attackCooldown <= 0 && self.stamina > 16) {
      const punish = seen.state === 'attack' && seen.phase === 'recovery';
      if (punish || Math.random() < level.aggression) {
        this.command.heavy = self.stamina > 45 && (punish || seen.state === 'guard' || Math.random() < 0.18);
        this.command.light = !this.command.heavy;
        this.command.down = seen.state === 'crouch' || Math.random() < 0.14;
        this.command.up = !this.command.down && (seen.y < self.y - 45 || Math.random() < 0.1);
        this.attackCooldown = this.difficulty === 'easy' ? 0.5 + Math.random() * 0.4 : 0.17 + Math.random() * 0.3;
        if (Math.random() < 0.18) this.retreatUntil = now + 0.6;
      }
    }
    if (this.difficulty !== 'easy' && self.state === 'move' && distance > reach && distance < reach + 160 && Math.random() < 0.018) this.command.jump = true;
    return this.command;
  }
}