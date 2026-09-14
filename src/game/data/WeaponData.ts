import type { AttackData, AttackDirection, WeaponClass, WeaponData } from '../types';

interface WeaponSeed {
  id: WeaponClass; name: string; description: string; reach: number;
  radius: number; weight: number; speed: number; guard: number; combo: number; color: string;
  startup: number; active: number; recovery: number; damage: number;
  stamina: number; knockback: number; heavyMultiplier: number;
}

const seeds: WeaponSeed[] = [
  { id: 'sword', name: 'Espada', description: 'Equil\u00edbrio entre alcance, defesa e precis\u00e3o.', reach: 110, radius: 5, weight: 1, speed: 1, guard: 1, combo: 3, color: '#d4e1dd', startup: 0.14, active: 0.105, recovery: 0.23, damage: 13, stamina: 13, knockback: 150, heavyMultiplier: 2.05 },
  { id: 'katana', name: 'Katana', description: 'Cortes velozes. Um instante muda o duelo.', reach: 107, radius: 4, weight: 0.8, speed: 1.045, guard: 1.2, combo: 3, color: '#e7e9db', startup: 0.105, active: 0.085, recovery: 0.225, damage: 12, stamina: 12, knockback: 125, heavyMultiplier: 1.9 },
  { id: 'dagger', name: 'Adagas', description: 'Encurte a dist\u00e2ncia. N\u00e3o d\u00ea tempo de reagir.', reach: 49, radius: 5, weight: 0.45, speed: 1.13, guard: 1.3, combo: 4, color: '#c9c0e0', startup: 0.075, active: 0.075, recovery: 0.16, damage: 8, stamina: 9, knockback: 85, heavyMultiplier: 1.9 },
  { id: 'spear', name: 'Lan\u00e7a', description: 'Domine o espa\u00e7o com a ponta da arma.', reach: 185, radius: 5, weight: 1.15, speed: 0.96, guard: 1.05, combo: 2, color: '#d5d9bc', startup: 0.18, active: 0.105, recovery: 0.31, damage: 16, stamina: 16, knockback: 190, heavyMultiplier: 1.95 },
  { id: 'axe', name: 'Machado', description: 'Peso, compromisso e uma guarda em peda\u00e7os.', reach: 114, radius: 16, weight: 1.5, speed: 0.87, guard: 0.95, combo: 2, color: '#ded0bf', startup: 0.25, active: 0.135, recovery: 0.38, damage: 21, stamina: 20, knockback: 235, heavyMultiplier: 1.85 },
  { id: 'gauntlets', name: 'Luvas', description: 'Press\u00e3o de perto. Ritmo de rua.', reach: 27, radius: 13, weight: 0.65, speed: 1.12, guard: 1.02, combo: 4, color: '#c8d4d4', startup: 0.09, active: 0.075, recovery: 0.145, damage: 8, stamina: 8, knockback: 95, heavyMultiplier: 2.15 },
];

function makeAttack(seed: WeaponSeed, heavy: boolean, direction: AttackDirection, index = 0): AttackData {
  const thrust = seed.id === 'spear' || (direction === 'forward' && seed.id !== 'axe' && seed.id !== 'gauntlets');
  const punch = seed.id === 'gauntlets';
  const low = direction === 'down';
  const high = direction === 'up';
  const finisher = index === seed.combo - 1;
  return {
    name: punch ? (high ? 'Uppercut' : low ? 'Golpe baixo' : heavy ? 'Direto pesado' : ['Jab', 'Cruzado', 'Gancho', 'Direto'][index]) : thrust ? 'Estocada' : high ? 'Corte vertical' : low ? 'Corte rasteiro' : heavy ? 'Corte pesado' : ['Corte de abertura', 'Corte de retorno', 'Corte final', 'Reverso'][index],
    heavy, direction,
    startup: seed.startup * (heavy ? 1.8 : 1) * (high ? 1.05 : 1),
    active: seed.active * (heavy ? 1.35 : 1),
    recovery: seed.recovery * (heavy ? 1.65 : finisher ? 1.16 : 1),
    damage: seed.damage * (heavy ? seed.heavyMultiplier : finisher ? 1.16 : 1) * (low ? 0.91 : 1),
    stamina: seed.stamina * (heavy ? 1.85 : 1),
    guardDamage: seed.stamina * (heavy ? seed.id === 'axe' ? 3.25 : 2.55 : 1.15),
    knockback: seed.knockback * (heavy ? 1.65 : finisher ? 1.12 : 1),
    reach: seed.reach * (heavy ? 1.08 : 1) * (direction === 'forward' ? 1.06 : 1),
    motion: punch ? 'punch' : thrust ? 'thrust' : seed.id === 'axe' || high ? 'chop' : 'slash',
    startAngle: low ? -0.45 : high ? -2.2 : index % 2 ? 0.75 : heavy ? -2.05 : -1.55,
    endAngle: low ? 0.45 : high ? 0.9 : index % 2 ? -1.25 : 0.75,
    lunge: direction === 'forward' ? 95 : heavy ? 42 : punch ? 42 : 22,
  };
}

function makeWeapon(seed: WeaponSeed): WeaponData {
  const directions: AttackDirection[] = ['neutral', 'up', 'down', 'forward'];
  const light = {} as WeaponData['light'];
  const heavy = {} as WeaponData['heavy'];
  for (const direction of directions) {
    light[direction] = Array.from({ length: seed.combo }, (_, i) => makeAttack(seed, false, direction, i));
    heavy[direction] = makeAttack(seed, true, direction);
  }
  return { ...seed, light, heavy };
}

export const WEAPONS = Object.fromEntries(seeds.map(seed => [seed.id, makeWeapon(seed)])) as Record<WeaponClass, WeaponData>;
export const WEAPON_LIST = Object.values(WEAPONS);