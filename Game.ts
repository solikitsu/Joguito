import { AI } from './AI';
import { Animation } from './Animation';
import { Arena } from './Arena';
import { GameAudio } from './Audio';
import { CombatSystem } from './CombatSystem';
import { CONFIG } from './Config';
import { Effects } from './Effects';
import { Fighter } from './Fighter';
import { drawDebug, drawFighter } from './FighterRenderer';
import { GameLoop } from './GameLoop';
import { HitboxSystem } from './HitboxSystem';
import { Input } from './Input';
import { Physics } from './Physics';
import { matchWon, roundWinner } from './RoundRules';
import { getCharacter } from './data/CharacterData';
import { clearCommand, createCommand } from './types';
import type { DummyBehavior, FighterSnapshot, GameSnapshot, MatchOptions, Settings } from './types';

export class Game {
  readonly input: Input;
  readonly audio: GameAudio;
  readonly effects = new Effects();
  readonly loop: GameLoop;
  readonly arena: Arena;
  readonly combat: CombatSystem;
  fighters: [Fighter, Fighter];
  onSnapshot: ((snapshot: GameSnapshot) => void) | null = null;
  onPause: ((paused: boolean) => void) | null = null;
  menu = true;
  paused = false;
  debug = false;
  phase: GameSnapshot['phase'] = 'intro';
  round = 1;
  winner = -1;
  dummy: DummyBehavior = 'idle';
  infiniteStamina = false;
  trainingHits = 0;
  trainingDamage = 0;
  feedback = '';
  options: MatchOptions = { mode: 'cpu', p1: 'kael', p2: 'shiro', arena: 'moon', difficulty: 'normal', roundsToWin: 2 };
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;
  private settings: Settings;
  private bot = new AI('normal');
  private now = 0;
  private visualTime = 0;
  private phaseTime = 0;
  private hudTime = 0;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private pixelRatio = 1;
  private dummyCommand = createCommand();
  private idleCommand = createCommand();
  private lastAnnouncement = '';
  private dirty = true;
  private previewActive = true;

