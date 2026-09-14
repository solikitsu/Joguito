import { CONFIG } from './Config';

export class GameLoop {
  private frame = 0;
  private previous = 0;
  private accumulator = 0;
  private running = false;
  private sampleTime = 0;
  private sampleFrames = 0;
  private renderAccumulator = 0;
  fps = 60;

  constructor(private update: (dt: number) => void, private render: (alpha: number, dt: number) => void) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.previous = performance.now();
    this.renderAccumulator = 1 / CONFIG.targetFps;
    this.sampleTime = this.sampleFrames = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const realElapsed = Math.max(0, (now - this.previous) / 1000);
    const elapsed = Math.min(realElapsed, CONFIG.timestep * CONFIG.maxSubsteps);
    this.previous = now;
    this.accumulator += elapsed;
    let steps = 0;
    while (this.accumulator >= CONFIG.timestep && steps < CONFIG.maxSubsteps) {
      this.update(CONFIG.timestep);
      this.accumulator -= CONFIG.timestep;
      steps++;
    }
    this.sampleTime += realElapsed;
    this.renderAccumulator += realElapsed;
    const renderInterval = 1 / CONFIG.targetFps;
    if (this.renderAccumulator >= renderInterval - 0.0002) {
      this.render(this.accumulator / CONFIG.timestep, Math.min(this.renderAccumulator, 0.1));
      this.renderAccumulator %= renderInterval;
      this.sampleFrames++;
    }
    if (this.sampleTime >= 0.5) {
      this.fps = Math.round(this.sampleFrames / this.sampleTime);
      this.sampleTime = this.sampleFrames = 0;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.accumulator = 0;
  }
}