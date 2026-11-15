// check(): run a game contract against the open game, one keypoint at a time, each on a freshly reloaded page.
// A reload costs about 0.1 s and gives every keypoint the same seed and a clean start, so a keypoint that kills the
// player or moves the level can never leak into the next one. Each keypoint: reload, setState (confirmed in observe()
// before any frame runs), its actions, its frames, then its predicates over __game.observe(). A picture is saved only
// for a failing keypoint, and a passing one removes its earlier failure's. The result carries the source fingerprint, so a caller can tell when it went stale. With
// `tests` (the agent's saved checks, game-tests.json) the text is one ✓ or ✗ line per check, with the value seen and
// the value expected.
import { rmSync } from "node:fs";
import { join } from "node:path";
import type { Game } from "./browser.ts";
import { drawnOn, holds, pageOf, pathValue, show, verdicts, type Contract, type Keypoint, type Predicate } from "./contract.ts";
import { gameUp, play, GAME_LATE, type Step } from "./input.ts";
import { fingerprint } from "./fingerprint.ts";
import { BUDGETS, SOFTWARE_NOTE } from "./budgets.ts";

/** Why a keypoint failed, or `passed`. */
export type Outcome = "passed" | "launch_failed" | "state_not_realized" | "actions_incomplete" | "outcome_mismatch";

/** One keypoint's outcome; `picture` is the saved page, only when it failed. */
export interface KeypointResult { id: string; title: string; outcome: Outcome; detail: string; picture?: string }

/** `text` is the runner-style report: one `✗` line per failed keypoint and a summary line. */
export interface CheckResult { passed: number; failed: number; outcomes: KeypointResult[]; durationMs: number; fingerprint: string; text: string }

/** Where a check that gave way stopped: the keypoints run so far, their frames and time, for the turn that goes on. */
export interface Paused { print: string; outcomes: KeypointResult[]; stepped: { ms: number; frames: number }; wait: { on: boolean }; ms: number; /** stopped by an edit, not for a call */ edited?: boolean }

const DEFAULT_FRAMES = 60;
const NO_GAME = `no window.__game.setState and observe ${GAME_LATE}`;
/** A check saved with no leading { state } step never needed __game before its first frame: `interact`'s save played its
    wait or until steps first, and a game that awaited renderer.compileAsync came up on them. Its replay plays them too,
    and fails here only when __game is still missing after the actions and frames (Neon Pursuit, dev #367). */
const NO_GAME_PLAYED = "no window.__game.observe after the check's actions and frames";
const STATE_TRIES = 3; // once, then retry twice
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const firstLine = (e: unknown) => (e as Error).message.split("\n")[0]!;
/** A launch failure's reason with what the page itself said under it (its first errors), so a page that throws as it
    loads (an import map after the modulepreload links that need it, dev #403) does not read as a load that only timed out. */
const launchLine = (e: unknown) => {
  const [head = "", ...rest] = (e as Error).message.split("\n"), said = rest.map(l => l.trim()).filter(Boolean).slice(0, 2);
  return said.length ? `${head}; the page said: ${said.join(" | ").slice(0, 400)}` : head;
};

/** Whether every part of `want` is in `got`: object keys recursively, arrays item by item, numbers within 1e-6. */
function realized(want: unknown, got: unknown): boolean {
  if (typeof want === "number" && typeof got === "number") return Math.abs(want - got) < 1e-6;
  if (Array.isArray(want)) return Array.isArray(got) && got.length === want.length && want.every((w, i) => realized(w, got[i]));
  if (want && typeof want === "object") return !!got && typeof got === "object" && Object.entries(want).every(([k, w]) => realized(w, (got as any)[k]));
  return want === got;
}

/** null when the predicate holds, else `expected head.x == 3, got 4`. */
function failure(p: Predicate, state: unknown): string | null {
  const got = pathValue(state, p.path);
  return holds(p, got) ? null : `expected ${p.path} ${p.op === "exists" ? "to exist" : `${p.op} ${show(p.value)}`}, got ${show(got)}`;
}

