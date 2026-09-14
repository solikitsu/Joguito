import { AI } from './AI';
import { Animation } from './Animation';
import { GameAudio } from './Audio';
import { CombatSystem } from './CombatSystem';
import { CONFIG, DEFAULT_SETTINGS } from './Config';
import { Effects } from './Effects';
import { Fighter } from './Fighter';
import { HitboxSystem, capsule, capsulesOverlap, setCapsule, sweptCapsules } from './HitboxSystem';
import { Physics } from './Physics';
import { CHARACTERS, getCharacter } from './data/CharacterData';
import { WEAPON_LIST } from './data/WeaponData';
import { matchWon, roundWinner } from './RoundRules';
import { createCommand } from './types';
import type { Command } from './types';

export interface TestResult { name: string; passed: boolean; detail: string }

function assert(condition: unknown, message: string) { if (!condition) throw new Error(message); }

export function runEngineTests(): TestResult[] {
  const results: TestResult[] = [];
  function test(name: string, run: () => void) {
    try { run(); results.push({ name, passed: true, detail: 'OK' }); }
    catch (error) { results.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  }
  const makePair = (distance = 145) => [new Fighter(0, getCharacter('kael'), 600, 1), new Fighter(1, getCharacter('shiro'), 600 + distance, -1)] as const;
  const sync = (f: Fighter, time: number) => {
    Animation.update(f, time, CONFIG.timestep);
    HitboxSystem.sync(f.pose, f.hurtboxes, f.parryBox, f.facing, f.state === 'guard', f.poseReset);
    f.weapon.sync(f.pose, f.phase === 'active', f.poseReset); f.poseReset = false;
  };
  function simulate(a: Fighter, b: Fighter, control?: (time: number, a: Command, b: Command) => void, duration = 0.8) {
    const audio = new GameAudio(DEFAULT_SETTINGS);
    const combat = new CombatSystem(new Effects(), audio, DEFAULT_SETTINGS);
    const ca = createCommand(), cb = createCommand();
    let hits = 0, parries = 0, blocks = 0, breaks = 0;
    combat.onEvent = e => { if (e.kind === 'hit') hits++; if (e.kind === 'parry') parries++; if (e.kind === 'block') blocks++; if (e.kind === 'guardbreak') breaks++; };
    sync(a, 0); sync(b, 0);
    for (let t = 0; t < duration; t += CONFIG.timestep) {
      ca.light = ca.heavy = ca.guardPressed = cb.light = cb.heavy = cb.guardPressed = false;
      control?.(t, ca, cb);
      a.update(ca, b, CONFIG.timestep, t, DEFAULT_SETTINGS);
      b.update(cb, a, CONFIG.timestep, t, DEFAULT_SETTINGS);
      Physics.separate(a.body, b.body, a.state === 'dodge' || b.state === 'dodge');
      sync(a, t); sync(b, t); combat.resolve(a, b, t);
    }
    audio.destroy();
    return { hits, parries, blocks, breaks };
  }

  test('C\u00e1psulas: contato e separa\u00e7\u00e3o reais', () => {
    const a = capsule(3), b = capsule(5);
    setCapsule(a, 0, 0, 100, 0, true); setCapsule(b, 50, -10, 50, 10, true);
    assert(capsulesOverlap(a, b), 'Segmentos cruzados devem colidir.');
    setCapsule(b, 150, -10, 150, 10, true);
    assert(!capsulesOverlap(a, b), 'Segmentos separados n\u00e3o podem colidir.');
  });
  test('Swept collision: l\u00e2mina r\u00e1pida n\u00e3o atravessa o alvo', () => {
    const a = capsule(2), b = capsule(4);
    setCapsule(a, 0, -60, 70, -60, true); setCapsule(a, 0, 60, 70, 60);
    setCapsule(b, 40, 0, 40, 0, true);
    assert(!capsulesOverlap(a, b), 'O frame final deve estar al\u00e9m do alvo.');
    assert(sweptCapsules(a, b), 'O trajeto entre frames deve registrar contato.');
  });
  test('Um ataque sem contato n\u00e3o causa dano', () => {
    const [a, b] = makePair(430); a.startAttack(false, 'neutral');
    simulate(a, b); assert(b.hp === b.data.hp, 'Um golpe fora de alcance causou dano.');
  });
  test('Startup e recovery n\u00e3o ativam a arma', () => {
    const [a] = makePair(); a.startAttack(false, 'neutral'); sync(a, 0);
    assert(!a.weapon.hitbox.active && a.phase === 'startup', 'Startup ativou a hitbox.');
    a.attackTime = a.startup + a.attackData!.active + 0.01; sync(a, 1);
    assert(!a.weapon.hitbox.active && a.phase === 'recovery', 'Recovery ativou a hitbox.');
  });
  test('Um golpe causa dano uma \u00fanica vez', () => {
    const [a, b] = makePair(); a.startAttack(false, 'forward');
    const result = simulate(a, b);
    assert(result.hits === 1, `Esperado 1 impacto real; recebido ${result.hits}.`);
    assert(b.hp < b.data.hp, 'A estocada deveria atingir o oponente.');
  });
  test('Defesa sustentada bloqueia e consome stamina', () => {
    const [a, b] = makePair(); a.startAttack(false, 'forward');
    const result = simulate(a, b, (_t, _ca, cb) => { cb.guard = true; });
    assert(result.blocks === 1 && result.parries === 0, 'Defesa segurada n\u00e3o pode gerar parry autom\u00e1tico.');
    assert(b.hp === b.data.hp && b.stamina < b.data.stamina, 'Bloqueio deve preservar vida e gastar stamina.');
  });
  test('Parry no tempo certo zera dano e atordoa', () => {
    const [a, b] = makePair(); a.startAttack(false, 'forward');
    let pressed = false;
    const result = simulate(a, b, (t, _ca, cb) => {
      cb.guard = t >= 0.09;
      if (cb.guard && !pressed) { cb.guardPressed = true; pressed = true; }
    }, 0.4);
    assert(result.parries === 1, `Esperado parry; recebido ${result.parries}.`);
    assert(b.hp === b.data.hp && a.state === 'stun', 'Parry n\u00e3o protegeu ou n\u00e3o puniu o atacante.');
  });
  test('Defesa n\u00e3o bloqueia um golpe pelas costas', () => {
    const [a, b] = makePair(); b.facing = 1; b.guardDirection.facing = 1; b.state = 'guard'; a.startAttack(false, 'forward');
    simulate(a, b, (_t, _ca, cb) => { cb.guard = true; });
    assert(b.hp < b.data.hp, 'A guarda protegeu as costas.');
  });
  test('Stamina zerada causa Guard Break', () => {
    const [a, b] = makePair(); b.stamina = 3; a.startAttack(true, 'forward');
    const result = simulate(a, b, (_t, _ca, cb) => { cb.guard = true; }, 0.6);
    assert(result.breaks === 1 && b.state === 'guardbreak', 'A guarda deveria quebrar.');
  });
  test('Sem stamina, n\u00e3o h\u00e1 ataque gr\u00e1tis', () => {
    const [a] = makePair(); a.stamina = 0;
    assert(!a.startAttack(true, 'neutral'), 'Ataque pesado sem stamina foi permitido.');
    assert(!a.startAttack(false, 'neutral'), 'Ataque leve sem stamina foi permitido.');
  });
  test('Esquiva possui invulnerabilidade limitada', () => {
    const [a, b] = makePair(); const c = createCommand(); c.dodge = true;
    a.update(c, b, CONFIG.timestep, 0, DEFAULT_SETTINGS); c.dodge = false;
    for (let t = CONFIG.timestep; t < 0.09; t += CONFIG.timestep) a.update(c, b, CONFIG.timestep, t, DEFAULT_SETTINGS);
    assert(a.invulnerable, 'Esquiva deveria estar nos i-frames.');
    for (let t = 0.09; t < 0.4; t += CONFIG.timestep) a.update(c, b, CONFIG.timestep, t, DEFAULT_SETTINGS);
    assert(!a.invulnerable && a.state !== 'dodge', 'Invulnerabilidade permaneceu ap\u00f3s a esquiva.');
  });
  test('Movimento para sem deslizar', () => {
    const [a, b] = makePair(500); const c = createCommand(); c.move = 1;
    for (let i = 0; i < 40; i++) a.update(c, b, CONFIG.timestep, i * CONFIG.timestep, DEFAULT_SETTINGS);
    c.move = 0;
    for (let i = 0; i < 15; i++) a.update(c, b, CONFIG.timestep, i * CONFIG.timestep, DEFAULT_SETTINGS);
    assert(a.body.vx === 0, `Velocidade residual: ${a.body.vx}.`);
  });
  test('IA respeita lat\u00eancia artificial', () => {
    const [a, b] = makePair(); const ai = new AI('hard'); a.startAttack(true, 'forward');
    const c = ai.update(b, a, 0, CONFIG.timestep);
    assert(!c.guard && !c.dodge && !c.light && !c.heavy, 'A IA reagiu sem hist\u00f3rico perceptivo.');
  });
  test('O elenco tem exatamente os 25 nomes solicitados', () => {
    const names = ['KAEL RIVEN', 'SHIRO VANE', 'NYX', 'ORIN KAST', 'BRAMM', 'RAZE', 'VESPER', 'AKARI', 'KIRO', 'TALOS', 'GARR', 'VOLT', 'DANTE KROSS', 'REI KAGAMI', 'MOTH', 'SYLVA', 'DRAK', 'KNUCK', 'SOLEN', 'YUREI', 'FLICK', 'AUREX', 'MORV', 'HEX', 'CAIN VOR'];
    assert(CHARACTERS.length === 25, `Elenco com ${CHARACTERS.length} personagens.`);
    assert(names.every((name, index) => CHARACTERS[index].name === name), 'Nome ou ordem do elenco incorreto.');
    assert(new Set(CHARACTERS.map(character => character.id)).size === 25, 'IDs repetidos.');
    assert(new Set(CHARACTERS.map(character => character.passive.id)).size === 25, 'Passivas repetidas.');
  });
  test('Seis armas com sequ\u00eancias curtas e tempos distintos', () => {
    assert(WEAPON_LIST.length === 6, 'Devem existir seis classes.');
    assert(new Set(WEAPON_LIST.map(weapon => weapon.light.neutral[0].startup)).size === 6, 'Armas compartilham o mesmo startup.');
    for (const weapon of WEAPON_LIST) {
      assert(weapon.combo >= 2 && weapon.combo <= 4, `${weapon.name}: combo fora de 2 a 4.`);
      for (const direction of ['neutral', 'up', 'down', 'forward'] as const) {
        assert(weapon.light[direction].length === weapon.combo, `${weapon.name}: combo incompleto.`);
        assert(weapon.heavy[direction].damage > weapon.light[direction][0].damage, `${weapon.name}: pesado sem dano extra.`);
        assert(weapon.heavy[direction].recovery > weapon.light[direction][0].recovery, `${weapon.name}: pesado sem compromisso.`);
      }
    }
  });
  test('Todos os lutadores t\u00eam corpo e quatro regi\u00f5es de hurtbox', () => {
    for (const character of CHARACTERS) {
      const f = new Fighter(0, character, 600, 1); sync(f, 0);
      assert(new Set(f.hurtboxes.map(hurt => hurt.part)).size === 4, `${character.name}: hurtboxes incompletas.`);
      assert(f.body.width > 0 && f.body.height > 0, `${character.name}: collider f\u00edsico inv\u00e1lido.`);
      assert(f.hurtboxes.every(box => Number.isFinite(box.ax) && Number.isFinite(box.ay)), `${character.name}: pose inv\u00e1lida.`);
    }
  });
  test('Luvas atingem com a m\u00e3o e registram dano f\u00edsico', () => {
    const a = new Fighter(0, getCharacter('raze'), 600, 1), b = new Fighter(1, getCharacter('shiro'), 678, -1);
    a.startAttack(false, 'neutral'); const result = simulate(a, b);
    assert(result.hits === 1 && b.hp < b.data.hp, 'O soco n\u00e3o produziu um \u00fanico contato real.');
  });
  test('Lan\u00e7a acerta longe, mas o cabo n\u00e3o causa dano', () => {
    const a = new Fighter(0, getCharacter('orin'), 600, 1), b = new Fighter(1, getCharacter('shiro'), 810, -1);
    a.startAttack(false, 'neutral'); simulate(a, b);
    assert(b.hp < b.data.hp, 'A ponta da lan\u00e7a deveria acertar de longe.');
    const closeA = new Fighter(0, getCharacter('orin'), 600, 1), closeB = new Fighter(1, getCharacter('shiro'), 657, -1);
    closeA.startAttack(false, 'neutral'); simulate(closeA, closeB);
    assert(closeB.hp === closeB.data.hp, 'O cabo da lan\u00e7a causou dano de l\u00e2mina.');
  });
  test('Armas permanecem presas \u00e0 m\u00e3o durante o ataque', () => {
    for (const character of CHARACTERS) {
      const f = new Fighter(0, character, 600, 1);
      f.startAttack(false, 'neutral');
      const duration = f.attackDuration;
      for (let t = 0; t < duration; t += CONFIG.timestep) {
        f.attackTime = t; sync(f, t);
        const p = f.pose;
        const front = Math.hypot(p.hand.x - p.weaponBase.x, p.hand.y - p.weaponBase.y);
        const back = Math.hypot(p.backHand.x - p.weaponBase.x, p.backHand.y - p.weaponBase.y);
        assert(Math.min(front, back) < 0.001, `${character.name}: arma desconectada da m\u00e3o.`);
        const length = Math.hypot(p.weaponTip.x - p.weaponBase.x, p.weaponTip.y - p.weaponBase.y);
        assert(Math.abs(length - f.weapon.data.reach * f.weapon.reachMultiplier) < 0.001, `${character.name}: a arma mudou de tamanho.`);
      }
    }
  });
  test('Duas guardas n\u00e3o geram parry sem ataque', () => {
    const [a, b] = makePair(75);
    const result = simulate(a, b, (t, ca, cb) => { ca.guard = cb.guard = true; ca.guardPressed = cb.guardPressed = t === 0; });
    assert(result.parries === 0 && result.hits === 0, 'Houve um impacto sem arma ativa.');
  });
  test('Buffer preserva um ataque no fim da recupera\u00e7\u00e3o', () => {
    const [a, b] = makePair(450); a.startAttack(false, 'neutral');
    const end = a.attackDuration; let pressed = false;
    simulate(a, b, (t, ca) => {
      if (!pressed && t >= end - 0.065) { ca.light = true; pressed = true; }
    }, end + 0.18);
    assert(a.attackId === 2 && a.comboIndex === 1, 'O comando buffered n\u00e3o iniciou o segundo golpe.');
  });
  test('Hex cancela apenas a pequena janela inicial do leve', () => {
    const hex = new Fighter(0, getCharacter('hex'), 600, 1), opponent = new Fighter(1, getCharacter('kael'), 900, -1);
    const command = createCommand(); command.guard = command.guardPressed = true;
    hex.startAttack(false, 'neutral'); hex.update(command, opponent, CONFIG.timestep, 0.02, DEFAULT_SETTINGS);
    assert(hex.state === 'guard' && !hex.attackData, 'Cancelamento exclusivo de Hex falhou.');
    const late = new Fighter(0, getCharacter('hex'), 600, 1); late.startAttack(false, 'neutral'); late.attackTime = 0.07;
    late.update(command, opponent, CONFIG.timestep, 0.08, DEFAULT_SETTINGS);
    assert(late.state === 'attack', 'Hex cancelou fora da janela de 60 ms.');
  });
  test('Kael recebe desconto somente no terceiro leve', () => {
    const [a] = makePair(); a.comboIndex = 1; a.comboExpires = 0.2;
    const before = a.stamina; a.startAttack(false, 'neutral');
    assert(Math.abs(before - a.stamina - a.attackData!.stamina * 0.85) < 0.001, 'O desconto de Kael n\u00e3o foi aplicado.');
  });
  test('Raze recupera mais stamina ao avan\u00e7ar', () => {
    const raze = new Fighter(0, getCharacter('raze'), 600, 1), opponent = new Fighter(1, getCharacter('kael'), 1200, -1);
    const command = createCommand(); command.move = 1; raze.stamina = 50;
    raze.update(command, opponent, 0.1, 0.1, DEFAULT_SETTINGS);
    assert(Math.abs(raze.stamina - 50 - CONFIG.staminaRegen * 1.18 * 0.1) < 0.001, 'Regenera\u00e7\u00e3o de avan\u00e7o incorreta.');
  });
  test('Talos possui alcance f\u00edsico adicional', () => {
    const talos = new Fighter(0, getCharacter('talos'), 600, 1); sync(talos, 0);
    const reach = Math.hypot(talos.pose.weaponTip.x - talos.pose.weaponBase.x, talos.pose.weaponTip.y - talos.pose.weaponBase.y);
    assert(Math.abs(reach - talos.weapon.data.reach * 1.05) < 0.001, 'O b\u00f4nus n\u00e3o alterou a geometria real.');
  });
  test('Round s\u00f3 termina com vida zerada', () => {
    assert(roundWinner(1, 1) === null, 'O round terminou com ambos vivos.');
    assert(roundWinner(30, 0) === 0 && roundWinner(0, 30) === 1, 'O vencedor foi invertido.');
    assert(roundWinner(0, 0) === -1, 'Nocaute duplo deve ser empate.');
    assert(!matchWon(1, 2) && matchWon(2, 2), 'A melhor de tr\u00eas foi calculada incorretamente.');
  });
  test('Paredes e corpos f\u00edsicos impedem sobreposi\u00e7\u00e3o', () => {
    const [a, b] = makePair(5); Physics.separate(a.body, b.body, false);
    assert(Math.abs(a.x - b.x) >= 43, 'Os colliders f\u00edsicos continuam sobrepostos.');
    a.body.vx = -10000; Physics.integrate(a.body, 1);
    assert(a.x === CONFIG.leftWall && a.body.vx === 0, 'O corpo atravessou a parede.');
  });
  return results;
}