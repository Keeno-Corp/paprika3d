// `interact`'s Motion at 100 Hz line. Every other tool steps the paused clock at 1/60 s a frame, where a game moved in
// whole 1/60 s steps gets exactly one step a frame and reads even. On a 100 Hz display 40% of its frames get no step and
// the movement stutters, though the frames are fast: a person saw it in a game `perf` called within budget (2026-11-01).
// So the first play after an edit that holds a key is played again on a page of its own, which the agent's page never
// sees, with its last frames stepped at 10 ms each. No real time and no GPU in it: the same game gives the same line.
import { rmSync } from "node:fs";
import type { Browser } from "puppeteer-core";
import { openGame, type Game } from "./browser.ts";
import { fingerprint } from "./fingerprint.ts";
import { act, motionStart, statePos, type Step } from "./input.ts";

const RUNUP = 12; // frames at 1/60 s to get up to speed, and how long a hold must be to count
const FRAMES = 30, MS = 10; // six of the five-frame cycles a 100 Hz display goes through
const STILL = 0.2; // the share of frames that says stutter; whole steps at 100 Hz read 0.4
const TRIES = 3; // plays that showed no movement (a menu, a wall) before these sources are left alone
const MAX_MS = 15_000;

const holds = (s: Step) => "key" in s && (s.down === true || (s.down === undefined && (s.frames ?? 1) >= RUNUP));

/** The share of frames a moving thing stood still on, from its poses a frame apart: null when it hardly moved, 0 when it
    stopped (a wall) rather than stuttered. */
export function stillShare(poses: number[][]): number | null {
  const d = poses.slice(1).map((b, i) => Math.hypot(b[0]! - poses[i]![0]!, b[1]! - poses[i]![1]!, b[2]! - poses[i]![2]!));
  const moved = d.filter(x => x > 1e-6).sort((x, y) => x - y);
  if (moved.length < 5) return null;
  const tiny = 0.25 * moved[moved.length >> 1]!, still = (x: number) => x < tiny;
  const span = d.slice(d.findIndex(x => !still(x)), d.findLastIndex(x => !still(x)) + 1);
  let run = 0, longest = 0;
  for (const x of span) longest = Math.max(longest, run = still(x) ? run + 1 : 0);
  return longest > 3 ? 0 : span.filter(still).length / span.length;
}

/** The line, "" when the play moved evenly, or null when nothing moved. shortcut: what `eval` changed on the agent's
    page is not replayed, so such a play may show no movement here; a log of its calls would cover that if it matters. */
async function measure(seat: { probe?: Game }, game: Game, steps: Step[], first: number, browser: Browser, cwd: string): Promise<string | null> {
  const keys = [...new Set(steps.slice(first).filter(holds).map(s => (s as { key: string }).key))];
  const probe = seat.probe = await openGame({ url: game.url, cwd, browser, viewport: game.page.viewport() ?? undefined, config: game.config });
  try {
    const earlier = game.played.slice(0, game.played.length - steps.length);
    const r = await act(probe, [...earlier, ...steps.slice(0, first), ...keys.map(key => ({ key, down: true })), { wait: RUNUP }]);
    const out = await probe.page.evaluate(`(async () => {
      const h = window.__harness, cams = [...new Set([...h.views.values()].map(v => v.camera))], cameras = cams.map(() => []); // every view's: a game drawn into a render target shows it on a quad under a camera that never moves
      ${motionStart(statePos(r.after))};
      let on = true;
      const tick = () => { if (!on) return; cams.forEach((cam, i) => { cam.updateWorldMatrix(true, false); const e = cam.matrixWorld.elements; cameras[i].push([e[12], e[13], e[14]]); }); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      h.skip = true;
      try { await __clock.step(${FRAMES}, ${MS}); } finally { h.skip = false; on = false; }
      return { subject: window.__harnessMotion?.end() ?? null, cameras };
    })()`) as { subject: { name: string; samples: number[][] } | null; cameras: number[][][] };
    const seen: [string | undefined, number | null][] = [[out.subject?.name, stillShare(out.subject?.samples ?? [])], ...out.cameras.map((c): [string, number | null] => ["the camera", stillShare(c)])];
    if (seen.every(([, share]) => share === null)) return null;
    const bad = seen.find(([, share]) => share !== null && share >= STILL);
    return !bad ? "" : `Motion at 100 Hz (${bad[0]}): it stands still on ${Math.round(bad[1]! * 100)}% of frames while ${keys.join(" + ")} is held, which a 100 or 120 Hz screen shows as stutter though every frame here looks even. A thing moved in whole 1/60 s steps is drawn between its last two (prev + (cur - prev) * acc / STEP, or game-state's between()); or move it by the frame's elapsed time.`;
  } finally {
    await probe.close().catch(() => {});
    rmSync(probe.runDir, { recursive: true, force: true });
  }
}

const tried = new WeakMap<Game, { print: string; tries: number }>();

/** After a play that held a key, once per state of the project's sources: the Motion at 100 Hz line, or undefined. Chrome only. */
export async function pacing(game: Game, steps: Step[] | undefined, chrome: () => Promise<Browser>, cwd: string): Promise<string | undefined> {
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
  } catch { return; } finally { clearTimeout(timer); } // a check of its own: it never fails the play it follows
}
