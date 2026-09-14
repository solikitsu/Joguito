import { CONFIG } from './Config';
import { getArena } from './data/ArenaData';
import type { ArenaData } from './types';

export class Arena {
  data: ArenaData;
  private image: HTMLImageElement;
  private cache: HTMLCanvasElement;
  private ready = false;
  private generation = 0;

  constructor(id: string) {
    this.data = getArena(id);
    this.image = new Image();
    this.cache = document.createElement('canvas');
    this.cache.width = CONFIG.width; this.cache.height = CONFIG.height;
    this.load(id);
  }

  load(id: string) {
    this.data = getArena(id);
    const generation = ++this.generation;
    const image = new Image();
    image.onload = () => {
      if (generation !== this.generation) return;
      this.image = image;
      const ctx = this.cache.getContext('2d')!;
      ctx.drawImage(this.image, 0, 0, CONFIG.width, CONFIG.height);
      const shade = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
      shade.addColorStop(0, 'rgba(12,19,17,0.1)'); shade.addColorStop(0.55, 'rgba(12,19,17,0)'); shade.addColorStop(1, 'rgba(9,14,13,0.34)');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
      this.ready = true;
    };
    image.src = this.data.image;
  }

  draw(ctx: CanvasRenderingContext2D, time: number, menu: boolean, reducedMotion: boolean) {
    if (this.ready) {
      // A single cached background draw; tiny menu-only camera motion does not alter gameplay geometry.
      const drift = menu && !reducedMotion ? Math.sin(time * 0.08) * 3 : 0;
      ctx.drawImage(this.cache, -3 + drift, -2, CONFIG.width + 6, CONFIG.height + 4);
    } else {
      ctx.fillStyle = '#28332d'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }
    if (!menu) {
      ctx.fillStyle = 'rgba(10,17,15,0.11)'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }
  }
}