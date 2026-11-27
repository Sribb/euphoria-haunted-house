// Reused from Euphoria (euphoriaweb src/lib/pixel/PixelSprite.tsx), copied unchanged on 2026-11-27.
// See "Reused from Euphoria" in the README.
import { useEffect, useMemo, useRef, useState } from "react";
import { compileSprite, compileFrames } from "./compile";
import type { PixelSprite } from "./types";

export type PixelPlayMode = "none" | "once" | "loop";

export interface PixelSpriteProps {
  sprite: PixelSprite;
  /** Rendered width in CSS pixels. Ignored when `scale` is given. */
  size?: number;
  /** Integer pixel multiplier. Truer to pixel art than an arbitrary size: 4 = each art pixel is 4x4. */
  scale?: number;
  className?: string;
  /** Accessible name. Defaults to the sprite's name; pass `decorative` for art that adds nothing. */
  label?: string;
  decorative?: boolean;
  /**
   * Animation, off by default. The house rule is no idle loops, so a sprite only
   * moves when something asks it to: "once" for a reaction (a coin awarded, a
   * streak extended), "loop" only where continuous motion is genuinely the point.
   */
  play?: PixelPlayMode;
  /** Changing this replays a "once" animation, e.g. keyed on a coin balance. */
  playKey?: string | number;
  /**
   * Milliseconds per frame, overriding the sprite's authored `frameMs`. Lets one
   * sprite play at different speeds in different places (a flame that flickers
   * in a badge row but turns slowly as a lesson's hero) without forking the art.
   */
  frameMs?: number;
  onAnimationEnd?: () => void;
}

/** True when the user has asked the OS for less motion. Server-safe. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Renders a sprite as SVG rectangles.
 *
 * SVG rather than <canvas> for two concrete reasons: this app server-renders
 * (`vite build --ssr src/entry-server.tsx`, plus the prerender-home and
 * prerender-digest passes), and canvas produces nothing during SSR; and SVG
 * stays sharp at any size or DPR without a separate 2x/3x asset. It also matches
 * how the rest of the app's art already works in shopArt.tsx.
 */
export function PixelSpriteView({
  sprite,
  size,
  scale,
  className,
  label,
  decorative,
  play = "none",
  playKey,
  frameMs: frameMsProp,
  onAnimationEnd,
}: PixelSpriteProps) {
  const still = useMemo(() => compileSprite(sprite), [sprite]);
  const frames = useMemo(
    () => (play === "none" ? null : compileFrames(sprite)),
    [sprite, play],
  );
  const reducedMotion = usePrefersReducedMotion();
  // -1 means "no frame chosen yet". It matters on the server: `animating` is
  // already true there (reduced-motion cannot be known), so without this sentinel
  // an animated sprite would server-render frames[0], and for a sprite whose
  // first frame is a stub (chart-up starts as two-pixel bars) the prerendered
  // HTML and every no-JS reader would get a half-drawn chart.
  const [frame, setFrame] = useState(-1);
  // Distinct from frame 0: a finished "once" run rests on `rows`, which is not
  // necessarily frames[0]. chart-up's first frame is a stub of the chart, so
  // resting on it would leave the sprite permanently half-drawn.
  const [finished, setFinished] = useState(false);

  const animating = play !== "none" && !reducedMotion && (frames?.length ?? 0) > 1;

  // Held in a ref so a parent passing an inline arrow does not re-run the effect
  // (and restart the animation) on every one of its renders.
  const onEndRef = useRef(onAnimationEnd);
  useEffect(() => { onEndRef.current = onAnimationEnd; }, [onAnimationEnd]);

  useEffect(() => {
    if (!animating || !frames) return;
    setFrame(0);
    setFinished(false);

    // requestAnimationFrame rather than setInterval: the accumulator keeps frame
    // timing from drifting, and browsers throttle rAF in background tabs, so a
    // sprite nobody is looking at costs nothing.
    const frameMs = frameMsProp ?? sprite.frameMs ?? 120;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let index = 0;
    let shown = 0;

    const tick = (now: number) => {
      // Clamped so returning to a long-backgrounded tab replays one frame rather
      // than burning through hundreds of catch-up steps.
      acc += Math.min(now - last, 250);
      last = now;

      while (acc >= frameMs) {
        acc -= frameMs;
        index += 1;
        if (index >= frames.length) {
          if (play === "once") {
            // Rest on the still so the resting state is always the canonical
            // art, never whatever frame the sequence ended on.
            setFinished(true);
            onEndRef.current?.();
            return;
          }
          index = 0;
        }
      }

      if (index !== shown) { shown = index; setFrame(index); }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // playKey is intentionally a dependency: changing it restarts the animation.
  }, [animating, frames, play, frameMsProp, sprite.frameMs, playKey]);

  // The still on the server, before the first tick, and once a "once" run ends,
  // so the sprite is never left mid-sequence and never ships incomplete markup.
  const showFrame = animating && frames && !finished && frame >= 0;
  const compiled = showFrame ? frames[Math.min(frame, frames.length - 1)] : still;
  const { width, height, rects } = compiled;

  const renderedWidth = scale ? width * scale : size ?? width * 4;
  const renderedHeight = (renderedWidth * height) / width;

  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": label ?? sprite.name } as const);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={renderedWidth}
      height={renderedHeight}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block" }}
      {...a11y}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  );
}
