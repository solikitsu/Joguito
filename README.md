# IRONVEIL

Duelo 2D local com combate no Canvas, personagens procedurais e menus em React. O motor nao usa React, bibliotecas de fisica, sprites remotos, API ou CDN. O codigo-fonte e TypeScript, compilado para JavaScript no pacote offline.

## Abrir Offline

Abra **`dist/index.html`** diretamente em um navegador moderno. Esse e o arquivo distribuivel: imagens, estilos e JavaScript ficam incorporados no proprio HTML. Nao e necessario iniciar servidor, instalar dependencias na maquina de jogo ou ter conexao com a internet.

O `index.html` da raiz e a entrada de desenvolvimento do Vite, nao a versao distribuivel. O primeiro clique habilita o audio por exigencia dos navegadores. As preferencias sao salvas localmente quando o navegador permite armazenamento em URLs `file:`.

## Jogar

- **Jogar:** escolha CPU ou dois jogadores no mesmo teclado, lutador, oponente e arena. A dificuldade e os rounds podem ser alterados antes do duelo.
- **Treino:** parceiro parado, defendendo, atacando ou controlado pela CPU; vida regenerada fora de combate; stamina infinita opcional; reinicio e debug.
- **Personagens:** todos os 25 lutadores, filtros por arma, visual procedural e informacoes das passivas.
- **Configuracoes:** volume, ambiente, particulas, camera, qualidade, movimentos ambientes, janela de parry, rounds e remapeamento dos dois jogadores.

| Acao | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Mover | A / D | Esquerda / Direita |
| Pular / direcao alta | W | Cima |
| Agachar / direcao baixa | S | Baixo |
| Ataque leve | J | 1 |
| Ataque pesado | K | 2 |
| Defender / parry | L | 3 |
| Esquiva | Shift esquerdo | Enter |
| Correr, enquanto segurado | Espaco | Shift direito |
| Pausar | Esc | Esc |
| Alternar debug | F3 | F3 |

Pressione cima e ataque juntos para atacar alto sem iniciar um pulo. Frente + ataque gera estocada ou avanco, de acordo com a arma. Baixo + ataque muda a altura. O personagem orienta a guarda para o oponente quando esta livre; durante a guarda, a orientacao fica travada. A esquiva pode atravessar o adversario, permitindo atacar pelas costas.

Teclados simples podem apresentar ghosting ao pressionar muitas teclas ao mesmo tempo. Remapear os controles ajuda a escolher combinacoes que o hardware reconhece. Ha controles touch para o primeiro jogador; a orientacao horizontal e recomendada.

## Combate

- Simulacao fixa de **120 Hz**, renderizacao limitada a **60 FPS**, ate oito substeps por frame. O contador de FPS usa tempo real, sem mascarar frames lentos.
- `CharacterBody` e o collider fisico. `Hurtbox`, `WeaponHitbox`, `ParryBox` e `GuardDirection` sao estruturas independentes.
- A pose procedural posiciona maos, armas e membros. Essas mesmas coordenadas atualizam as formas de colisao e sao desenhadas na tela.
- Cada ataque possui startup, active e recovery. Hitboxes de armas so ficam ativas durante active.
- Colisao de capsulas entre os extremos anteriores e atuais das armas e membros, com subdivisao adaptativa do movimento relativo. Nao ha colisao pixel-perfect.
- A ponta da lanca e a cabeca do machado sao perigosas; o cabo nao causa dano. Nas luvas, a hitbox acompanha a mao que desfere o soco.
- Cada ataque tem um identificador e uma mascara de alvos ja atingidos. Acerto, bloqueio ou parry consomem aquele impacto contra o alvo.
- Defesa exige contato com a regiao de guarda e ataque frontal. Segurar defesa nao renova a janela de parry.
- Parry padrao de **140 ms**, configuravel entre 80 e 220 ms. Shiro acrescenta 20 ms. Parry anula o dano, recupera um pouco de stamina e atordoa o atacante.
- Ataques, bloqueios e esquivas gastam stamina. A guarda quebra ao esgotar. Movimento livre e descanso recuperam energia depois do atraso de recuperacao.
- Esquiva com invulnerabilidade parcial; buffer curto de comandos; combos de dois a quatro golpes; hitstop, knockback e choque real de armas.
- A CPU usa observacoes atrasadas, nao entradas do jogador: 320 ms no Facil, 205 ms no Normal e 125 ms no Dificil, mais o intervalo entre decisoes.

## Arquitetura

