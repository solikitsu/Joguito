import type { Settings } from './types';

export const CONFIG = {
  width: 1600,
  height: 900,
  ground: 720,
  leftWall: 90,
  rightWall: 1510,
  timestep: 1 / 120,
  targetFps: 60,
  maxSubsteps: 8,
  walkSpeed: 238,
  runSpeed: 344,
  acceleration: 3200,
  deceleration: 3900,
  gravity: 1900,
  jumpSpeed: 850,
  staminaRegen: 23,
  staminaDelay: 0.42,
  dodgeCost: 23,
  dodgeDuration: 0.31,
  dodgeSpeed: 670,
  dodgeInvulnerableStart: 0.035,
  dodgeInvulnerableEnd: 0.19,
  inputBuffer: 0.14,
  guardBreakTime: 0.94,
  parryStun: 0.53,
  parryWindow: 0.14,
  roundIntro: 2.1,
  roundEnd: 2.1,
  particlePool: 180,
  trailPool: 70,
  labelPool: 12,
  maxPixelRatio: 1.6,
} as const;

export const DEFAULT_SETTINGS: Settings = {
  volume: 55,
  music: true,
  effects: true,
  shake: true,
  reducedMotion: false,
  quality: 'high',
  parryWindow: 140,
  difficulty: 'normal',
  roundsToWin: 2,
  p1: { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', light: 'KeyJ', heavy: 'KeyK', guard: 'KeyL', dodge: 'ShiftLeft', run: 'Space' },
  p2: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', light: 'Digit1', heavy: 'Digit2', guard: 'Digit3', dodge: 'Enter', run: 'ShiftRight' },
};

export function loadSettings(): Settings {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const parsed = JSON.parse(localStorage.getItem('ironveil.settings.v1') || '{}');
    const saved = parsed && typeof parsed === 'object' ? parsed : {};
    const volume = Number(saved.volume ?? 55);
    const parryWindow = Number(saved.parryWindow ?? 140);
    const validBindings = (value: unknown, defaults: Settings['p1']) => {
      const result = { ...defaults };
      if (value && typeof value === 'object') {
        for (const key of Object.keys(defaults) as (keyof Settings['p1'])[]) {
          const code = (value as Record<string, unknown>)[key];
          if (typeof code === 'string' && code.length > 0 && code.length < 30 && code !== 'Escape' && code !== 'F3') result[key] = code;
        }
      }
      return result;
    };
    return {
      ...DEFAULT_SETTINGS,
      volume: Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : 55,
      parryWindow: Number.isFinite(parryWindow) ? Math.max(80, Math.min(220, parryWindow)) : 140,
      music: typeof saved.music === 'boolean' ? saved.music : true,
      effects: typeof saved.effects === 'boolean' ? saved.effects : true,
      shake: typeof saved.shake === 'boolean' ? saved.shake : true,
      reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : reducedMotion,
      quality: saved.quality === 'low' ? 'low' : 'high',
      difficulty: saved.difficulty === 'easy' || saved.difficulty === 'hard' ? saved.difficulty : 'normal',
      roundsToWin: [1, 2, 3].includes(saved.roundsToWin) ? saved.roundsToWin : 2,
      p1: validBindings(saved.p1, DEFAULT_SETTINGS.p1),
      p2: validBindings(saved.p2, DEFAULT_SETTINGS.p2),
    };
  } catch {
    return { ...DEFAULT_SETTINGS, reducedMotion, p1: { ...DEFAULT_SETTINGS.p1 }, p2: { ...DEFAULT_SETTINGS.p2 } };
  }
}

export function saveSettings(settings: Settings) {
  try { localStorage.setItem('ironveil.settings.v1', JSON.stringify(settings)); } catch { /* File URLs may disallow storage. */ }
}

export function keyLabel(code: string) {
  const names: Record<string, string> = {
    ArrowLeft: '\u2190', ArrowRight: '\u2192', ArrowUp: '\u2191', ArrowDown: '\u2193',
    ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT D', Space: 'ESPA\u00c7O', Enter: 'ENTER',
    ControlLeft: 'CTRL', ControlRight: 'CTRL D', AltLeft: 'ALT', Escape: 'ESC',
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';',
  };
  return names[code] || code.replace('Key', '').replace('Digit', '').replace('Numpad', 'NUM ');
}