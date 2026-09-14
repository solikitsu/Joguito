import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Game } from './game/Game';
import { loadSettings, saveSettings } from './game/Config';
import { ARENAS } from './game/data/ArenaData';
import type { GameSnapshot, MatchOptions, Settings } from './game/types';
import { BrandMark, Icon, Wordmark } from './components/Icon';
import { CharacterSelect } from './components/CharacterSelect';
import type { SelectPurpose } from './components/CharacterSelect';
import { SettingsPanel } from './components/SettingsPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { DebugHUD, FightHUD, TouchControls, TrainingHUD } from './components/UI';

type Screen = 'home' | 'selection' | 'match';
type Panel = 'settings' | 'controls' | 'about' | null;

function ModalShell({ children, onClose, className = '' }: { children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, [tabindex="0"]');
    focusable()?.[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (ref.current?.querySelector('[data-key-capture="true"]')) return;
      if (event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keydown, true);
    return () => { window.removeEventListener('keydown', keydown, true); previous?.focus(); };
  }, []);
  return <div className={`modal-backdrop ${className}`} onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} className="modal-shell">{children}</div></div>;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const initialSettings = useRef(settings);
  const [screen, setScreen] = useState<Screen>('home');
  const [panel, setPanel] = useState<Panel>(null);
  const [purpose, setPurpose] = useState<SelectPurpose>('play');
  const [initialCharacter, setInitialCharacter] = useState('kael');
  const [arenaIndex, setArenaIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [options, setOptions] = useState<MatchOptions | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const resumeAfterPanel = useRef(false);
  const previousVolume = useRef(55);
  const arena = ARENAS[arenaIndex];

  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const game = new Game(canvasRef.current, initialSettings.current);
      gameRef.current = game;
      game.onSnapshot = setSnapshot;
      game.onPause = setPaused;
      return () => { game.destroy(); gameRef.current = null; };
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o Canvas.'); }
  }, []);

  useEffect(() => { saveSettings(settings); gameRef.current?.setSettings(settings); }, [settings]);
  useEffect(() => { gameRef.current?.setPreviewActive(screen !== 'selection'); }, [screen]);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    if (screen === 'match') document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [screen]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applySettings = useCallback((next: Settings) => setSettings(next), []);
  const uiSound = () => { gameRef.current?.audio.unlock(); gameRef.current?.audio.play('ui'); };

  function beginSelection(nextPurpose: SelectPurpose, character = initialCharacter) {
    uiSound();
    setPanel(null); setPaused(false);
    setInitialCharacter(character); setPurpose(nextPurpose);
    gameRef.current?.showMenu(arena.id);
    setScreen('selection');
  }

  function home() {
    uiSound(); setPanel(null); setScreen('home'); setPaused(false); setSnapshot(null);
    gameRef.current?.showMenu(arena.id);
  }

  function startMatch(nextOptions: MatchOptions) {
    uiSound(); setOptions(nextOptions); setScreen('match'); setPanel(null); setPaused(false);
    setInitialCharacter(nextOptions.p1);
    setArenaIndex(Math.max(0, ARENAS.findIndex(item => item.id === nextOptions.arena)));
    gameRef.current?.start(nextOptions);
    canvasRef.current?.focus();
  }

  function openPanel(nextPanel: Panel) {
    uiSound();
    resumeAfterPanel.current = screen === 'match' && !gameRef.current?.paused && gameRef.current?.phase !== 'matchEnd';
    if (screen === 'match') gameRef.current?.setPaused(true);
    setPanel(nextPanel);
  }

  function closePanel() {
    setPanel(null);
    if (resumeAfterPanel.current && screen === 'match') gameRef.current?.setPaused(false);
    resumeAfterPanel.current = false;
  }

  function changeArena(direction: number) {
    uiSound();
    const next = (arenaIndex + direction + ARENAS.length) % ARENAS.length;
    setArenaIndex(next); gameRef.current?.setArena(ARENAS[next].id);
  }

  async function fullscreen() {
    uiSound();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setToast('Tela cheia indisponível neste navegador. Experimente F11 no computador.'); }
  }

  function toggleSound() {
    gameRef.current?.audio.unlock();
    if (settings.volume > 0) { previousVolume.current = settings.volume; setSettings({ ...settings, volume: 0 }); }
    else setSettings({ ...settings, volume: previousVolume.current });
  }

  useEffect(() => {
    if (panel || screen === 'match') return;
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && screen === 'selection') { event.preventDefault(); home(); }
      if (event.code === 'Enter' && screen === 'home' && (event.target === document.body || event.target === canvasRef.current)) { event.preventDefault(); beginSelection('play'); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  return <main className={`game-app screen-${screen} ${settings.reducedMotion ? 'reduced-motion' : ''}`} onPointerDown={() => gameRef.current?.audio.unlock()}>
    <div className="scene-stage" style={{ backgroundImage: `url("${arena.image}")` }}>
      <canvas ref={canvasRef} className="game-canvas" tabIndex={-1} aria-label={screen === 'match' ? 'Arena de combate. Use os controles do teclado para jogar.' : 'Duelo entre Kael Riven e Shiro Vane no Pátio da Lua.'} />
    </div>

    {screen === 'home' && <>
      <div className="home-shade" />
      <header className="main-header">
        <button className="brand" onClick={home} aria-label="IRONVEIL, início"><BrandMark /><span>IRONVEIL<small>THE ART OF THE DUEL</small></span></button>
        <nav className="main-nav" aria-label="Navegação principal"><button className="active" onClick={home}>INÍCIO</button><button onClick={() => openPanel('about')}>O JOGO</button><button onClick={() => openPanel('controls')}>COMO JOGAR</button></nav>
        <div className="header-actions"><button className="controls-link" onClick={() => openPanel('controls')}><Icon name="keyboard" size={18} /><span>CONTROLES</span></button><span className="header-divider" /><button className="icon-button" onClick={toggleSound} aria-label={settings.volume > 0 ? 'Desativar som' : 'Ativar som'} title={settings.volume > 0 ? 'Desativar som' : 'Ativar som'}><Icon name={settings.volume > 0 ? 'volume' : 'muted'} size={18} /></button><button className="icon-button fullscreen-button" onClick={fullscreen} aria-label="Alternar tela cheia" title="Tela cheia"><Icon name="fullscreen" size={18} /></button></div>
      </header>

      <section className="home-content">
        <div className="hero-eyebrow"><span />CADA GOLPE. UMA DECISÃO.</div>
        <h1><Wordmark /></h1>
        <p className="hero-tagline">Aço contra aço. Instinto contra instinto.</p>
        <nav className="main-menu" aria-label="Menu do jogo">
          <button className="menu-item menu-primary" onClick={() => beginSelection('play')}><span className="menu-number">01</span><span className="menu-label">JOGAR</span><Icon name="arrow" size={23} /></button>
          <button className="menu-item" onClick={() => beginSelection('training')}><span className="menu-number">02</span><span className="menu-label">TREINO</span><Icon name="arrow" size={18} /></button>
          <button className="menu-item" onClick={() => beginSelection('browse')}><span className="menu-number">03</span><span className="menu-label">PERSONAGENS</span><Icon name="arrow" size={18} /></button>
          <button className="menu-item" onClick={() => openPanel('settings')}><span className="menu-number">04</span><span className="menu-label">CONFIGURAÇÕES</span><Icon name="arrow" size={18} /></button>
        </nav>
        <div className="home-footnote"><span className="small-cross">+</span>SEM SORTE. SÓ TIMING.</div>
      </section>

      <div className="arena-navigator"><div className="arena-navigator-label"><span>ESCOLHA O SEU CENÁRIO</span><span>{String(arenaIndex + 1).padStart(2, '0')} <i>/ 05</i></span></div><div className="arena-navigator-bottom"><div key={arena.id} className="arena-current"><Icon name="moon" size={19} /><h2>{arena.name}</h2></div><div className="arena-arrows"><button aria-label="Arena anterior" onClick={() => changeArena(-1)}><Icon name="chevron-left" size={17} /></button><button aria-label="Próxima arena" onClick={() => changeArena(1)}><Icon name="chevron-right" size={17} /></button></div></div><div className="arena-progress">{ARENAS.map((item, i) => <button key={item.id} className={i === arenaIndex ? 'active' : ''} aria-label={`Ver ${item.name}`} aria-current={i === arenaIndex ? 'true' : undefined} onClick={() => { setArenaIndex(i); gameRef.current?.setArena(item.id); }} />)}</div></div>

      <footer className="home-footer"><span><i />PROTÓTIPO JOGÁVEL <b>V. 0.1</b></span><span className="footer-center">DOMINE O INSTANTE.</span><span>LOCAL. OFFLINE. SEM DISTRAÇÕES.<Icon name="spark" size={13} /></span></footer>
    </>}

    {screen === 'selection' && <CharacterSelect key={`${purpose}-${initialCharacter}`} purpose={purpose} initialCharacter={initialCharacter} initialArena={arena.id} settings={settings} onClose={home} onStart={startMatch} onArenaChange={id => { const index = ARENAS.findIndex(item => item.id === id); if (index >= 0) setArenaIndex(index); gameRef.current?.setArena(id); }} onPlayWith={id => beginSelection('play', id)} />}

    {screen === 'match' && snapshot && options && <>
      <FightHUD snapshot={snapshot} options={options} onPause={() => gameRef.current?.setPaused(true)} />
      {snapshot.announcement && !paused && <div className={`fight-announcement ${snapshot.announcement === 'LUTEM' ? 'fight-call' : ''}`} key={snapshot.announcement}><span>{snapshot.phase === 'roundEnd' ? 'O INSTANTE TEM UM DONO' : 'A LÂMINA ESTÁ PRONTA'}</span><strong>{snapshot.announcement}</strong><i /></div>}
      {snapshot.debug && <DebugHUD snapshot={snapshot} settings={settings} />}
      {options.mode === 'training' && !paused && <TrainingHUD game={gameRef.current} snapshot={snapshot} onControls={() => openPanel('controls')} />}
      {!paused && snapshot.phase === 'fight' && <TouchControls game={gameRef.current} settings={settings} />}
      {snapshot.phase === 'matchEnd' && !panel && <div className="result-screen"><div className="result-content"><span className="eyebrow">{options.mode === 'local' ? `JOGADOR ${snapshot.winner + 1}` : snapshot.winner === 0 ? 'O DUELO É SEU' : 'CADA DERROTA ENSINA'}</span><h2>{snapshot.winner === 0 || options.mode === 'local' ? 'VITÓRIA.' : 'DERROTA.'}</h2><h3>{snapshot.fighters[snapshot.winner]?.name}</h3><div className="result-score"><span>{snapshot.fighters[0].rounds}</span><i>:</i><span>{snapshot.fighters[1].rounds}</span></div><button className="primary-button" onClick={() => startMatch(options)}>REVANCHE<Icon name="refresh" size={18} /></button><button className="result-secondary" onClick={() => beginSelection('play')}>ESCOLHER OUTRO DUELO<Icon name="arrow" size={17} /></button><button className="text-button" onClick={home}>VOLTAR AO INÍCIO</button></div></div>}
      {paused && !panel && snapshot.phase !== 'matchEnd' && <ModalShell onClose={() => gameRef.current?.setPaused(false)} className="pause-backdrop"><section className="pause-dialog" role="dialog" aria-modal="true" aria-label="Partida pausada"><BrandMark size={38} /><span className="eyebrow">RESPIRE. O DUELO PODE ESPERAR.</span><h2>PAUSADO</h2><nav><button className="primary-button" onClick={() => gameRef.current?.setPaused(false)}>CONTINUAR<Icon name="play" size={18} /></button><button onClick={() => startMatch(options)}>REINICIAR DUELO<Icon name="refresh" size={17} /></button><button onClick={() => openPanel('controls')}>CONTROLES<Icon name="keyboard" size={17} /></button><button onClick={() => openPanel('settings')}>CONFIGURAÇÕES<Icon name="settings" size={17} /></button><button onClick={home}>VOLTAR AO INÍCIO<Icon name="back" size={17} /></button></nav><span className="pause-key"><kbd>ESC</kbd> PARA CONTINUAR</span></section></ModalShell>}
    </>}

    {panel && <ModalShell onClose={closePanel}>
      {panel === 'settings' && <SettingsPanel settings={settings} onChange={applySettings} onClose={closePanel} />}
      {panel === 'controls' && <ControlsPanel settings={settings} onClose={closePanel} onTrain={() => beginSelection('training')} />}
      {panel === 'about' && <section className="dialog about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title"><div className="dialog-top"><span className="eyebrow">A ARTE DO DUELO</span><button className="icon-button" aria-label="Fechar" onClick={closePanel}><Icon name="close" /></button></div><h2 id="about-title"><Wordmark /></h2><p className="about-lead">Um duelo não se vence por acaso.</p><p>IRONVEIL é um jogo de luta 2D sobre distância, leitura e o tempo exato. Sem poderes impossíveis. Sem sequências intermináveis. Só você, seu oponente e o aço entre os dois.</p><div className="about-features"><div><span>01</span><h3>O contato é real.</h3><p>Cada arma percorre o espaço e precisa tocar o adversário. Startup, impacto e recuperação fazem parte de cada escolha.</p></div><div><span>02</span><h3>Encontre sua silhueta.</h3><p>25 lutadores, seis classes de armas e pequenas passivas. Estilos diferentes sobre uma mesma base de combate.</p></div><div><span>03</span><h3>O duelo é seu.</h3><p>Treine, enfrente a CPU ou divida o teclado. Cenários e áudio locais, sem contas, serviços ou conexão.</p></div></div><div className="dialog-footer"><span className="saved-note">CANVAS 2D / MOTOR MODULAR</span><button className="primary-button compact" onClick={() => beginSelection('play')}>ENTRAR NO DUELO<Icon name="arrow" size={17} /></button></div></section>}
    </ModalShell>}
    {toast && <div className="toast" role="status"><Icon name="info" size={17} />{toast}<button aria-label="Dispensar mensagem" onClick={() => setToast('')}><Icon name="close" size={14} /></button></div>}
    {error && <div className="fatal-error" role="alert"><h2>Não foi possível abrir a arena.</h2><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}>TENTAR NOVAMENTE</button></div>}
  </main>;
}