  constructor(private canvas: HTMLCanvasElement, settings: Settings) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Seu navegador precisa oferecer suporte ao Canvas 2D.');
    this.ctx = ctx;
    this.settings = settings;
    this.audio = new GameAudio(settings);
    this.input = new Input(settings);
    this.arena = new Arena('moon');
    this.combat = new CombatSystem(this.effects, this.audio, settings);
    this.fighters = [new Fighter(0, getCharacter('kael'), 945, 1), new Fighter(1, getCharacter('shiro'), 1230, -1)];
    this.combat.onEvent = event => {
      if (event.kind === 'hit' && event.attacker === 0) {
        this.trainingHits++;
        this.trainingDamage = Math.round((this.trainingDamage + event.damage) * 10) / 10;
      }
      const labels = { hit: `ACERTO ${event.damage}`, block: 'DEFESA', parry: 'PARRY', guardbreak: 'GUARDA QUEBRADA', clash: 'CHOQUE DE ARMAS' };
      this.feedback = labels[event.kind];
    };
    this.input.onPause = () => { if (!this.menu && this.phase !== 'matchEnd') this.setPaused(!this.paused); };
    this.input.onDebug = () => this.toggleDebug();
    this.input.onBlur = () => { if (!this.menu && this.phase !== 'matchEnd') this.setPaused(true); };
    this.loop = new GameLoop(this.update, this.render);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas);
    document.addEventListener('visibilitychange', this.visibility);
    this.setSettings(settings);
    this.resize();
    this.loop.start();
  }

  setSettings(settings: Settings) {
    this.settings = settings;
    this.audio.setSettings(settings); this.input.setSettings(settings); this.combat.setSettings(settings);
    this.effects.enabled = settings.effects;
    this.effects.lowQuality = settings.quality === 'low';
    this.resize();
  }

  setArena(id: string) { if (this.arena.data.id !== id) this.arena.load(id); }

  setPreviewActive(active: boolean) { this.previewActive = active; this.dirty = true; }

  start(options: MatchOptions) {
    this.options = { ...options };
    this.menu = false; this.paused = false; this.debug = false;
    this.dirty = true;
    this.phase = options.mode === 'training' ? 'fight' : 'intro';
    this.phaseTime = 0; this.round = 1; this.winner = -1;
    this.trainingHits = this.trainingDamage = 0; this.feedback = '';
    this.fighters = [new Fighter(0, getCharacter(options.p1), 565, 1), new Fighter(1, getCharacter(options.p2), 1035, -1)];
    this.bot = new AI(options.difficulty);
    this.combat.hitstop = 0; this.effects.clear(); this.input.clear(); this.input.enabled = true;
    this.setArena(options.arena); this.audio.unlock(); this.audio.play('round');
    this.lastAnnouncement = '';
    this.publish(); this.onPause?.(false);
  }

  showMenu(arena?: string) {
    this.menu = true; this.paused = false; this.debug = false; this.input.enabled = false; this.input.clear();
    this.dirty = true;
    this.fighters = [new Fighter(0, getCharacter('kael'), 945, 1), new Fighter(1, getCharacter('shiro'), 1230, -1)];
    this.effects.clear(); this.combat.hitstop = 0;
    if (arena) this.setArena(arena);
    this.onPause?.(false);
  }

  setPaused(paused: boolean) {
    if (this.menu) return;
    this.paused = paused;
    this.input.enabled = !paused && this.phase !== 'matchEnd';
    this.dirty = true;
    this.input.clear();
    if (!paused) this.audio.unlock();
    this.onPause?.(paused); this.publish();
  }

  resetTraining() {
    this.fighters[0].reset(635, 1); this.fighters[1].reset(965, -1);
    this.bot.reset(); this.effects.clear(); this.combat.hitstop = 0;
    this.trainingHits = this.trainingDamage = 0; this.feedback = '';
    this.phase = 'fight'; this.phaseTime = 0; this.input.clear(); this.publish();
  }

  setDummy(behavior: DummyBehavior) { this.dummy = behavior; this.bot.reset(); this.publish(); }
  setInfiniteStamina(enabled: boolean) { this.infiniteStamina = enabled; this.publish(); }

  toggleDebug() { this.debug = !this.debug; this.dirty = true; this.publish(); }

  private resize = () => {
    this.dirty = true;
    this.viewportWidth = Math.max(1, this.canvas.clientWidth);
    this.viewportHeight = Math.max(1, this.canvas.clientHeight);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.quality === 'low' ? 1 : CONFIG.maxPixelRatio);
    this.canvas.width = Math.round(this.viewportWidth * this.pixelRatio);
    this.canvas.height = Math.round(this.viewportHeight * this.pixelRatio);
  };

  private visibility = () => {
    if (document.hidden) {
      this.input.clear();
      if (!this.menu && this.phase !== 'matchEnd') this.setPaused(true);
      this.audio.suspend(); this.loop.stop();
    } else this.loop.start();
  };

  private syncFighter(f: Fighter, dt: number) {
    Animation.update(f, this.visualTime, dt);
    HitboxSystem.sync(f.pose, f.hurtboxes, f.parryBox, f.facing, f.state === 'guard', f.poseReset);
    f.weapon.sync(f.pose, f.phase === 'active', f.poseReset);
    f.poseReset = false;
  }

  private update = (dt: number) => {
    this.hudTime += dt;
    if (!this.paused && !this.settings.reducedMotion) this.visualTime += dt;
    if (this.menu) {
      if (!this.previewActive) return;
      for (const f of this.fighters) this.syncFighter(f, dt);
      this.effects.update(dt, this.arena.data, !this.settings.reducedMotion);
      return;
    }
    if (this.paused) { this.input.endStep(); return; }
    if (this.hudTime > 0.1) { this.hudTime = 0; this.publish(); }
    this.effects.update(dt, this.arena.data, !this.settings.reducedMotion);
    if (this.combat.hitstop > 0) {
      this.combat.hitstop = Math.max(0, this.combat.hitstop - dt);
      // Keep input edges until the next simulation tick so hitstop cannot eat a command.
      return;
    }
    this.now += dt;
    this.phaseTime += dt;
    const [a, b] = this.fighters;

    if (this.phase === 'intro') {
      this.syncFighter(a, dt); this.syncFighter(b, dt);
      if (this.phaseTime >= CONFIG.roundIntro) {
        this.phase = 'fight'; this.phaseTime = 0; this.input.clear();
      }
      this.input.endStep(); return;
    }
    if (this.phase === 'roundEnd' || this.phase === 'matchEnd') {
      for (const f of this.fighters) { f.update(this.idleCommand, f === a ? b : a, dt, this.now, this.settings); this.syncFighter(f, dt); }
      if (this.phase === 'roundEnd' && this.phaseTime >= CONFIG.roundEnd) {
        if (this.winner >= 0 && matchWon(this.fighters[this.winner].rounds, this.options.roundsToWin)) {
          this.phase = 'matchEnd'; this.input.enabled = false; this.input.clear(); this.publish();
        } else {
          this.round++; this.phase = 'intro'; this.phaseTime = 0;
          a.reset(565, 1); b.reset(1035, -1); this.bot.reset(); this.effects.clear();
          this.input.clear(); this.audio.play('round');
        }
      }
      this.input.endStep(); return;
    }

    const p1 = this.input.read(0);
    let p2;
    if (this.options.mode === 'local') p2 = this.input.read(1);
    else if (this.options.mode === 'training' && this.dummy !== 'cpu') {
      clearCommand(this.dummyCommand);
      if (this.dummy === 'guard') this.dummyCommand.guard = true;
      if (this.dummy === 'attack') {
        const range = b.weapon.data.reach + 40;
        this.dummyCommand.move = Math.abs(a.x - b.x) > range ? Math.sign(a.x - b.x) : 0;
        this.dummyCommand.light = b.state === 'idle' || b.state === 'move';
      }
      p2 = this.dummyCommand;
    } else p2 = this.bot.update(b, a, this.now, dt);

    const wasActiveA = a.weapon.hitbox.active, wasActiveB = b.weapon.hitbox.active;
    const dodgeA = a.sinceDodge, dodgeB = b.sinceDodge;
    const groundedA = a.body.grounded, groundedB = b.body.grounded;
    a.update(p1, b, dt, this.now, this.settings);
    b.update(p2, a, dt, this.now, this.settings);
    if (a.sinceDodge < dodgeA || b.sinceDodge < dodgeB) this.audio.play('dodge');
    if (a.sinceDodge < dodgeA || !groundedA && a.body.grounded) this.effects.burst(a.x, CONFIG.ground, 'dust');
    if (b.sinceDodge < dodgeB || !groundedB && b.body.grounded) this.effects.burst(b.x, CONFIG.ground, 'dust');
    Physics.separate(a.body, b.body, a.state === 'dodge' || b.state === 'dodge');
    this.syncFighter(a, dt); this.syncFighter(b, dt);
    if (a.weapon.hitbox.active && !wasActiveA) this.audio.play(a.attackData?.heavy ? 'heavySwing' : 'swing');
    if (b.weapon.hitbox.active && !wasActiveB) this.audio.play(b.attackData?.heavy ? 'heavySwing' : 'swing');
    this.combat.resolve(a, b, this.now);
    for (const f of this.fighters) if (f.weapon.hitbox.active) this.effects.trail(f.weapon.hitbox, f.weapon.data.color);

    if (this.options.mode === 'training') {
      if (this.infiniteStamina) { a.stamina = a.data.stamina; b.stamina = b.data.stamina; }
      for (const f of this.fighters) {
        if (f.hp <= 0 && f.stateTime > 1.1) f.reset(f.x, f.facing);
        else if (f.sinceHit > 2.5 && f.hp < f.data.hp) f.hp = Math.min(f.data.hp, f.hp + dt * 60);
      }
    } else if (a.hp <= 0 || b.hp <= 0) {
      this.winner = roundWinner(a.hp, b.hp) ?? -1;
      if (this.winner >= 0) { this.fighters[this.winner].rounds++; this.fighters[this.winner].win(); }
      this.phase = 'roundEnd'; this.phaseTime = 0; this.input.clear(); this.audio.play('round'); this.publish();
    }
    this.input.endStep();
  };

  private render = (_alpha: number, _dt: number) => {
    if ((this.paused || this.menu && !this.previewActive) && !this.dirty) return;
    this.dirty = false;
    const ctx = this.ctx;
    const w = this.viewportWidth, h = this.viewportHeight, dpr = this.pixelRatio;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0e1512'; ctx.fillRect(0, 0, w, h);
    const cover = Math.max(w / CONFIG.width, h / CONFIG.height);
    const fit = this.menu ? cover : Math.min(w / CONFIG.width, h / CONFIG.height);
    ctx.save();
    ctx.translate((w - CONFIG.width * fit) / 2, (h - CONFIG.height * fit) / 2);
    ctx.scale(fit, fit);
    this.arena.draw(ctx, this.visualTime, this.menu, this.settings.reducedMotion);
    if (this.effects.shake > 0 && this.settings.shake && !this.settings.reducedMotion) ctx.translate((Math.random() - 0.5) * this.effects.shake, (Math.random() - 0.5) * this.effects.shake * 0.6);
    if (!this.menu) this.effects.drawTrails(ctx);
    for (const f of this.fighters) {
      ctx.save();
      if (this.menu) {
        ctx.translate(f.x, f.y); ctx.scale(1.42, 1.42); ctx.translate(-f.x, -f.y);
      }
      drawFighter(ctx, f, this.visualTime);
      ctx.restore();
    }
    this.effects.draw(ctx);
    if (this.debug && !this.menu) for (const f of this.fighters) drawDebug(ctx, f, this.now, this.settings.parryWindow / 1000);
    ctx.restore();
  };

  private snapshotFighter(f: Fighter): FighterSnapshot {
    return { id: f.data.id, name: f.data.name, hp: f.hp, maxHp: f.data.hp, stamina: f.stamina, maxStamina: f.data.stamina, rounds: f.rounds, state: f.state, phase: f.phase || '', combo: f.comboIndex + 1 };
  }

  private publish() {
    let announcement = '';
    if (this.phase === 'intro') announcement = this.phaseTime < 1.4 ? `ROUND ${String(this.round).padStart(2, '0')}` : 'LUTEM';
    if (this.phase === 'roundEnd') announcement = this.winner < 0 ? 'EMPATE' : `${this.fighters[this.winner].data.name} VENCE`;
    if (announcement === 'LUTEM' && this.lastAnnouncement !== 'LUTEM') this.audio.play('round');
    this.lastAnnouncement = announcement;
    this.onSnapshot?.({
      fighters: [this.snapshotFighter(this.fighters[0]), this.snapshotFighter(this.fighters[1])],
      phase: this.phase, announcement, round: this.round, paused: this.paused,
      fps: this.loop.fps, debug: this.debug, distance: Math.round(Math.abs(this.fighters[0].x - this.fighters[1].x)),
      winner: this.winner, trainingHits: this.trainingHits, trainingDamage: this.trainingDamage, feedback: this.feedback,
    });
  }

  destroy() {
    this.loop.stop(); this.input.destroy(); this.audio.destroy();
    this.resizeObserver.disconnect(); document.removeEventListener('visibilitychange', this.visibility);
    this.onSnapshot = this.onPause = null;
  }
}