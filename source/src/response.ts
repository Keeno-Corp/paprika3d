import { rmSync } from "node:fs";
import type { Browser, KeyInput, MouseButton } from "puppeteer-core";
import { openGame, type Game } from "./browser.ts";
import { fingerprint } from "./fingerprint.ts";
import { act, motionStart, statePos, type Step } from "./input.ts";

const DIRECTIONS: Record<string, [KeyInput, KeyInput]> = {
  ArrowUp: ["ArrowDown", "ArrowRight"], ArrowDown: ["ArrowUp", "ArrowRight"],
  ArrowLeft: ["ArrowRight", "ArrowUp"], ArrowRight: ["ArrowLeft", "ArrowUp"],
  KeyW: ["KeyS", "KeyD"], KeyS: ["KeyW", "KeyD"], KeyA: ["KeyD", "KeyW"], KeyD: ["KeyA", "KeyW"],
  w: ["s", "d"], s: ["w", "d"], a: ["d", "w"], d: ["a", "w"],
  W: ["S", "D"], S: ["W", "D"], A: ["D", "W"], D: ["A", "W"],
};
const FRAMES = 32, TAIL = 8, TRIES = 3, MAX_MS = 15_000;
const SLOW = 8; // frames; a first guess
const holds = (s: Step) => "key" in s && typeof s.key === "string" && Object.hasOwn(DIRECTIONS, s.key) && (s.down === true || (s.down === undefined && (s.frames ?? 1) >= 12));

/** Frames to 90% and steady xz speed per frame, using the last eight frames' mean; null without steady travel. */
export function phaseResponse(poses: number[][]): { frames: number; speed: number } | null {
  const v = poses.slice(1).map((b, i) => [b[0]! - poses[i]![0]!, b[2]! - poses[i]![2]!]);
  if (v.length < TAIL) return null;
  const tail = v.slice(-TAIL), x = tail.reduce((s, a) => s + a[0]!, 0) / TAIL, z = tail.reduce((s, a) => s + a[1]!, 0) / TAIL;
  const speed = Math.hypot(x, z);
  if (!Number.isFinite(speed) || speed < 1e-6 || tail.some(a => Math.hypot(a[0]! - x, a[1]! - z) > 0.2 * speed)) return null;
  const at = v.findIndex(a => (a[0]! * x + a[1]! * z) / speed >= 0.9 * speed);
  return at < 0 ? null : { frames: at + 1, speed };
}

export const framesTo90 = (poses: number[][]): number | null => phaseResponse(poses)?.frames ?? null;

/** Contact can delay one change of direction; only a slow start or two slow changes warrant a warning. */
export function responseTimes(phases: number[][][]) {
  const [start, reverse, turn] = phases.map(phaseResponse);
  if (!start) return null;
  const comparable = (p: ReturnType<typeof phaseResponse> | undefined) => p && p.speed / start.speed >= 0.6 - 1e-6 && p.speed / start.speed <= 1.6 + 1e-6 ? p.frames : null;
  const back = comparable(reverse), cut = comparable(turn);
  return { start: start.frames, reverse: back, turn: cut, slow: start.frames > SLOW || (back !== null && cut !== null && back > SLOW && cut > SLOW) };
}

async function measure(seat: { probe?: Game }, game: Game, steps: Step[], first: number, browser: Browser, cwd: string): Promise<string | null> {
  const key = (steps[first] as { key: string }).key;
  const keys = [key as KeyInput, ...DIRECTIONS[key]!];
  const probe = seat.probe = await openGame({ url: game.url, cwd, browser, viewport: game.page.viewport() ?? undefined, config: game.config });
  try {
    const earlier = game.played.slice(0, game.played.length - steps.length);
    await act(probe, [...earlier, ...steps.slice(0, first)]);
    for (const k of [...probe.held]) {
      if (k.startsWith("mouse:")) await probe.page.mouse.up({ button: k.slice(6) as MouseButton });
      else await probe.page.keyboard.up(k as KeyInput);
      probe.held.delete(k);
    }
    await act(probe, [{ wait: 30 }]);
    const phases: { name: string; samples: number[][] }[] = [];
    for (const k of keys) {
      const state = await probe.page.evaluate("window.__game?.observe?.() ?? null");
      await probe.page.keyboard.down(k);
      const out = await probe.page.evaluate(`(async () => {
        ${motionStart(statePos(state), true)};
        window.__harness.skip = true;
        try { await __clock.step(${FRAMES}, 1000 / 60); }
        finally { window.__harness.skip = false; }
        return window.__harnessMotion?.end() ?? null;
      })()`) as { name: string; samples: number[][] } | null;
      await probe.page.keyboard.up(k);
      if (!out) return null;
      phases.push(out);
    }
    const times = responseTimes(phases.map(p => p.samples));
    if (!times) return null;
    if (!times.slow) return "";
    const { start, reverse, turn } = times;
    return `Response (${phases[0]!.name}): full speed in ${start} frames from standing${reverse == null ? "" : `, reverses in ${reverse}`}${turn == null ? "" : `, makes a 90° cut in ${turn}`} while ${keys.join(", then ")} is held (60 fps frames to 90% of held speed the new way). Arcade/action controls answer in about 3–6 frames; past 8 reads as sluggish unless the request wants weight (a car, ice, a heavy ship): ease velocity much faster, or set it from input and ease only looks (facing, animation blends).`;
  } finally {
    await probe.close().catch(() => {});
    rmSync(probe.runDir, { recursive: true, force: true });
  }
}

const tried = new WeakMap<Game, { print: string; tries: number }>();

/** A held direction, replayed on a probe once per source fingerprint. Never fails the play. */
export async function response(game: Game, steps: Step[] | undefined, chrome: () => Promise<Browser>, cwd: string): Promise<string | undefined> {
  if (game.engine.name !== "chromium" || !Array.isArray(steps)) return;
  const first = steps.findIndex(holds);
  if (first < 0) return;
  const print = fingerprint(cwd), was = tried.get(game), tries = was?.print === print ? was.tries : 0;
  if (tries >= TRIES) return;
  tried.set(game, { print, tries: tries + 1 });
  const seat: { probe?: Game } = {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const browser = await chrome();
    const line = await Promise.race([measure(seat, game, steps, first, browser, cwd),
      new Promise<null>(done => { timer = setTimeout(() => { seat.probe?.close().catch(() => {}); done(null); }, MAX_MS); })]);
    if (line === null) return;
    tried.set(game, { print, tries: TRIES });
    return line || undefined;
  } catch { return; } finally { clearTimeout(timer); }
}