/** Sets `state` with setState and reads observe() back, as a saved check's replay does: "" when observe() reports every
    key as set, else why not. `interact`'s save runs it too, so a check is never saved that only fails on replay. */
export async function realize(game: Game, state: Record<string, unknown>): Promise<string> {
  const { page } = game;
  let missing = "";
  for (let i = 0; i < STATE_TRIES; i++) {
    if (i) await sleep(50); // lets a game that applies setState asynchronously (React) catch up, without stepping a frame
    let got: Record<string, unknown> | "no game" | null;
    try {
      got = await page.evaluate(s => {
        const g = (window as any).__game;
        if (!g?.setState || !g?.observe) return "no game";
        g.setState(s);
        return g.observe();
      }, state as any) as Record<string, unknown> | "no game" | null;
    } catch (e) { return `setState or observe() threw: ${firstLine(e)}`; }
    // the page's own error says why there is no game; the fixed text sent agents hunting for a missing hook (build-review-1, #78)
    if (got === "no game") return game.errors.length ? `the page threw before window.__game existed: ${game.errors.at(-1)!.split("\n")[0]}` : NO_GAME;
    if (!got) return "observe() returned nothing after setState";
    missing = Object.keys(state).filter(key => !realized(state[key], got[key]))
      .map(key => `${key} set to ${show(state[key])}, observe() has ${show(got[key])}`).join("; ");
    if (!missing) break;
  }
  return missing;
}

/** Runs one keypoint on the already reloaded page. */
// `wait`: false once a keypoint of this check waited in vain, so a page with no __game costs the wait once, not per keypoint
async function runKeypoint(game: Game, k: Keypoint, stepped: { ms: number; frames: number }, tests: boolean, wait: { on: boolean }): Promise<{ outcome: Outcome; detail: string }> {
  const { page } = game;
  if (wait.on) wait.on = await gameUp(game, ["setState", "observe"]);
  const unreal = await realize(game, k.state);
  if (unreal && (unreal !== NO_GAME || Object.keys(k.state).length)) return { outcome: "state_not_realized", detail: unreal };

  try { await play(game, k.actions as Step[]); }
  catch (e) { return { outcome: "actions_incomplete", detail: (e as Error).message }; }
  const frames = k.frames ?? DEFAULT_FRAMES;
  // the frames, a GPU sync and the observe() after them in one round trip; a throw from observe comes back as { threw }.
  // Without the sync the frame line counts only the CPU side: an AA-3D black hole read 3 to 4 ms a frame against 50 to 130 ms real.
  // ten frames per evaluate, as play() steps: 60 drawn frames in one evaluate on a heavy WebGPU page under SwiftShader
  // ran past puppeteer's 180 s protocol timeout and failed every saved check (#48, dev #366)
  const last = frames > 10 ? (frames - 1) % 10 + 1 : frames;
  const t = performance.now();
  let after: { state?: unknown; threw?: string; none?: boolean };
  try {
    for (let left = frames - last; left > 0; left -= 10) await page.evaluate("__clock.step(10)");
    after = await page.evaluate(`(async () => { ${last ? `await __clock.step(${last}); await __harness.sync();` : ""}
      if (!window.__game?.observe) return { none: true };
      try { return { state: __game.observe() }; } catch (e) { return { threw: String(e?.message ?? e) }; } })()`) as typeof after;
  } catch (e) { return { outcome: "outcome_mismatch", detail: `stepping or observe() failed: ${firstLine(e)}` }; }
  if (frames) { stepped.ms += performance.now() - t; stepped.frames += frames; }
  if (after.none) return { outcome: "state_not_realized", detail: NO_GAME_PLAYED };
  if (after.threw !== undefined) return { outcome: "outcome_mismatch", detail: `observe() threw: ${after.threw.split("\n")[0]}` };
  const state = after.state;
  const wrong = tests ? verdicts(k.expect, state).filter(v => !v.ok).map(v => `${v.path} ${show(v.got)}, expected ${v.want}`) : k.expect.map(p => failure(p, state)).filter(Boolean);
  return wrong.length ? { outcome: "outcome_mismatch", detail: wrong.join("; ") } : { outcome: "passed", detail: "" };
}


