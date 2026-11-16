// Dev build only (docs/decisions-2026-10-18.md): which tools ran, with which options, on what kind of page, how long they
// took and whether they failed, one JSON line per call in $PAPRIKA3D_HOME/telemetry/<run>.jsonl, which hooks/telemetry.ts
// uploads at each stop. Both builds (docs/decisions-2026-10-25.md): `send_feedback`, the agent's bug, feedback or criticism,
// with the last call's names kept in memory only. Stable build only (docs/decisions-2026-10-28.md): one ping per install
// and version, to count public installs (`installed()`), and one per UTC day on which a tool ran, to tell used installs from
// unused ones (`usedToday()`, 2026-11-12). Names, counts and the schema's own enum values only: never an argument's
// value, code, a path, page text or a picture. On only when the build names its channel, so a source checkout, the bench
// arms and the tests send nothing; DO_NOT_TRACK=1 or PAPRIKA3D_TELEMETRY=0 turns both off. Nothing here throws: telemetry
// never reaches a reply.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { platform } from "node:os";
import { join, resolve } from "node:path";
import { harnessHome } from "./state.ts";

const off = /^(1|true)$/i.test(process.env.DO_NOT_TRACK ?? "") || process.env.PAPRIKA3D_TELEMETRY === "0";
export const ON = process.env.PAPRIKA3D_CHANNEL === "dev" && !off;
/** `send_feedback` and the failed-reply ask: both builds. */
export const PUBLISHED = process.env.PAPRIKA3D_CHANNEL === "dev" || process.env.PAPRIKA3D_CHANNEL === "stable";
export const FEEDBACK = PUBLISHED && !off;
/** Where a report goes when send_feedback sends nothing (dev #294). */
export const ISSUES = "https://github.com/Keeno-Corp/paprika3d/issues/new";
/** The fallback a refused report names: an `agent-report:` issue, so it never goes to the client's own feedback (dev #363). */
export const ISSUE_CMD = `gh issue create -R Keeno-Corp/paprika3d -t "agent-report: <summary>" -b "<the report>"`;
const URL = process.env.PAPRIKA3D_TELEMETRY_URL ?? "", KEY = process.env.PAPRIKA3D_TELEMETRY_KEY ?? "";
export const telemetryDir = () => join(harnessHome(), "telemetry");
const run = randomUUID().slice(0, 8); // this server process
// src/input.ts's step kinds, copied since importing input.ts would bundle look.ts into the hooks; test/telemetry.test.ts checks they match
export const KINDS = ["key", "mouse", "wheel", "resize", "scroll", "touch", "wait", "clock", "state", "until", "action"];

let id = "";
function install(): string {
  if (id) return id;
  const f = join(telemetryDir(), "id");
  try { id = readFileSync(f, "utf8").trim(); } catch {}
  if (!id) { id = randomUUID(); mkdirSync(telemetryDir(), { recursive: true }); writeFileSync(f, id); }
  return id;
}
const base = () => ({ v: 1, at: new Date().toISOString(), install: install(), run, version: process.env.PAPRIKA3D_VERSION ?? "0.0.0-src", os: platform(), node: process.versions.node.split(".")[0] });

/** A failed reply's first line with paths and URLs taken out. */
export const scrub = (s: string) => (s.split("\n")[0] ?? "").replace(/[a-z]+:\/\/\S+/gi, "<url>").replace(/(?:[A-Za-z]:\\|~?\/)[^\s:'"`,)]+/g, "<path>").slice(0, 160);

type Schema = { properties?: Record<string, { enum?: unknown[] }> };
type Reply = { content: { type: string; text?: string }[]; isError?: boolean } | null;
let extra: Record<string, unknown> = {}, last: Record<string, unknown> | null = null;

/** Facts `open` learned about the page, sent with its event. */
export function noteOpen(facts: Record<string, unknown>) { extra = facts; }

/** One line for one tool call: the argument names the agent passed (an argument's value only when it is one of its schema's enum values). */
export function event(tool: string, args: Record<string, any>, r: Reply, ms: number, schema?: Schema) {
  if (!FEEDBACK) return;
  try {
    const t = r?.content.find(c => c.type === "text")?.text ?? "";
    const flags: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args ?? {})) if (k !== "cwd" && k !== "game") flags[k] = schema?.properties?.[k]?.enum?.includes(v) ? v : true;
    const ok = !!r && !r.isError, error = !ok ? (r ? scrub(t) : "threw") : undefined;
    last = { tool, flags, ok, ...(error && { error }) };
    if (!ON) { void usedToday(); return; } // the stable build keeps only `last`, for a report, and pings once a day
    const steps: Record<string, number> = {};
    for (const s of Array.isArray(args?.steps) ? args.steps : []) for (const k of Object.keys(s ?? {})) if (KINDS.includes(k)) steps[k] = (steps[k] ?? 0) + 1;
    const faults = (t.match(/^(Lighting|Surfaces|Surface|Skinned scale): (?!not checked)/gm) ?? []).length, pageErrors = Number(/Page errors since the last call \((\d+)\)/.exec(t)?.[1] ?? 0);
    const e = { ...base(), project: createHash("sha256").update(install() + resolve(String(args?.cwd ?? "."))).digest("hex").slice(0, 12), tool, ms, ok,
      ...(error && { error }), bytes: t.length, flags, ...(Object.keys(steps).length && { steps }),
      ...(faults && { faults }), ...(pageErrors && { pageErrors }), ...(/answered nothing for|without finishing|did not answer/.test(t) && { hung: true }), ...extra };
    extra = {};
    mkdirSync(telemetryDir(), { recursive: true });
    appendFileSync(join(telemetryDir(), `${run}.jsonl`), `${JSON.stringify(e)}\n`);
  } catch {}
}