| Arquivo | Responsabilidade |
| --- | --- |
| `src/game/Game.ts` | Coordenacao, modos, rounds, pausa, treino, renderizacao e snapshots do HUD |
| `src/game/GameLoop.ts` | Timestep fixo, limite de renderizacao, pausa de pagina oculta e FPS |
| `src/game/Input.ts` | Teclado, touch, remapeamento e preservacao de comandos no hitstop |
| `src/game/Fighter.ts` | Maquina de estados compartilhada, stamina, buffer e passivas |
| `src/game/data/CharacterData.ts` | Os 25 personagens, roupas, cores, posturas, stats e passivas |
| `src/game/data/WeaponData.ts` | Seis armas, golpes direcionais, tempos, dano, alcance e combos |
| `src/game/Weapon.ts` | Geometria perigosa e definicao do ataque |
| `src/game/CombatSystem.ts` | Contato, acerto unico, defesa, parry, guard break e feedback |
| `src/game/HitboxSystem.ts` | Capsulas, distancias de segmentos, sweep e sincronizacao de hurtboxes |
| `src/game/Physics.ts` | Aceleracao, desaceleracao, gravidade, paredes e separacao dos corpos |
| `src/game/AI.ts` | Memoria de percepcao, latencia artificial, distancia e decisoes |
| `src/game/Animation.ts` | Esqueleto, IK dos bracos, passos plantados, ataques e poses finais |
| `src/game/FighterRenderer.ts` | Roupas, silhuetas, acessorios, armas e visualizacao de debug |
| `src/game/Effects.ts` | Pools fixos de particulas, faiscas, trilhas e mensagens de impacto |
| `src/game/Audio.ts` | Audio local sintetizado com Web Audio |
| `src/game/Arena.ts` | Fundo em cache, ambiente e movimento de camera do menu |
| `src/game/data/ArenaData.ts` | As cinco arenas e suas ilustracoes incorporadas |
| `src/game/RoundRules.ts` | Regras puras de vencedor e fim de partida |
| `src/game/Config.ts` | Valores centrais, preferencias e controles padrao |
| `src/components/UI.tsx` | HUD, treino, touch e estatisticas de debug |
| `src/components/CharacterSelect.tsx` | Fluxo de lutador, oponente e arena |
| `src/game/tests.ts` | Testes de regressao da mesma simulacao usada na partida |
| `src/App.tsx` | Entrada da aplicacao, navegacao e paineis |

Para adicionar um lutador, acrescente dados em `CharacterData.ts`; nao duplique `Fighter`. Uma nova passiva pequena usa um identificador e um hook pontual em `Fighter`, `Weapon` ou `CombatSystem`. Novos golpes devem ser dados em `WeaponData.ts`; novas animacoes entram no resolvedor de poses compartilhado. Modos usam `MatchOptions` e podem ganhar controladores dedicados sem modificar colisao ou renderizacao.

## Otimizacao

Fundos sao rasterizados em um canvas de cache. Particulas, trilhas, labels, hurtboxes, comandos e observacoes da IA usam estruturas prealocadas. O HUD recebe snapshots a 10 Hz; nenhuma entidade de gameplay e um elemento DOM. Colisoes so sao verificadas com armas ativas, apos um teste amplo de distancia. Cenas escondidas atras da selecao nao sao atualizadas. Paginas ocultas suspendem o loop e o audio; pausa nao redesenha um canvas inalterado.

O modo Essencial limita o DPR a 1 e reduz a quantidade de particulas. O modo Alto limita o DPR a 1,6. Eventos de combate e vozes de audio sao criados apenas quando ocorrem, nao a cada frame. Nos casos de travamento longo, o tempo da simulacao e limitado para evitar uma espiral de atualizacoes atrasadas.

**60 FPS e o alvo, nao uma medicao garantida em todo computador.** Use F3 para observar a taxa real no dispositivo de destino. Validacao visual, responsividade percebida, som e estabilidade prolongada precisam ser testados em navegador real.

## Testes

Na interface, abra **Configuracoes > Diagnostico > Executar testes**. A suite verifica contato geometrico, tunneling, fases inativas, whiff, dano unico, guarda frontal, parry, guard break, stamina, invulnerabilidade, parada de movimento, IA, integridade do elenco, luvas, ponta da lanca, conexao mao/arma, buffer, algumas passivas e regras de rounds.

Com as dependencias de desenvolvimento instaladas, a mesma suite pode ser executada por `node scripts/test-engine.mjs`. O runner carrega os modulos via Vite em middleware mode, sem iniciar um servidor HTTP. Ele retorna codigo 1 se qualquer assercao falhar. Testes de regras nao substituem verificacao de Canvas, entradas reais, audio ou performance no navegador.

Checklist para uma sessao real:

1. Abra `dist/index.html` sem rede. Teste todos os menus, as cinco arenas e o audio apos o primeiro clique.
2. No treino, escolha Kael contra Shiro. Ative F3. Confirme que golpes fora de alcance nao reduzem a vida e que um unico golpe nao registra varios acertos.
3. Mantenha L pressionado antes de atacar com a CPU. Observe bloqueio sem parry, consumo de stamina e guard break. Use uma nova pressao proxima do contato para aparar.
4. Atravesse a guarda com uma esquiva e ataque pelas costas. Teste os intervalos sem invulnerabilidade no inicio e no fim da esquiva.
5. Jogue com Raze: alterne socos, esquiva e parry. Depois compare alcance e recuperacao de adagas, lanca e machado.
6. Teste dois jogadores, mudanca de teclas, pausa, Alt-Tab, reinicio e vitoria de partida. Verifique que nao ficam teclas presas.
7. Observe F3 por pelo menos 30 segundos em todas as arenas, em Alto e Essencial. Repita em uma maquina modesta. Verifique tambem 1366x768, 1920x1080 e touch em paisagem.

O build gera um unico HTML com `vite-plugin-singlefile`, ja configurado no projeto. Nenhum recurso de runtime depende da internet.

## Estado De Verificacao

A compilacao de producao foi verificada e a pasta `dist` contem somente `index.html`. A suite inclui 27 testes executaveis, mas sua execucao e os testes manuais em um navegador real nao foram verificados neste ambiente. Nao ha, portanto, uma medicao confirmada de 60 FPS em hardware modesto. O diagnostico integrado e o checklist acima foram incluidos para tornar essa validacao reproduzivel.