import { useState } from 'react';
import { keyLabel } from '../game/Config';
import type { Action, Settings } from '../game/types';
import { Icon } from './Icon';
import { ACTION_NAMES } from './SettingsPanel';

export function ControlsPanel({ settings, onClose, onTrain }: { settings: Settings; onClose: () => void; onTrain: () => void }) {
  const [player, setPlayer] = useState<'p1' | 'p2'>('p1');
  return <section className="dialog controls-dialog" role="dialog" aria-modal="true" aria-labelledby="controls-title">
    <div className="dialog-top"><span className="eyebrow">MENOS BOTÕES. MAIS INTENÇÃO.</span><button className="icon-button" aria-label="Fechar controles" onClick={onClose}><Icon name="close" /></button></div>
    <h2 id="controls-title">O tempo certo muda tudo.</h2>
    <p className="dialog-lead">Aprenda os comandos. Encontre o seu ritmo.</p>
    <div className="controls-layout">
      <div><div className="panel-tabs"><button className={player === 'p1' ? 'active' : ''} onClick={() => setPlayer('p1')}>JOGADOR 1</button><button className={player === 'p2' ? 'active' : ''} onClick={() => setPlayer('p2')}>JOGADOR 2</button></div>
        <div className="controls-list">{(Object.keys(ACTION_NAMES) as Action[]).map(action => <div key={action}><span>{ACTION_NAMES[action]}</span><kbd>{keyLabel(settings[player][action])}</kbd></div>)}</div>
      </div>
      <div className="combat-principles">
        <article><span className="principle-number">01</span><div><h3>Defenda o instante.</h3><p>Segure defesa para bloquear pela frente. Aperte pouco antes do impacto para aparar: janela de {settings.parryWindow} ms.</p></div></article>
        <article><span className="principle-number">02</span><div><h3>Cada golpe tem um preço.</h3><p>Ataques e esquivas gastam stamina. Uma guarda sem energia se quebra. Caminhe e respire para recuperar.</p></div></article>
        <article><span className="principle-number">03</span><div><h3>A distância é uma arma.</h3><p>A lâmina precisa tocar o adversário. Combine ataque com cima, baixo ou frente para mudar o golpe.</p></div></article>
        <div className="direction-note"><Icon name="info" size={17} /><p>Para um ataque alto no chão, pressione cima e ataque juntos. Cima sozinho pula.</p></div>
      </div>
    </div>
    <div className="dialog-footer"><span className="saved-note"><kbd>ESC</kbd> PAUSA <span className="small-divider" /> <kbd>F3</kbd> DEBUG</span><button className="primary-button compact" onClick={onTrain}>EXPERIMENTAR NO TREINO<Icon name="arrow" size={18} /></button></div>
  </section>;
}