/** "Frames: N stepped at X ms each (budget B ms)", naming `perf` with optimize when X is over B on a real GPU; "" when nothing stepped. */
function frameLine({ ms, frames }: { ms: number; frames: number }, budget: number, software: boolean): string {
  if (!frames) return "";
  const each = ms / frames;
  return `\nFrames: ${frames} stepped at ${each.toFixed(2)} ms each (budget ${budget} ms)${each <= budget ? "" : software ? `; ${SOFTWARE_NOTE}` : "; over budget (`perf` with optimize: true tries the runtime switches)"}`;
}

const BACKEND = { webgpu: "WebGPU", webgl2: "WebGL 2" };
/** What a failing saved check says when the page now draws on another backend than it was saved on: headless Linux with
    no GPU moved WebGPURenderer pages from WebGL 2 to WebGPU after 0.4.2, and `backend "webgpu", expected "webgl2"` read
    as the game's change (public #337). A check saved before the backend was recorded gets the note only there. */
function backendNote(k: Keypoint, game: Game): string {
  const now = drawnOn(game.info);
  if (!now) return "";
  if (k.drawn) return k.drawn === now ? "" : ` (saved while the page drew on ${BACKEND[k.drawn]}; it now draws on ${BACKEND[now]}, which the harness or the machine chose, not the game: if only the backend differs, save the check again)`;
  return now === "webgpu" && game.software && process.platform === "linux" ? " (the page draws on WebGPU here; paprika3d 0.4.2 and earlier drew a WebGPURenderer page on WebGL 2 on a Linux machine with no GPU, so a check saved then that reads the backend fails by the harness's change, not the game's: save it again)" : "";
}

/** One line when saved checks failed under a query they were not saved with: a check saved with no query runs on its
    path whatever the open URL's query, and one saved on index.html failed on ?stages=0, a debug query a later look had
    opened that never loads the system the check read, with nothing naming the URL (dev #438). */
function queryLine(failing: Keypoint[], page: string): string[] {
  const at = [...new Set(failing.map(k => k.page).filter((p): p is string => !!p && p !== page && !p.includes("?") && page.startsWith(`${p}?`)))];
  if (!at.length) return [];
  const n = failing.filter(k => at.includes(k.page!)).length;
  return [`${n === 1 ? "1 failing check was" : `${n} failing checks were`} saved on ${at.join(", ")} and ran here on ${page}, the open page: if that query changes what the page loads, open ${at.join(", ")} and run test again.`];
}

/** Runs every keypoint of the contract on its own reloaded page, on the game's queue. `cwd` is the project fingerprinted;
    `print` is its fingerprint when the caller just took it; `tests`: the contract is the agent's saved checks. */
/** Runs the keypoints. With `yieldTo`, before each keypoint the check stops when yieldTo() says another call waits or
    when the sources changed since it began, and returns `paused`; `resume` (a paused check's, on the same sources) goes on from the keypoint it stopped at. */
