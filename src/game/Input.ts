import type { Command, KeyBindings, Settings } from './types';
import { createCommand } from './types';

export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private touchHeld = new Set<string>();
  private commands = [createCommand(), createCommand()];
  private bindings: [KeyBindings, KeyBindings];
  private capturedKeys = new Set<string>();
  enabled = false;
  onPause: (() => void) | null = null;
  onDebug: (() => void) | null = null;
  onBlur: (() => void) | null = null;

  constructor(settings: Settings) {
    this.bindings = [settings.p1, settings.p2];
    this.setSettings(settings);
    window.addEventListener('keydown', this.keydown, { passive: false });
    window.addEventListener('keyup', this.keyup, { passive: false });
    window.addEventListener('blur', this.blur);
  }

  setSettings(settings: Settings) {
    this.bindings = [settings.p1, settings.p2];
    this.capturedKeys = new Set([...Object.values(settings.p1), ...Object.values(settings.p2)]);
    this.clear();
  }

  private isHeld(key: string) { return this.enabled && (this.held.has(key) || this.touchHeld.has(key)); }
  private isPressed(key: string) { return this.enabled && this.pressed.has(key); }

  private keydown = (event: KeyboardEvent) => {
    if (!this.enabled || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) this.onPause?.();
      return;
    }
    if (event.code === 'F3') {
      event.preventDefault();
      if (!event.repeat) this.onDebug?.();
      return;
    }
    if (this.capturedKeys.has(event.code)) {
      event.preventDefault();
      if (!this.held.has(event.code)) this.pressed.add(event.code);
      this.held.add(event.code);
    }
  };

  private keyup = (event: KeyboardEvent) => {
    if (this.enabled && this.held.has(event.code)) event.preventDefault();
    this.held.delete(event.code);
  };

  private blur = () => { this.clear(); this.onBlur?.(); };

  touch(action: keyof KeyBindings, down: boolean) {
    const code = this.bindings[0][action];
    if (down) {
      if (!this.touchHeld.has(code)) this.pressed.add(code);
      this.touchHeld.add(code);
    } else this.touchHeld.delete(code);
  }

  read(player: number): Command {
    const b = this.bindings[player];
    const c = this.commands[player];
    c.move = Number(this.isHeld(b.right) || this.isPressed(b.right)) - Number(this.isHeld(b.left) || this.isPressed(b.left));
    c.up = this.isHeld(b.up) || this.isPressed(b.up); c.down = this.isHeld(b.down) || this.isPressed(b.down);
    c.light = this.isPressed(b.light); c.heavy = this.isPressed(b.heavy);
    // Up + attack is a high attack; a bare up press is a jump.
    c.jump = this.isPressed(b.up) && !c.light && !c.heavy;
    c.crouch = this.isHeld(b.down); c.run = this.isHeld(b.run);
    c.dodge = this.isPressed(b.dodge);
    c.guardPressed = this.isPressed(b.guard);
    c.guard = this.isHeld(b.guard) || c.guardPressed;
    return c;
  }

  endStep() { this.pressed.clear(); }
  clear() { this.held.clear(); this.pressed.clear(); this.touchHeld.clear(); }
  destroy() {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('blur', this.blur);
    this.clear();
  }
}