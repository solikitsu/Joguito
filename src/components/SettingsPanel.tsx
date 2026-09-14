import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, keyLabel } from '../game/Config';
import { runEngineTests } from '../game/tests';
import type { TestResult } from '../game/tests';
import type { Action, Settings } from '../game/types';
import { Icon } from './Icon';

export const ACTION_NAMES: Record<Action, string> = {
  left: 'Mover para a esquerda', right: 'Mover para a direita', up: 'Pular / ataque alto', down: 'Agachar / ataque baixo',
  light: 'Ataque leve', heavy: 'Ataque pesado', guard: 'Defesa / parry', dodge: 'Esquiva', run: 'Correr (segurar)',
};

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) {
  return <div className="setting-row"><div><span>{label}</span>{description && <p>{description}</p>}</div><button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={onChange}><span /></button></div>;
}

export function SettingsPanel({ settings, onChange, onClose }: { settings: Settings; onChange: (settings: Settings) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'general' | 'controls' | 'tests'>('general');
  const [player, setPlayer] = useState<'p1' | 'p2'>('p1');
  const [listening, setListening] = useState<Action | null>(null);
  const [message, setMessage] = useState('');
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });

  useEffect(() => {
    if (!listening) return;
    const capture = (event: KeyboardEvent) => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.code === 'Escape') { setListening(null); return; }
      if (event.code === 'F3' || event.code.startsWith('Meta') || event.code.startsWith('Alt') || event.code.startsWith('Control') || /^F\d+$/.test(event.code)) {
        setMessage('Essa tecla est\u00e1 reservada ao navegador ou ao debug.'); return;
      }
      const next: Settings = { ...settings, p1: { ...settings.p1 }, p2: { ...settings.p2 } };
      const old = next[player][listening];
      for (const owner of ['p1', 'p2'] as const) {
        for (const action of Object.keys(next[owner]) as Action[]) {
          if (next[owner][action] === event.code) next[owner][action] = old;
        }
      }
      next[player][listening] = event.code;
      onChange(next); setListening(null); setMessage('Tecla atualizada. Conflitos s\u00e3o trocados automaticamente.');
    };
    window.addEventListener('keydown', capture, true);
    return () => window.removeEventListener('keydown', capture, true);
  }, [listening, settings, player, onChange]);

  return <section className="dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div className="dialog-top"><span className="eyebrow">AJUSTE O SEU RITMO</span><button className="icon-button" aria-label="Fechar configurações" onClick={onClose}><Icon name="close" /></button></div>
    <h2 id="settings-title">Configurações</h2>
    <div className="panel-tabs" role="tablist" aria-label="Categorias de configurações">
      {([['general', 'GERAL'], ['controls', 'CONTROLES'], ['tests', 'DIAGN\u00d3STICO']] as const).map(([id, label]) => <button role="tab" aria-selected={tab === id} key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setListening(null); }}>{label}</button>)}
    </div>
    <div className="dialog-content settings-content">
      {tab === 'general' && <>
        <div className="setting-row volume-row"><div><label htmlFor="volume">Volume geral</label><p>Sons sintetizados localmente. Sem arquivos externos.</p></div><div className="range-control"><input id="volume" type="range" min="0" max="100" value={settings.volume} onChange={e => update('volume', Number(e.target.value))} /><output>{settings.volume}%</output></div></div>
        <Toggle label="Ambiente sonoro" description="Uma trilha discreta para manter o foco." checked={settings.music} onChange={() => update('music', !settings.music)} />
        <Toggle label="Partículas e trilhas" checked={settings.effects} onChange={() => update('effects', !settings.effects)} />
        <Toggle label="Impacto de câmera" description="Tremor sutil em golpes pesados." checked={settings.shake} onChange={() => update('shake', !settings.shake)} />
        <Toggle label="Reduzir movimento ambiente" checked={settings.reducedMotion} onChange={() => update('reducedMotion', !settings.reducedMotion)} />
        <div className="setting-row"><div><span>Qualidade visual</span><p>Essencial limita a resolução e reduz partículas.</p></div><div className="segmented"><button className={settings.quality === 'low' ? 'active' : ''} onClick={() => update('quality', 'low')}>ESSENCIAL</button><button className={settings.quality === 'high' ? 'active' : ''} onClick={() => update('quality', 'high')}>ALTA</button></div></div>
        <div className="setting-row"><div><label htmlFor="parry-window">Janela de parry</label><p>Padrão: 140 ms. Só uma nova pressão inicia a janela.</p></div><div className="range-control"><input id="parry-window" type="range" min="80" max="220" step="10" value={settings.parryWindow} onChange={e => update('parryWindow', Number(e.target.value))} /><output>{settings.parryWindow} ms</output></div></div>
        <div className="setting-row"><span>Rounds para vencer</span><div className="segmented">{[1, 2, 3].map(value => <button key={value} className={settings.roundsToWin === value ? 'active' : ''} onClick={() => update('roundsToWin', value)}>{value}</button>)}</div></div>
      </>}
      {tab === 'controls' && <>
        <div className="binding-intro"><div className="segmented"><button className={player === 'p1' ? 'active' : ''} onClick={() => { setPlayer('p1'); setListening(null); }}>JOGADOR 1</button><button className={player === 'p2' ? 'active' : ''} onClick={() => { setPlayer('p2'); setListening(null); }}>JOGADOR 2</button></div><span>Clique em uma tecla para alterar.</span></div>
        {(Object.keys(ACTION_NAMES) as Action[]).map(action => <div className="setting-row binding-row" key={action}><span>{ACTION_NAMES[action]}</span><button data-key-capture={listening === action ? 'true' : undefined} className={`key-binding ${listening === action ? 'listening' : ''}`} onClick={() => { setListening(action); setMessage('Pressione uma tecla. Esc cancela.'); }}>{listening === action ? 'PRESSIONE UMA TECLA' : keyLabel(settings[player][action])}<Icon name="keyboard" size={15} /></button></div>)}
        <p className="settings-note" aria-live="polite">{message || 'ESC pausa a partida. F3 alterna o debug. Essas duas teclas s\u00e3o reservadas.'}</p>
      </>}
      {tab === 'tests' && <div className="diagnostics">
        <Icon name="shield" size={32} /><h3>Precisão não é uma promessa.</h3><p>Execute testes determinísticos da simulação de combate, usando o mesmo motor da partida.</p>
        <button className="primary-button compact" onClick={() => setTests(runEngineTests())}><Icon name="play" size={16} />EXECUTAR TESTES</button>
        {tests && <><div className={`test-summary ${tests.every(test => test.passed) ? 'passed' : 'failed'}`}>{tests.filter(test => test.passed).length} / {tests.length} TESTES APROVADOS</div><div className="test-list">{tests.map(test => <div className={`test-item ${test.passed ? 'passed' : 'failed'}`} key={test.name}><Icon name={test.passed ? 'check' : 'close'} size={16} /><div><span>{test.name}</span>{!test.passed && <p>{test.detail}</p>}</div></div>)}</div></>}
        <p className="settings-note">Testes de regras não medem a performance do seu computador. Durante a luta, F3 mostra o FPS real e as formas de colisão.</p>
      </div>}
    </div>
    <div className="dialog-footer"><button className="text-button" onClick={() => { onChange({ ...DEFAULT_SETTINGS, p1: { ...DEFAULT_SETTINGS.p1 }, p2: { ...DEFAULT_SETTINGS.p2 } }); setMessage('Configura\u00e7\u00f5es padr\u00e3o restauradas.'); }}><Icon name="refresh" size={14} />RESTAURAR PADRÃO</button><span className="saved-note"><Icon name="check" size={13} /> SALVO NESTE DISPOSITIVO</span></div>
  </section>;
}