/** POSTs to the team's Worker within 3 s; false when it is unset, down or slow. */
/** The Worker's status for a POST, or 0 when it did not answer. Never follows a redirect: fetch would resend the
    x-paprika3d-key header to wherever the Location points (a 3xx counts as not sent). */
const postStatus = (path: string, body: string): Promise<number> => !URL ? Promise.resolve(0)
  : fetch(URL + path, { method: "POST", headers: { "content-type": "application/json", "x-paprika3d-key": KEY }, body, redirect: "manual", signal: AbortSignal.timeout(3_000) }).then(r => r.status, () => 0);
export const post = (path: string, body: string) => postStatus(path, body).then(s => s >= 200 && s < 300);
const host = () => { try { return new globalThis.URL(URL).host; } catch { return "none set"; } };

const MAX_REPORTS = 20; // the Worker's REPORTS_A_DAY for one client, so a session is not the tighter limit (dev #282)
export const REPORT_TOOL = { name: "send_feedback", annotations: { readOnlyHint: false, openWorldHint: true }, description: `Sends the paprika3d team a bug, feedback or criticism about the harness itself (not about the user's page): a reply that was wrong or unclear, a tool that hung, errored or got in your way, a check you disagree with, or something you needed and no tool gave. It attaches the last tool call's name, options and error, never the page's code or files. Use it, not the client's own feedback command (Claude Code's \`/feedback\` goes to Anthropic). At most ${MAX_REPORTS} a session, so put related snags in one report; a refused one says how to file it as an issue. One line back; carry on with the task after it.`,
  inputSchema: { type: "object", properties: { kind: { type: "string", enum: ["bug", "feedback", "criticism"] }, text: { type: "string", description: "What happened and what you expected, in a few sentences (2,000 characters at most)." } }, required: ["kind", "text"] } };

/** `send_feedback`'s handler; a wrong kind or no text throws, as the other tools' bad arguments do. */
export function reportTool(a: Record<string, any>, runDir?: string): Promise<string> {
  if (!REPORT_TOOL.inputSchema.properties.kind.enum.includes(a.kind) || typeof a.text !== "string" || !a.text.trim()) throw new Error('kind: "bug", "feedback" or "criticism", and text saying what happened');
  // listed with telemetry off too, so a report the docs promise is refused in words, never lost (dev #289)
  if (PUBLISHED && off) return Promise.resolve(`Not sent: ${process.env.PAPRIKA3D_TELEMETRY === "0" ? "PAPRIKA3D_TELEMETRY=0" : "DO_NOT_TRACK=1"} turns send_feedback off, so nothing leaves this machine. To send it, file it with \`${ISSUE_CMD}\` (or at ${ISSUES}). Carry on with the task.`);
  return report(a.kind, a.text, runDir);
}

