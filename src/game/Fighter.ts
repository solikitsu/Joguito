import { CONFIG } from './Config';
import { HitboxSystem, capsule } from './HitboxSystem';
import { Physics, approach } from './Physics';
import { Weapon } from './Weapon';
import type { AttackData, AttackDirection, AttackPhase, CharacterBody, CharacterData, Command, FighterState, GuardDirection, ParryBox, Pose, Settings } from './types';

function makePose(): Pose {
  const point = () => ({ x: 0, y: 0 });
  return { head: point(), neck: point(), hip: point(), shoulder: point(), backShoulder: point(), elbow: point(), hand: point(), backElbow: point(), backHand: point(), knee: point(), foot: point(), backKnee: point(), backFoot: point(), weaponBase: point(), weaponTip: point(), weaponAngle: 0 };
}

export class Fighter {
  readonly body: CharacterBody;
  readonly weapon: Weapon;
  readonly hurtboxes = HitboxSystem.createHurtboxes();
  readonly parryBox: ParryBox = { ...capsule(15), enabled: false };
  readonly guardDirection: GuardDirection = { facing: 1, minimumDot: 0.12 };
  readonly pose = makePose();
  state: FighterState = 'idle';
  stateTime = 0;
  facing = 1;
  hp: number;
  stamina: number;
  rounds = 0;
  attackData: AttackData | null = null;
  attackTime = 0;
  attackId = 0;
  hitMask = 0;
  clashed = false;
  comboIndex = 0;
  comboExpires = 0;
  stunDuration = 0;
  guardStartedAt = -100;
  guardRecoil = 0;
  sinceAction = 10;
  sinceDodge = 10;
  sinceHit = 10;
  sinceParry = 10;
  sinceLandedHit = 10;
  flashTime = 0;
  walkCycle = 0;
  movingForward = false;
  running = false;
  invulnerable = false;
  lastAttackStamina = 0;
  buffered: 'light' | 'heavy' | null = null;
  bufferedDirection: AttackDirection = 'neutral';
  bufferTime = 0;
  lastMove = 0;
  poseReset = true;

