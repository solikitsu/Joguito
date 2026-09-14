import type { CSSProperties, ReactNode } from 'react';

export type IconName = 'arrow' | 'back' | 'chevron-left' | 'chevron-right' | 'volume' | 'muted' | 'fullscreen' | 'keyboard' | 'close' | 'settings' | 'pause' | 'play' | 'check' | 'shield' | 'swords' | 'refresh' | 'user' | 'users' | 'spark' | 'info' | 'moon' | 'sword' | 'katana' | 'dagger' | 'spear' | 'axe' | 'gauntlets';

const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    back: <><path d="M20 12H5m6-7-7 7 7 7" /></>,
    'chevron-left': <path d="m14 6-6 6 6 6" />,
    'chevron-right': <path d="m10 6 6 6-6 6" />,
    volume: <><path d="m11 5-5 4H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    muted: <><path d="m11 5-5 4H3v6h3l5 4V5Z" /><path d="m16 9 6 6m0-6-6 6" /></>,
    fullscreen: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></>,
    keyboard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 12h.1M10 12h.1M14 12h.1M18 12h.1M7 15h10" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    settings: <><path d="m9 3-.8 3-2 .9-2.8-.8-2 3.5 2 2.2v2.4l-2 2.2 2 3.5 2.8-.8 2 .9.8 3h4l.8-3 2-.9 2.8.8 2-3.5-2-2.2v-2.4l2-2.2-2-3.5-2.8.8-2-.9L13 3Z" transform="translate(1 -1) scale(.92)" /><circle cx="12" cy="12" r="3" /></>,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
    play: <path d="m8 4 12 8-12 8V4Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 4v6c0 5-8 9-8 9s-8-4-8-9V7l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
    swords: <><path d="m4 3 3 1 12 13-2 2L4 7 4 3Zm16 0-3 1-5 6m-3 3-4 4 2 2 4-4M2 17l5 5m10-5 5 5m-3-3 3 3m-17-3-3 3" /></>,
    refresh: <><path d="M20 8a9 9 0 1 0 1 7M20 3v6h-6" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3" /></>,
    users: <><circle cx="9" cy="7" r="3.5" /><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 5" /></>,
    spark: <><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    moon: <path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z" />,
    sword: <><path d="m19 2 2 2-9 12-4-4L19 2ZM5 11l8 8M2 22l6-6m-7 4 3 3" /></>,
    katana: <><path d="M21 2C19 11 14 15 9 18l-3-3C13 12 17 8 21 2ZM4 14l7 7M7 18l-5 5" /></>,
    dagger: <><path d="m8 2 3 9-3 3-3-3 3-9ZM3 14h10m-5 0v7m10-12 3 7-3 3-3-3 3-7Zm-4 10h8m-4 0v4" /></>,
    spear: <><path d="m20 2 1 7-4-1-1-4 4-2ZM17 8 3 22m11-12 3 3" /></>,
    axe: <><path d="M15 4 5 22m9-18 6 2-2 9-8-3M14 4l-4-2-5 7 5 3" /></>,
    gauntlets: <><path d="M6 21 3 13V8a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v4-5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v7l-3 8H6Z" /><path d="M6 17h11M7 9v3m4-3v3m4-3v3" /></>,
};

export function Icon({ name, size = 20, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{paths[name]}</svg>;
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 1 18 19-18 19L2 20 18 3" stroke="currentColor" strokeWidth="1.5" /><path d="m25 7-4 15-8 10 5-16 7-9Z" fill="currentColor" /><path d="m10 18 17 8" stroke="currentColor" strokeWidth="2" /></svg>;
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 594 90" fill="currentColor" role="img" aria-label="IRONVEIL">
    <path d="M0 0h21v90H0zM36 0h49l20 16v27L91 56l21 34H88L68 58H57v32H36V0Zm21 19v21h20l7-6V25l-7-6H57Z" fillRule="evenodd" />
    <path d="M137 0h42l18 17v56l-18 17h-42l-18-17V17l18-17Zm9 20-6 6v38l6 6h23l7-6V26l-7-6h-23Z" fillRule="evenodd" />
    <path d="M214 90V0h21l37 54V0h21v90h-21l-37-54v54h-21ZM306 0h22l22 63 22-63h23l-34 90h-22L306 0ZM409 0h64v20h-43v15h37v19h-37v16h43v20h-64V0ZM490 0h21v90h-21zM529 0h21v69h44v21h-65V0Z" />
  </svg>;
}