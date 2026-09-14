export type WeaponClass = 'sword' | 'katana' | 'dagger' | 'spear' | 'axe' | 'gauntlets';
export type AttackDirection = 'neutral' | 'up' | 'down' | 'forward';
export type AttackPhase = 'startup' | 'active' | 'recovery';
export type FighterState = 'idle' | 'move' | 'jump' | 'crouch' | 'attack' | 'guard' | 'dodge' | 'stun' | 'guardbreak' | 'victory' | 'defeat';
export type GameMode = 'cpu' | 'local' | 'training';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type DummyBehavior = 'idle' | 'guard' | 'attack' | 'cpu';
export type Outfit = 'coat' | 'haori' | 'hood' | 'cape' | 'vest' | 'jacket' | 'fur' | 'armor' | 'apron' | 'scarf' | 'robes';

export interface Point { x: number; y: number }
export interface Capsule {
  ax: number; ay: number; bx: number; by: number; radius: number;
  pax: number; pay: number; pbx: number; pby: number;
}
export interface Hurtbox extends Capsule { part: 'head' | 'torso' | 'arm' | 'leg' }
export interface WeaponHitbox extends Capsule { active: boolean }
export interface CharacterBody {
  x: number; y: number; vx: number; vy: number;
  width: number; height: number; grounded: boolean;
}
export interface GuardDirection { facing: number; minimumDot: number }
export interface ParryBox extends Capsule { enabled: boolean }
export interface Pose {
  head: Point; neck: Point; hip: Point; shoulder: Point; backShoulder: Point;
  elbow: Point; hand: Point; backElbow: Point; backHand: Point;
  knee: Point; foot: Point; backKnee: Point; backFoot: Point;
  weaponBase: Point; weaponTip: Point; weaponAngle: number;
}
export interface Command {
  move: number; jump: boolean; crouch: boolean; run: boolean;
  dodge: boolean; light: boolean; heavy: boolean;
  guard: boolean; guardPressed: boolean; up: boolean; down: boolean;
}
export interface AttackData {
  name: string; heavy: boolean; direction: AttackDirection;
  startup: number; active: number; recovery: number;
  damage: number; stamina: number; guardDamage: number;
  knockback: number; reach: number; motion: 'slash' | 'thrust' | 'punch' | 'chop';
  startAngle: number; endAngle: number; lunge: number;
}
export interface WeaponData {
  id: WeaponClass; name: string; description: string;
  reach: number; weight: number; radius: number; speed: number; guard: number;
  combo: number; color: string;
  light: Record<AttackDirection, AttackData[]>;
  heavy: Record<AttackDirection, AttackData>;
}
export interface CharacterData {
  id: string; name: string; title: string; weapon: WeaponClass;
  primary: string; secondary: string; accent: string; skin: string;
  outfit: Outfit; accessory: string; description: string;
  hp: number; speed: number; damage: number; stamina: number;
  stance: number; spread: number; idleSpeed: number; idleAmount: number;
  passive: { id: string; name: string; description: string };
  ratings: [number, number, number];
}
export interface ArenaData {
  id: string; name: string; subtitle: string; image: string;
  color: string; particle: 'leaf' | 'ash' | 'ember' | 'petal';
}
export type Action = 'left' | 'right' | 'up' | 'down' | 'light' | 'heavy' | 'guard' | 'dodge' | 'run';
export type KeyBindings = Record<Action, string>;
export interface Settings {
  volume: number; music: boolean; effects: boolean; shake: boolean;
  reducedMotion: boolean; quality: 'low' | 'high'; parryWindow: number;
  difficulty: Difficulty; roundsToWin: number;
  p1: KeyBindings; p2: KeyBindings;
}
export interface MatchOptions {
  mode: GameMode; p1: string; p2: string; arena: string;
  difficulty: Difficulty; roundsToWin: number;
}
export interface FighterSnapshot {
  name: string; id: string; hp: number; maxHp: number;
  stamina: number; maxStamina: number; rounds: number;
  state: FighterState; phase: string; combo: number;
}
export interface GameSnapshot {
  fighters: [FighterSnapshot, FighterSnapshot];
  phase: 'intro' | 'fight' | 'roundEnd' | 'matchEnd';
  announcement: string; round: number; paused: boolean;
  fps: number; debug: boolean; distance: number; winner: number;
  trainingHits: number; trainingDamage: number; feedback: string;
}

export function createCommand(): Command {
  return { move: 0, jump: false, crouch: false, run: false, dodge: false, light: false, heavy: false, guard: false, guardPressed: false, up: false, down: false };
}
export function clearCommand(command: Command) {
  command.move = 0;
  command.jump = command.crouch = command.run = command.dodge = false;
  command.light = command.heavy = command.guard = command.guardPressed = false;
  command.up = command.down = false;
}