  constructor(readonly player: number, readonly data: CharacterData, x: number, facing: number) {
    this.body = { x, y: CONFIG.ground, vx: 0, vy: 0, width: 43, height: 174, grounded: true };
    this.facing = facing;
    this.hp = data.hp;
    this.stamina = data.stamina;
    this.weapon = new Weapon(data);
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get passive() { return this.data.passive.id; }
  get startup() { return (this.attackData?.startup || 0) * (this.passive === 'twisted' && this.attackData?.heavy ? 0.94 : 1); }
  get attackDuration() { return this.attackData ? this.startup + this.attackData.active + this.attackData.recovery : 0; }
  get phase(): AttackPhase | null {
    if (!this.attackData || this.state !== 'attack') return null;
    if (this.attackTime < this.startup) return 'startup';
    if (this.attackTime < this.startup + this.attackData.active) return 'active';
    return 'recovery';
  }

  reset(x: number, facing: number) {
    this.body.x = x; this.body.y = CONFIG.ground;
    this.body.vx = this.body.vy = 0; this.body.grounded = true;
    this.hp = this.data.hp; this.stamina = this.data.stamina;
    this.facing = facing; this.state = 'idle'; this.stateTime = 0;
    this.attackData = null; this.attackTime = 0; this.weapon.hitbox.active = false;
    this.parryBox.enabled = false;
    this.buffered = null; this.bufferTime = 0; this.hitMask = 0;
    this.comboExpires = 0; this.comboIndex = 0; this.guardStartedAt = -100;
    this.guardRecoil = 0;
    this.sinceAction = this.sinceDodge = this.sinceHit = this.sinceParry = this.sinceLandedHit = 10;
    this.flashTime = 0; this.invulnerable = false; this.poseReset = true;
  }

  private setState(state: FighterState) { this.state = state; this.stateTime = 0; }

  startAttack(heavy: boolean, direction: AttackDirection) {
    if (this.state === 'attack' || this.state === 'stun' || this.state === 'guardbreak' || this.hp <= 0) return false;
    const index = !heavy && this.comboExpires > 0 ? this.comboIndex + 1 : 0;
    const comboIndex = index % this.weapon.data.combo;
    const attack = this.weapon.attack(heavy, direction, comboIndex);
    let cost = attack.stamina;
    if (this.passive === 'rhythm' && !heavy && comboIndex === 2) cost *= 0.85;
    if (this.stamina + 0.001 < cost) return false;
    this.comboIndex = comboIndex;
    this.body.height = 174;
    this.lastAttackStamina = this.stamina;
    this.stamina -= cost;
    this.attackData = attack; this.attackTime = 0; this.attackId++;
    this.hitMask = 0; this.clashed = false;
    this.comboExpires = 0; this.sinceAction = 0;
    this.setState('attack');
    return true;
  }

  cancelAttack() {
    this.attackData = null; this.weapon.hitbox.active = false;
    this.buffered = null; this.comboExpires = 0;
  }

  stun(duration: number, knockback = 0, direction = 1, guardBreak = false) {
    if (this.hp <= 0) return;
    this.cancelAttack();
    this.stunDuration = duration;
    this.parryBox.enabled = false;
    this.body.vx = knockback * direction;
    this.setState(guardBreak ? 'guardbreak' : 'stun');
    this.sinceAction = 0;
  }

  takeDamage(damage: number, knockback: number, direction: number, heavy: boolean) {
    this.hp = Math.max(0, this.hp - damage);
    this.sinceHit = 0; this.flashTime = 0.1;
    if (this.hp === 0) {
      this.cancelAttack(); this.setState('defeat');
      this.parryBox.enabled = false;
      this.body.vx = knockback * direction;
    } else this.stun(heavy ? 0.37 : 0.19, knockback, direction);
  }

  win() { this.cancelAttack(); this.setState('victory'); }

  update(command: Command, opponent: Fighter, dt: number, now: number, settings: Settings) {
    this.stateTime += dt;
    this.sinceAction += dt; this.sinceDodge += dt; this.sinceHit += dt;
    this.sinceParry += dt; this.sinceLandedHit += dt;
    this.flashTime = Math.max(0, this.flashTime - dt);
    this.guardRecoil = Math.max(0, this.guardRecoil - dt);
    this.comboExpires = Math.max(0, this.comboExpires - dt);
    this.bufferTime -= dt;
    if (this.bufferTime <= 0) this.buffered = null;
    this.invulnerable = false;
    this.movingForward = false;
    this.running = false;

    if (this.state === 'victory' || this.state === 'defeat') {
      this.body.vx = approach(this.body.vx, 0, 850 * dt);
      Physics.integrate(this.body, dt);
      return;
    }

    if (command.light || command.heavy) {
      this.buffered = command.heavy ? 'heavy' : 'light';
      this.bufferTime = CONFIG.inputBuffer;
      this.bufferedDirection = command.up ? 'up' : command.down ? 'down' : command.move * this.facing > 0 ? 'forward' : 'neutral';
    }

    if (this.state === 'stun' || this.state === 'guardbreak') {
      if (this.stateTime >= this.stunDuration) this.setState('idle');
      else {
        this.body.vx = approach(this.body.vx, 0, 720 * dt);
        Physics.integrate(this.body, dt);
        return;
      }
    }

    if (this.state === 'dodge') {
      const duration = CONFIG.dodgeDuration * (this.passive === 'pale-breeze' ? 0.88 : 1);
      this.invulnerable = this.stateTime >= CONFIG.dodgeInvulnerableStart && this.stateTime <= CONFIG.dodgeInvulnerableEnd;
      const cancelAt = duration - (this.weapon.data.id === 'dagger' ? 0.09 : 0.015);
      if (this.stateTime >= duration || (this.buffered && this.stateTime >= cancelAt)) {
        this.setState('idle'); this.invulnerable = false;
      } else {
        const strength = 1 - Math.pow(this.stateTime / duration, 2);
        this.body.vx = this.lastMove * CONFIG.dodgeSpeed * strength * (this.passive === 'escape' ? 1.12 : 1);
        Physics.integrate(this.body, dt);
        return;
      }
    }

    if (this.state === 'attack' && this.attackData) {
      this.attackTime += dt;
      if (this.passive === 'interrupt' && command.guardPressed && !this.attackData.heavy && this.attackTime <= 0.06) {
        this.cancelAttack(); this.guardStartedAt = now; this.setState('guard');
      } else if (this.attackTime >= this.attackDuration) {
        const canChain = !this.attackData.heavy && this.comboIndex < this.weapon.data.combo - 1;
        this.attackData = null; this.weapon.hitbox.active = false;
        this.comboExpires = canChain ? 0.3 : 0;
        this.setState('idle');
      } else {
        Physics.move(this.body, this.facing * this.attackData.lunge * (this.phase === 'active' ? 1 : this.phase === 'startup' ? 0.25 : 0), dt);
        Physics.integrate(this.body, dt);
        return;
      }
    }

    if (this.state !== 'guard') this.facing = opponent.x >= this.x ? 1 : -1;
    this.guardDirection.facing = this.facing;

    let dodgeCost = CONFIG.dodgeCost as number;
    if (this.passive === 'clean-exit' && this.sinceLandedHit < 0.8) dodgeCost *= 0.9;
    if (command.dodge && this.body.grounded && this.stamina >= dodgeCost && this.sinceDodge > 0.4) {
      this.stamina -= dodgeCost; this.sinceAction = 0; this.sinceDodge = 0;
      this.lastMove = command.move || this.facing;
      this.body.height = 125;
      this.setState('dodge');
      this.body.vx = this.lastMove * CONFIG.dodgeSpeed * (this.passive === 'escape' ? 1.12 : 1);
      Physics.integrate(this.body, dt);
      return;
    }

    if (command.guard && this.body.grounded && this.stamina > 0) {
      this.body.height = 174;
      if (command.guardPressed) this.guardStartedAt = now;
      if (this.state !== 'guard') this.setState('guard');
      this.stamina = Math.max(0, this.stamina - dt * 1.4);
      if (this.guardRecoil > 0) this.body.vx = approach(this.body.vx, command.move * 50, 650 * dt);
      else Physics.move(this.body, command.move * 50, dt);
      if (this.stamina === 0) this.stun(CONFIG.guardBreakTime, 0, 1, true);
    } else {
      if (this.state === 'guard') this.setState('idle');
      if (this.buffered) {
        const heavy = this.buffered === 'heavy';
        if (this.startAttack(heavy, this.bufferedDirection)) {
          this.buffered = null;
          Physics.integrate(this.body, dt);
          return;
        }
      }
      if (command.jump && this.body.grounded) {
        this.body.vy = -CONFIG.jumpSpeed;
        this.body.grounded = false;
      }
      this.running = command.run && command.move !== 0 && !command.crouch;
      this.movingForward = command.move * this.facing > 0;
      let speed = (this.running ? CONFIG.runSpeed : CONFIG.walkSpeed) * this.data.speed * this.weapon.data.speed;
      if (command.crouch && this.body.grounded) speed *= this.passive === 'elusive' ? 0.5 : 0.44;
      if (this.passive === 'live-charge' && this.running) speed *= 1.06;
      if (this.passive === 'hunter' && command.move * this.facing < 0) speed *= 1.08;
      this.body.height = command.crouch && this.body.grounded ? 140 : 174;
      const nextState = !this.body.grounded ? 'jump' : command.crouch ? 'crouch' : command.move ? 'move' : 'idle';
      if (this.state !== nextState) this.setState(nextState);
      Physics.move(this.body, command.move * speed, dt);
      if (this.sinceAction >= CONFIG.staminaDelay) {
        let regen = CONFIG.staminaRegen;
        if (this.passive === 'pressure' && this.movingForward) regen *= 1.18;
        if (this.passive === 'cold-blood' && this.hp / this.data.hp < 0.4) regen *= 1.12;
        this.stamina = Math.min(this.data.stamina, this.stamina + regen * dt);
      }
    }
    Physics.integrate(this.body, dt);
    // The value is used by combat, not by held-defense logic: holding L never renews a parry.
    void settings;
  }
}