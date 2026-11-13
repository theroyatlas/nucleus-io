/**
 * System motion preference. This is independent of the saved quality tier:
 * callers combine the current preference with the user's current settings.
 */
export let reducedMotion = false;

export function observeReducedMotion(onChange, win = typeof window !== 'undefined' ? window : null) {
    const media = win?.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => {
        reducedMotion = Boolean(media?.matches);
        onChange(reducedMotion);
    };
    update();
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
}

export function motionPassFlags(flags) {
    return {
        ...flags,
        grain: flags.grain && !reducedMotion,
        filmGrain: flags.filmGrain && !reducedMotion,
        warp: flags.warp && !reducedMotion,
    };
}