let reports = 0; // sent ones: a report the Worker never got does not count toward the cap (dev #294)
/** `send_feedback`: sends the agent's report with the last call's event, keeps a copy beside the run, and returns the one-line reply. */
export async function report(kind: string, text: string, runDir?: string): Promise<string> {
  const body = JSON.stringify({ id: randomUUID(), ...base(), kind, text: text.slice(0, 2_000), last }); // id: a resend is stored once
  const copy = join(runDir ?? telemetryDir(), `report-${Date.now()}.json`);
  try { mkdirSync(runDir ?? telemetryDir(), { recursive: true }); writeFileSync(copy, body); } catch {}
  const file = `A copy is in ${copy}. File it with \`${ISSUE_CMD}\` (or at ${ISSUES}) instead, not with the client's own feedback command. Carry on with the task.`;
  if (reports >= MAX_REPORTS) return `Not sent: at most ${MAX_REPORTS} reports a session. ${file}`;
  let answer = await postStatus("/report", body); // only a stored report counts toward the cap (dev #294)
  // tried once more on no answer or a 5xx: one of a burst of reports was lost to a single slow answer (dev #286)
  if (!answer || answer >= 500) answer = await new Promise(r => setTimeout(r, 500)).then(() => postStatus("/report", body));
  if (answer >= 200 && answer < 300) { reports++; return "Sent to the paprika3d team. Carry on with the task."; }
  // The Worker limits each install and, at a larger allowance, its shared network (dev #294).
  if (answer === 429) return `Not sent: the team's server's daily feedback limit was reached. ${file}`;
  if (answer) return `Not sent: the team's server refused it (HTTP ${answer}). ${file}`;
  if (!ON) return `Not sent: the team's server (${host()}) did not answer. ${file}`; // no upload hook in the stable build
  try { writeFileSync(join(telemetryDir(), `${randomUUID()}.report.json`), body); } catch {} // the upload hook sends it at the next stop
  return `Saved in ${copy}; it is sent when the session stops. Carry on with the task.`;
}

/** The stable build's ping, once per install and version, at the client's first `initialize`: the install id, version, os, node and the MCP client's name. Sent again next start only when the Worker does not answer or fails: its 429 is an answer, and a retry at every start is no longer once per install (#202). */
export async function installed(client: string) {
  if (process.env.PAPRIKA3D_CHANNEL !== "stable" || !FEEDBACK) return; // folds at build time: the dev bundle holds no ping
  mcpClient = client.slice(0, 64);
  try {
    const f = join(telemetryDir(), "pinged"), body = JSON.stringify({ ...base(), client: client.slice(0, 64) }); // base() makes the folder
    const version = process.env.PAPRIKA3D_VERSION ?? "0.0.0-src";
    if (existsSync(f) && readFileSync(f, "utf8") === version) return;
    const answer = await postStatus("/install", body);
    if (answer && answer < 500) writeFileSync(f, version);
  } catch {}
}

let mcpClient = "", today = "";
/** The stable build's day ping, at the first tool call of each UTC day: the install id, version, the day and the MCP client's
 * name, so installs that are used can be told from installs that are not. After the reply (event() runs once it is built),
 * once per process and day in memory, once per install and day on disk; a failed send is tried again at the next call. */
async function usedToday() {
  if (process.env.PAPRIKA3D_CHANNEL !== "stable" || !FEEDBACK) return; // folds at build time
  const day = new Date().toISOString().slice(0, 10);
  if (today === day) return;
  today = day;
  try {
    const f = join(telemetryDir(), "active"), body = JSON.stringify({ ...base(), day, client: mcpClient }); // base() makes the folder
    if (existsSync(f) && readFileSync(f, "utf8") === day) return;
    const answer = await postStatus("/active", body);
    if (answer && answer < 500) writeFileSync(f, day); else today = "";
  } catch { today = ""; }
}

/** The disclosure, once per install, for `open`'s reply. */
export function told(): string {
  if (process.env.PAPRIKA3D_CHANNEL !== "dev" || !ON) return ""; // the channel test folds at build time, so the stable bundle holds no dev disclosure
  try {
    const f = join(telemetryDir(), "told");
    if (existsSync(f)) return "";
    mkdirSync(telemetryDir(), { recursive: true });
    writeFileSync(f, new Date().toISOString());
  } catch { return ""; }
  return "\npaprika3d dev build: it sends the team which tools ran, with which options, how long they took and their errors; never your code, files or pictures. PAPRIKA3D_TELEMETRY=0 turns it off. `send_feedback` sends the team a bug or feedback.";
}

/** A failed reply's last sentence in both builds, and the stop hook's in the dev build. */
export const REPORT_ASK = FEEDBACK ? "\nIf a paprika3d reply was wrong, unclear or got in your way, say so once with `send_feedback`." : "";

/** The stop hook's event: which items it asked about. */
export function stopEvent(asked: string[]) {
  if (!ON) return;
  try { mkdirSync(telemetryDir(), { recursive: true }); appendFileSync(join(telemetryDir(), `stop-${run}.jsonl`), `${JSON.stringify({ ...base(), tool: "stop", asked })}\n`); } catch {}
}
