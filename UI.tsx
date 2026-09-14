import type { PointerEvent } from 'react';
import type { Game } from '../game/Game';
import { keyLabel } from '../game/Config';
import type { Action, DummyBehavior, GameSnapshot, MatchOptions, Settings } from '../game/types';
import { BrandMark, Icon } from './Icon';

export function FightHUD({ snapshot, options, onPause }: { snapshot: GameSnapshot; options: MatchOptions; onPause: () => void }) {
  return <header className="fight-hud">
    {snapshot.fighters.map((fighter, i) => <div className={`fighter-hud player-${i + 1}`} key={i}>
      <div className="hud-name-row"><span className="hud-player-label">{i === 0 ? 'P1' : options.mode === 'local' ? 'P2' : 'CPU'}</span><h2>{fighter.name}</h2><div className="round-marks" aria-label={`${fighter.rounds} rounds vencidos`}>{Array.from({ length: options.roundsToWin }, (_, round) => <i key={round} className={round < fighter.rounds ? 'won' : ''} />)}</div></div>
      <div className="health-track" role="progressbar" aria-label={`Vida de ${fighter.name}`} aria-valuenow={Math.round(fighter.hp)} aria-valuemin={0} aria-valuemax={fighter.maxHp}><div className="health-fill" style={{ transform: `scaleX(${fighter.hp / fighter.maxHp})` }} /><span className="health-edge" style={{ left: `${fighter.hp / fighter.maxHp * 100}%` }} /></div>
      <div className="stamina-track" role="progressbar" aria-label={`Stamina de ${fighter.name}`} aria-valuenow={Math.round(fighter.stamina)} aria-valuemin={0} aria-valuemax={fighter.maxStamina}><div style={{ transform: `scaleX(${fighter.stamina / fighter.maxStamina})` }} /></div>
    </div>)}
    <div className="hud-center"><BrandMark size={26} /><span>{options.mode === 'training' ? 'TREINO' : `ROUND ${String(snapshot.round).padStart(2, '0')}`}</span><button className="hud-pause" onClick={onPause} aria-label="Pausar partida"><Icon name="pause" size={13} /><span>ESC</span></button></div>
  </header>;
}

export function DebugHUD({ snapshot, settings }: { snapshot: GameSnapshot; settings: Settings }) {
  return <aside className="debug-hud" aria-label="Diagnóstico de combate"><div><b>DEBUG / F3</b><span className={snapshot.fps < 50 ? 'fps-low' : ''}>{snapshot.fps} FPS</span></div><p>SIMULAÇÃO 120 Hz <span>DISTÂNCIA {snapshot.distance} px</span></p><p>PARRY {settings.parryWindow} ms <span>COLISÃO SWEPT</span></p><div className="debug-legend"><span><i className="hurt-color" /> HURTBOX</span><span><i className="hit-color" /> ARMA ATIVA</span><span><i className="parry-color" /> PARRY</span></div>{snapshot.fighters.map((f, i) => <p key={f.id + i}>P{i + 1} {f.state.toUpperCase()} / {f.phase || 'NEUTRO'}<span>{f.stamina.toFixed(1)} STA</span></p>)}</aside>;
}

export function TrainingHUD({ game, snapshot, onControls }: { game: Game | null; snapshot: GameSnapshot; onControls: () => void }) {
  return <aside className="training-hud"><div className="training-toolbar"><span className="eyebrow">LABORATÓRIO DE COMBATE</span><button className="icon-button" aria-label="Ver controles" onClick={onControls}><Icon name="keyboard" size={17} /></button></div><div className="training-values"><div><span>ACERTOS</span><strong>{String(snapshot.trainingHits).padStart(2, '0')}</strong></div><div><span>DANO TOTAL</span><strong>{snapshot.trainingDamage.toFixed(1)}</strong></div><span className="training-feedback" aria-live="polite">{snapshot.feedback || 'ENCONTRE A DISTÂNCIA'}</span></div><div className="training-actions"><label htmlFor="dummy-behavior">PARCEIRO</label><select id="dummy-behavior" value={game?.dummy || 'idle'} onChange={e => game?.setDummy(e.target.value as DummyBehavior)}><option value="idle">Parado</option><option value="guard">Defendendo</option><option value="attack">Atacando</option><option value="cpu">CPU ativa</option></select><button title="Reiniciar treino" aria-label="Reiniciar treino" onClick={() => game?.resetTraining()}><Icon name="refresh" size={16} /></button><button title="Alternar debug" aria-pressed={snapshot.debug} className={snapshot.debug ? 'active' : ''} onClick={() => game?.toggleDebug()}>F3</button></div><label className="training-stamina"><input type="checkbox" checked={game?.infiniteStamina || false} onChange={e => game?.setInfiniteStamina(e.target.checked)} />STAMINA INFINITA<span>A vida se recupera fora de combate.</span></label></aside>;
}

export function TouchControls({ game, settings }: { game: Game | null; settings: Settings }) {
  const touch = (event: PointerEvent<HTMLButtonElement>, action: Action, down: boolean) => {
    event.preventDefault();
    if (down) event.currentTarget.setPointerCapture(event.pointerId);
    game?.input.touch(action, down);
  };
  const button = (action: Action, label: string, className = '') => <button key={action} className={className} onPointerDown={event => touch(event, action, true)} onPointerUp={event => touch(event, action, false)} onPointerCancel={event => touch(event, action, false)} onLostPointerCapture={() => game?.input.touch(action, false)} aria-label={label}>{action === 'left' ? <Icon name="chevron-left" /> : action === 'right' ? <Icon name="chevron-right" /> : action === 'up' ? <span className="touch-up">↑</span> : action === 'down' ? <span>↓</span> : <><span>{label}</span><small>{keyLabel(settings.p1[action])}</small></>}</button>;
  return <div className="touch-controls"><div className="touch-dpad">{button('up', 'Pular', 'dpad-up')}{button('left', 'Esquerda', 'dpad-left')}{button('right', 'Direita', 'dpad-right')}{button('down', 'Agachar', 'dpad-down')}</div><div className="touch-attacks">{button('dodge', 'ESQUIVA')}{button('guard', 'DEFESA')}{button('light', 'LEVE', 'touch-primary')}{button('heavy', 'PESADO')}</div></div>;
}