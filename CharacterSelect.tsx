import { useState } from 'react';
import type { CSSProperties } from 'react';
import { CHARACTERS, getCharacter } from '../game/data/CharacterData';
import { ARENAS } from '../game/data/ArenaData';
import { WEAPONS, WEAPON_LIST } from '../game/data/WeaponData';
import type { Difficulty, GameMode, MatchOptions, Settings, WeaponClass } from '../game/types';
import { BrandMark, Icon } from './Icon';
import { CharacterPortrait } from './CharacterPortrait';

export type SelectPurpose = 'play' | 'training' | 'browse';

interface Props {
  purpose: SelectPurpose;
  initialCharacter: string;
  initialArena: string;
  settings: Settings;
  onClose: () => void;
  onStart: (options: MatchOptions) => void;
  onArenaChange: (id: string) => void;
  onPlayWith: (id: string) => void;
}

export function CharacterSelect({ purpose, initialCharacter, initialArena, settings, onClose, onStart, onArenaChange, onPlayWith }: Props) {
  const [stage, setStage] = useState(0);
  const [p1, setP1] = useState(initialCharacter);
  const [p2, setP2] = useState(initialCharacter === 'shiro' ? 'kael' : 'shiro');
  const [mode, setMode] = useState<GameMode>(purpose === 'training' ? 'training' : 'cpu');
  const [filter, setFilter] = useState<WeaponClass | 'all'>('all');
  const [arena, setArena] = useState(initialArena);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
  const [rounds, setRounds] = useState(settings.roundsToWin);
  const browsing = purpose === 'browse';
  const selectedId = stage === 1 ? p2 : p1;
  const selected = getCharacter(selectedId);
  const weapon = WEAPONS[selected.weapon];
  const filtered = filter === 'all' ? CHARACTERS : CHARACTERS.filter(character => character.weapon === filter);
  const choose = (id: string) => stage === 1 ? setP2(id) : setP1(id);
  const next = () => {
    if (browsing) { onPlayWith(p1); return; }
    if (stage < 2) { setStage(stage + 1); setFilter('all'); }
    else onStart({ p1, p2, mode, arena, difficulty, roundsToWin: rounds });
  };
  const back = () => { if (stage > 0) { setStage(stage - 1); setFilter('all'); } else onClose(); };

  return <section className="selection-screen screen-enter" aria-label={browsing ? 'Personagens' : 'Preparar duelo'}>
    <header className="selection-header">
      <button className="text-button back-button" onClick={back}><Icon name="back" size={17} />{stage > 0 ? 'VOLTAR' : 'INÍCIO'}</button>
      <div className="selection-brand"><BrandMark size={25} /><span>IRONVEIL</span></div>
      {!browsing && <nav className="selection-steps" aria-label="Etapas do duelo">{['LUTADOR', mode === 'training' ? 'PARCEIRO' : 'OPONENTE', 'ARENA'].map((label, i) => <button key={label} className={stage === i ? 'active' : stage > i ? 'complete' : ''} aria-current={stage === i ? 'step' : undefined} onClick={() => { setStage(i); setFilter('all'); }}><span>{stage > i ? <Icon name="check" size={12} /> : `0${i + 1}`}</span>{label}</button>)}</nav>}
      {browsing && <span className="selection-catalogue">O ELENCO COMPLETO</span>}
    </header>

    {stage < 2 ? <div className="character-select-layout">
      <div className="roster-panel">
        <div className="roster-heading"><div><span className="eyebrow">{browsing ? 'ENCONTRE O SEU ESTILO' : stage === 0 ? 'JOGADOR 01' : mode === 'local' ? 'JOGADOR 02' : mode === 'training' ? 'PARCEIRO DE TREINO' : 'ADVERSÁRIO CPU'}</span><h2>{browsing ? 'Nenhum lutador é igual.' : stage === 0 ? 'Escolha seu lutador.' : 'Escolha seu oponente.'}</h2></div><span className="roster-count">{String(CHARACTERS.length).padStart(2, '0')}<small>LUTADORES</small></span></div>
        {!browsing && stage === 0 && purpose !== 'training' && <div className="mode-selector" aria-label="Modo de jogo"><button className={mode === 'cpu' ? 'active' : ''} onClick={() => setMode('cpu')}><Icon name="user" size={16} />1 VS 1 CPU</button><button className={mode === 'local' ? 'active' : ''} onClick={() => setMode('local')}><Icon name="users" size={17} />2 JOGADORES LOCAIS</button></div>}
        {purpose === 'training' && stage === 0 && <div className="training-selection-note"><Icon name="shield" size={16} /><span>TREINO LIVRE</span><p>Sem pressão. Só você e o próximo golpe.</p></div>}
        <div className="weapon-filters" aria-label="Filtrar por arma"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>TODOS</button>{WEAPON_LIST.map(item => <button key={item.id} title={item.name} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}><Icon name={item.id} size={15} /><span>{item.name.toUpperCase()}</span></button>)}</div>
        <div className="roster-grid" role="group" aria-label="Lutadores disponíveis">
          {filtered.map(character => <button className={`fighter-tile ${selectedId === character.id ? 'selected' : ''}`} key={character.id} aria-pressed={selectedId === character.id} aria-label={`${character.name}, ${WEAPONS[character.weapon].name}`} onClick={() => choose(character.id)} style={{ '--fighter-color': character.accent } as CSSProperties}>
            <span className="fighter-tile-number">{String(CHARACTERS.indexOf(character) + 1).padStart(2, '0')}</span><Icon name={character.weapon} size={13} className="fighter-tile-weapon" />
            <CharacterPortrait character={character} /><span className="fighter-tile-name">{character.name}</span>{selectedId === character.id && <span className="fighter-tile-check"><Icon name="check" size={10} /></span>}
          </button>)}
        </div>
        <div className="roster-bottom"><span>{filtered.length} LUTADORES DISPONÍVEIS</span><button className="text-button" onClick={() => choose(filtered[Math.floor(Math.random() * filtered.length)].id)}><Icon name="refresh" size={12} />ALEATÓRIO</button></div>
      </div>

      <div className="fighter-showcase" key={selectedId}>
        <div className="showcase-heading"><div className="weapon-label"><Icon name={selected.weapon} size={18} />{weapon.name.toUpperCase()}<span />{selected.title.toUpperCase()}</div><h3>{selected.name}</h3></div>
        <div className="showcase-art"><div className="showcase-ring" /><CharacterPortrait character={selected} large reducedMotion={settings.reducedMotion} /><span className="showcase-index">{String(CHARACTERS.indexOf(selected) + 1).padStart(2, '0')}</span></div>
        <div className="fighter-details"><p className="fighter-description">{selected.description}</p><div className="fighter-stat-lines">{['VELOCIDADE', 'ALCANCE', 'DEFESA'].map((label, i) => <div className="fighter-stat" key={label}><span>{label}</span><div>{[0, 1, 2, 3, 4].map(value => <i className={value < selected.ratings[i] ? 'filled' : ''} key={value} />)}</div></div>)}</div><div className="passive-detail"><Icon name="spark" size={21} /><div><span>PASSIVA <b>{selected.passive.name}</b></span><p>{selected.passive.description}</p></div></div></div>
      </div>
    </div> : <div className="arena-selection">
      <div className="arena-selection-title"><span className="eyebrow">O PALCO DO SEU PRÓXIMO DUELO</span><h2>Onde o aço vai falar?</h2><p>Cinco lugares. A mesma regra: o instante é seu.</p></div>
      <div className="arena-grid" role="group" aria-label="Arenas disponíveis">{ARENAS.map((item, i) => <button key={item.id} className={`arena-option ${arena === item.id ? 'selected' : ''}`} aria-pressed={arena === item.id} onClick={() => { setArena(item.id); onArenaChange(item.id); }}><div className="arena-option-image"><img src={item.image} alt={`Cenário ${item.name}`} /><span className="arena-option-number">0{i + 1}</span>{arena === item.id && <span className="arena-option-check"><Icon name="check" size={16} /></span>}</div><div className="arena-option-caption"><h3>{item.name}</h3><p>{item.subtitle}</p></div></button>)}</div>
      <div className="duel-settings"><div><span className="eyebrow">{mode === 'local' ? 'DUELO LOCAL' : 'DIFICULDADE DA CPU'}</span>{mode === 'local' ? <p>Dois jogadores. Um teclado. Nenhuma desculpa.</p> : <div className="difficulty-options">{([['easy', 'FÁCIL'], ['normal', 'NORMAL'], ['hard', 'DIFÍCIL']] as const).map(([value, label]) => <button key={value} className={difficulty === value ? 'active' : ''} onClick={() => setDifficulty(value)}>{label}</button>)}</div>}</div>{mode !== 'training' && <div><span className="eyebrow">ROUNDS PARA VENCER</span><div className="difficulty-options">{[1, 2, 3].map(value => <button key={value} className={rounds === value ? 'active' : ''} onClick={() => setRounds(value)}>{String(value).padStart(2, '0')}</button>)}</div></div>}<div className="arena-hint"><Icon name="keyboard" size={23} /><p>{mode === 'local' ? 'J1: WASD + J K L. J2: setas + 1 2 3. Os comandos seguem suas configurações.' : 'A CPU observa o duelo com atraso de reação. Ela não lê seus comandos.'}</p></div></div>
    </div>}

    <footer className="selection-footer"><div className="match-preview"><div><span>JOGADOR 01</span><strong>{getCharacter(p1).name}</strong></div>{!browsing && <><span className="versus">VS</span><div><span>{mode === 'local' ? 'JOGADOR 02' : mode === 'training' ? 'PARCEIRO' : 'CPU'}</span><strong>{getCharacter(p2).name}</strong></div></>}</div><button className="primary-button select-confirm" onClick={next}>{browsing ? 'LUTAR COM ESTE PERSONAGEM' : stage === 0 ? 'CONFIRMAR LUTADOR' : stage === 1 ? 'ESCOLHER ARENA' : mode === 'training' ? 'COMEÇAR TREINO' : 'ENTRAR NA ARENA'}<Icon name="arrow" size={19} /></button></footer>
  </section>;
}