export function check(game: Game, contract: Contract, { cwd = game.root, print = "", tests = false, yieldTo, resume, restart = true }:
  { cwd?: string; print?: string; tests?: boolean; yieldTo?: () => boolean; resume?: Paused; /** false: an edit does not stop it */ restart?: boolean } = {}): Promise<CheckResult & { paused?: Paused }> {
  return game.queue(async () => {
    const start = Date.now();
    print ||= fingerprint(cwd); // the sources this result describes
    if (resume?.print !== print) resume = undefined; // an edit since the pause: every keypoint runs on the new sources
    const outcomes: KeypointResult[] = [...resume?.outcomes ?? []];
    let launch = "";
    // the frames the keypoints step anyway: frame time with no extra measuring
    const stepped = resume?.stepped ?? { ms: 0, frames: 0 }, wait = resume?.wait ?? { on: true };
    for (const k of contract.keypoints.slice(outcomes.length)) {
      const base = { id: k.id, title: k.title };
      // an edit since it began (the next file of a multi-file change): the keypoints left would run on a page the result
      // does not describe, and the result is thrown away as stale, so it stops and the caller starts it over (dev #439)
      const edited = !!yieldTo && restart && !launch && fingerprint(cwd) !== print;
      if (!launch && (edited || yieldTo?.())) {
        const paused = { print, outcomes, stepped, wait, ms: (resume?.ms ?? 0) + Date.now() - start, edited };
        return { passed: 0, failed: 0, outcomes, durationMs: paused.ms, fingerprint: print, text: "", paused };
      }
      if (!launch) {
        try { await game.reload(); }
        catch (e) { launch = launchLine(e); }
      }
      // a page that will not load fails every keypoint left the same way, instead of waiting 10 s for each
      if (launch) { outcomes.push({ ...base, outcome: "launch_failed", detail: launch }); continue; }
      const r = await runKeypoint(game, k, stepped, tests, wait);
      const picture = join(game.runDir, `kp-${k.id}.png`);
      // an earlier failure's picture beside a pass read as a passing check's picture (dev #360)
      if (r.outcome === "passed") { rmSync(picture, { force: true }); outcomes.push({ ...base, ...r }); continue; }
      const saved = await game.page.screenshot({ path: picture }).then(() => true, () => false);
      outcomes.push({ ...base, ...r, detail: r.detail + backendNote(k, game), ...(saved ? { picture } : {}) });
    }
    const passed = outcomes.filter(o => o.outcome === "passed").length, failed = outcomes.length - passed;
    const durationMs = (resume?.ms ?? 0) + Date.now() - start;
    // a failure shows its keypoint's setup, so the agent need not open the contract or the run folder to see it
    const setup = (k: Keypoint) => { const s = `state ${JSON.stringify(k.state)}; actions ${JSON.stringify(k.actions)}; frames ${k.frames ?? 60}`; return s.length > 700 ? `${s.slice(0, 700)}…` : s; };
    // a failure that is the page's, not the keypoint's (it would not load, or has no __game), reads the same for every
    // keypoint: one line for all of them, without setups, instead of the same reason and up to 700 characters per keypoint
    const pageWide = (o: KeypointResult) => o.outcome === "launch_failed" || o.detail === NO_GAME || o.detail === NO_GAME_PLAYED;
    const lines: string[] = [], grouped = new Set<string>();
    outcomes.forEach((o, i) => {
      if (o.outcome === "passed") return; // the ✗ lines and the "N of M passed" count say which passed
      const same = pageWide(o) ? outcomes.filter(x => x.outcome === o.outcome && x.detail === o.detail) : [o];
      if (same.length > 1) {
        const key = `${o.outcome}\0${o.detail}`;
        if (!grouped.has(key)) { grouped.add(key); lines.push(`✗ ${same.length} keypoints — ${o.outcome}: ${o.detail} (${same.map(x => x.title).join("; ")})`); }
        return;
      }
      lines.push(`✗ ${o.title} — ${o.outcome === "outcome_mismatch" ? "" : `${o.outcome}: `}${o.detail}\n    ${setup(contract.keypoints[i]!)}`);
    });
    const why = (o: KeypointResult) => `${o.outcome === "outcome_mismatch" ? "" : `${o.outcome}: `}${o.detail}`;
    const text = [
      ...tests ? outcomes.map(o => o.outcome === "passed" ? `✓ ${o.id}` : `✗ ${o.id}: ${why(o)}`) : lines,
      `${passed} of ${outcomes.length} ${tests ? "saved checks" : "keypoints"} passed in ${(durationMs / 1000).toFixed(1)} s`,
      ...tests ? queryLine(contract.keypoints.filter((_, i) => outcomes[i] && outcomes[i]!.outcome !== "passed"), pageOf(game.url)) : [],
    ].join("\n") + frameLine(stepped, Number(contract.budget?.frameMs ?? BUDGETS.desktop.frameMs), game.software);
    return { passed, failed, outcomes, durationMs, fingerprint: print, text };
  });
}
