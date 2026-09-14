import { useEffect, useRef } from 'react';
import { Animation } from '../game/Animation';
import { Fighter } from '../game/Fighter';
import { drawFighter } from '../game/FighterRenderer';
import type { CharacterData } from '../game/types';

export function CharacterPortrait({ character, large = false, reducedMotion = false }: { character: CharacterData; large?: boolean; reducedMotion?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fighter = new Fighter(0, character, 0, 1);
    fighter.body.y = 0;
    let raf = 0;
    let previous = 0;
    let visible = true;
    let mounted = true;
    const width = large ? 660 : 180, height = large ? 400 : 128;
    canvas.width = width * (large ? 1.4 : 1); canvas.height = height * (large ? 1.4 : 1);
    const draw = (now: number) => {
      raf = 0;
      if (!mounted || !visible) return;
      if (large && now - previous < 30) { raf = requestAnimationFrame(draw); return; }
      const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
      previous = now;
      ctx.setTransform(large ? 1.4 : 1, 0, 0, large ? 1.4 : 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      Animation.update(fighter, reducedMotion ? 0 : now / 1000, dt);
      ctx.save();
      const scale = large ? character.weapon === 'spear' ? 1.9 : 2.08 : 1.05;
      ctx.translate(large ? 255 : 77, large ? 380 : 186);
      ctx.scale(scale, scale);
      drawFighter(ctx, fighter, now / 1000, false);
      ctx.restore();
      if (large && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw(performance.now());
    const observer = large ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) draw(performance.now());
    }) : null;
    observer?.observe(canvas);
    return () => { mounted = false; cancelAnimationFrame(raf); observer?.disconnect(); };
  }, [character, large, reducedMotion]);
  return <canvas ref={ref} className={large ? 'character-portrait large' : 'character-portrait'} aria-label={`${character.name}: ${character.description}`} role="img" />;
}