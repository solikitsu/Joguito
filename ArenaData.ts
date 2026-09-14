import moon from '../../assets/moon-courtyard.jpg?inline';
import temple from '../../assets/broken-temple.jpg?inline';
import rooftops from '../../assets/kairo-rooftops.jpg?inline';
import forge from '../../assets/crimson-forge.jpg?inline';
import garden from '../../assets/ash-garden.jpg?inline';
import type { ArenaData } from '../types';

export const ARENAS: ArenaData[] = [
  { id: 'moon', name: 'P\u00e1tio da Lua', subtitle: 'O sil\u00eancio tamb\u00e9m \u00e9 uma arma.', image: moon, color: '#b9bb94', particle: 'leaf' },
  { id: 'temple', name: 'Templo Quebrado', subtitle: 'Entre ru\u00ednas, s\u00f3 a t\u00e9cnica permanece.', image: temple, color: '#cbbda3', particle: 'ash' },
  { id: 'rooftops', name: 'Telhados de Kairo', subtitle: 'Um \u00faltimo duelo antes da noite.', image: rooftops, color: '#d4a18b', particle: 'leaf' },
  { id: 'forge', name: 'Forja Carmesim', subtitle: 'O a\u00e7o lembra o fogo.', image: forge, color: '#e9975f', particle: 'ember' },
  { id: 'garden', name: 'Jardim das Cinzas', subtitle: 'Tudo passa. O instante fica.', image: garden, color: '#d1bdc5', particle: 'petal' },
];

export function getArena(id: string) { return ARENAS.find(arena => arena.id === id) || ARENAS[0]; }