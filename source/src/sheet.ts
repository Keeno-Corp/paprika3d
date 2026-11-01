// `sheet`: the picture sheets of paprika-make's brief (skills/paprika-make/sheets.md, docs/plan-make-sheets-2026-10-30.md
// sections 6 and 10). `check` names the image and 3D providers this machine has a key for and where each was found, never
// a value: the plugin option (PAPRIKA3D_IMAGE_PROVIDER / _KEY, from userConfig) first, then every provider's
// usual variables. Without a provider, it composes a free sheet in the shared Chrome's canvas (LOOK.png: the tagged
// reference crops, labelled, the sampled palette, a line of notes; or a numbered sheet of web candidates). With a provider,
// one adapter makes a look board or a turnaround picture, or starts a 3D model job, from the PROVIDERS table: an entry
// says its auth, its body (JSON from a template, or multipart), how refs are encoded, where the result is and how to poll.
// Tripo needs an upload first (`pre`, still a table entry), so adding a provider is one entry. A failure is one line and
// never a wait past the timeout; no key reaches a reply, a log or the .json written beside each picture.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import type { Browser } from "puppeteer-core";
import { reference, utilPage } from "./reference.ts";

export type Kind = "board" | "turnaround" | "model";
type Auth = { header: string; prefix?: string };
/** How a reference picture goes in: a data: URL string, Gemini's inlineData part, or a multipart file. */
type Enc = "dataurl" | "inline" | "file";
type Step = { url: string; body: "json" | "multipart"; template: Record<string, unknown>; refs?: Enc };
export interface Endpoint extends Step {
  model: string;
  /** a call made first, whose reply's `id` path fills "$pre" in the template (an uploaded file) */
  pre?: Step & { id: string };
  /** where the picture or model is: a URL to download, or base64; `a|b` tries a, then b */
  result: { path: string; as: "url" | "base64" };
  /** {path} in url and fetch is read from the poll reply, else the first reply */
  poll?: { url: string; status: string; done: string[]; failed?: string[]; fetch?: string };
  price: number; about?: boolean; time: string; note?: string;
}
export interface Provider { name: string; title: string; env: string[]; auth: Auth; board?: Endpoint; turnaround?: Endpoint; model?: Endpoint; why?: string; why3d?: string }

const bearer: Auth = { header: "Authorization", prefix: "Bearer " };
/** Auth, endpoints and prices as each vendor's docs give them on 2026-10-30 (the plan's tables); none was called. */
export const PROVIDERS: Provider[] = [
  { name: "fal", title: "fal", env: ["FAL_KEY", "FAL_API_KEY"], auth: { header: "Authorization", prefix: "Key " }, why: "nano-banana edit keeps a reference's character and palette, no waiting",
    board: { url: "https://fal.run/{model}", body: "json", model: "fal-ai/nano-banana/edit", refs: "dataurl", template: { prompt: "$prompt", image_urls: "$refs" }, result: { path: "images.0.url", as: "url" }, price: 0.04, time: "seconds" },
    model: { url: "https://queue.fal.run/{model}", body: "json", model: "fal-ai/hunyuan3d-v21", refs: "dataurl", template: { input_image_url: "$ref" },
      poll: { url: "{status_url}", status: "status", done: ["COMPLETED"], failed: ["FAILED", "ERROR"], fetch: "{response_url}" }, result: { path: "model_mesh.url", as: "url" }, price: 0.05, time: "1 to 4 min" } },
  { name: "gemini", title: "Gemini", env: ["GEMINI_API_KEY", "GOOGLE_API_KEY"], auth: { header: "x-goog-api-key" }, why: "keeps a reference's subject, no waiting",
    board: { url: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", body: "json", model: "gemini-2.5-flash-image", refs: "inline",
      template: { contents: [{ parts: [{ text: "$prompt" }, "...$refs"] }], generationConfig: { responseModalities: ["IMAGE"] } },
      result: { path: "candidates.0.content.parts.*.inlineData.data", as: "base64" }, price: 0.04, about: true, time: "seconds" } },
  { name: "openai", title: "OpenAI", env: ["OPENAI_API_KEY"], auth: bearer, why: "gpt-image edits keep a reference's subject",
    board: { url: "https://api.openai.com/v1/images/edits", body: "multipart", model: "gpt-image-1-mini", refs: "file", template: { model: "$model", prompt: "$prompt", "image[]": "$refs", size: "1536x1024" },
      result: { path: "data.0.b64_json", as: "base64" }, price: 0.04, about: true, time: "under a minute", note: "about $0.01 to $0.04 by quality" },
    turnaround: { url: "https://api.openai.com/v1/images/edits", body: "multipart", model: "gpt-image-1", refs: "file", template: { model: "$model", prompt: "$prompt", "image[]": "$refs", size: "1536x1024" },
      result: { path: "data.0.b64_json", as: "base64" }, price: 0.17, about: true, time: "under a minute", note: "about $0.04 to $0.17 by quality" } },
  // 3D only
  { name: "meshy", title: "Meshy", env: ["MESHY_API_KEY"], auth: bearer, why3d: "good topology and textures for a hero",
    model: { url: "https://api.meshy.ai/openapi/v1/image-to-3d", body: "json", model: "meshy-image-to-3d", refs: "dataurl", template: { image_url: "$ref" },
      poll: { url: "https://api.meshy.ai/openapi/v1/image-to-3d/{result}", status: "status", done: ["SUCCEEDED"], failed: ["FAILED", "CANCELED"] }, result: { path: "model_urls.glb", as: "url" }, price: 0.4, about: true, time: "2 to 5 min" } },
  { name: "tripo", title: "Tripo", env: ["TRIPO_API_KEY"], auth: bearer, why3d: "good topology for a hero",
    model: { url: "https://api.tripo3d.ai/v2/openapi/task", body: "json", model: "tripo-image-to-model", template: { type: "image_to_model", file: { type: "$ext", file_token: "$pre" } },
      pre: { url: "https://api.tripo3d.ai/v2/openapi/upload", body: "multipart", refs: "file", template: { file: "$ref" }, id: "data.image_token" },
      poll: { url: "https://api.tripo3d.ai/v2/openapi/task/{data.task_id}", status: "data.status", done: ["success"], failed: ["failed", "cancelled", "banned", "expired"] },
      result: { path: "data.output.pbr_model|data.output.model", as: "url" }, price: 0.3, about: true, time: "1 to 3 min" } },
];
/** The fixed recommendation orders: for pictures, the models that take reference images and keep the subject, then price,
    then sync over polling; for a game model, the fast cheap one for props first, then the ones a hero wants. */
export const IMAGE_ORDER = ["fal", "gemini", "openai"];
export const MODEL_ORDER = ["fal", "tripo", "meshy"];
const byName = (n: string) => PROVIDERS.find(p => p.name === n);
const endpoint = (p: Provider, k: Kind) => k === "model" ? p.model : k === "turnaround" ? p.turnaround ?? p.board : p.board;

// ---- keys ---------------------------------------------------------------------------------------------------------

/** A value that is not there: unset, blank, the plugin option's placeholder left unexpanded (`${user_config.image_key}`), or
    `none`, image_provider's default (Claude Code needs a field with options to default to one of them). */
export const absent = (v: string | undefined): v is undefined => !v || !v.trim() || /^\$\{[^}]*\}$/.test(v.trim()) || v.trim().toLowerCase() === "none";
type Env = Record<string, string | undefined>;
export type Found = { provider: Provider; key: string; where: string };
/** Every provider with a key, the plugin option's first. */
export function found(env: Env = process.env): Found[] {
  const opt = (k: string) => [env[`PAPRIKA3D_IMAGE_${k}`], env[`CLAUDE_PLUGIN_OPTION_IMAGE_${k}`]].find(v => !absent(v))?.trim();
  const out: Found[] = [], optName = opt("PROVIDER")?.toLowerCase(), optKey = opt("KEY"), chosen = optName && byName(optName);
  if (chosen && optKey) out.push({ provider: chosen, key: optKey, where: "plugin option" });
  for (const p of PROVIDERS) {
    if (out.some(f => f.provider === p)) continue;
    const name = p.env.find(n => !absent(env[n]));
    if (name) out.push({ provider: p, key: env[name]!.trim(), where: name });
  }
  return out;
}
/** The provider to use for `kind`: the plugin option's when it has that kind, else the first found in the fixed order. */
export function recommend(all: Found[], kind: Kind, env: Env = process.env): Found | undefined {
  const opt = all.find(f => f.where === "plugin option" && endpoint(f.provider, kind));
  if (opt) return opt;
  return (kind === "model" ? MODEL_ORDER : IMAGE_ORDER).map(n => all.find(f => f.provider.name === n && endpoint(f.provider, kind))).find(Boolean);
}
const usd = (n: number) => { const t = +n.toFixed(3); return `$${t.toFixed(Math.round(t * 1000) % 10 ? 3 : 2)}`; };
const price = (e: Endpoint) => e.note ?? `${e.about ? "about " : ""}${usd(e.price)}`;

export type Job = { name: string; kind: "turnaround" | "model"; provider: string; started: number; state: "running" | "done" | "failed"; file?: string; error?: string };
/** `check`'s reply: providers by name and where each key was found, the recommendation with its price, the sources line. */
/** The plugin option's key set with no provider it can be used with, as one line (the provider field degrades to free text
    before Claude Code 2.1.271, so a typo is easy), or "". Never the key, and the provider value only as empty or not. */
export function optionProblem(env: Env = process.env): string {
  const opt = (k: string) => [env[`PAPRIKA3D_IMAGE_${k}`], env[`CLAUDE_PLUGIN_OPTION_IMAGE_${k}`]].find(v => !absent(v))?.trim();
  if (!opt("KEY")) return "";
  const name = opt("PROVIDER")?.toLowerCase(), p = name ? byName(name) : undefined;
  if (!name) return "The plugin's image_key is set but image_provider is empty: set it to the key's provider (/plugin configure paprika3d), or the key is not used.";
  if (!p) return `The plugin's image_key is set but image_provider is not a provider name: use one of ${IMAGE_ORDER.join(", ")} (/plugin configure paprika3d), or the key is not used.`;
  return "";
}

/** The person's remembered answers, across projects: prefs.json in the folder publish keeps its login in
    (PAPRIKA3D_CONFIG_DIR, else $XDG_CONFIG_HOME/paprika3d, else ~/.config/paprika3d). Only a yes to picture sheets is kept. */
export const prefsFile = (env: Env = process.env) => join(env.PAPRIKA3D_CONFIG_DIR || join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "paprika3d"), "prefs.json");
export function prefs(env: Env = process.env): { picture_sheets?: "yes" } {
  try { const p = JSON.parse(readFileSync(prefsFile(env), "utf8")); return p && typeof p === "object" ? p : {}; } catch { return {}; }
}
function remember(env: Env, answer: "yes" | "ask"): string {
  const file = prefsFile(env), p: Record<string, unknown> = prefs(env);
  if (answer === "yes") p.picture_sheets = "yes"; else delete p.picture_sheets;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(p, null, 2) + "\n");
  return answer === "yes" ? `Remembered in ${file}: this person wants picture sheets, so later projects skip the question (remember: "ask" forgets it).`
    : `Forgot the picture-sheet answer in ${file}: the next brief asks again.`;
}
export function checkText(env: Env = process.env, jobs: Job[] = []): string {
  const all = found(env), names = (k: Kind) => PROVIDERS.filter(p => endpoint(p, k)).map(p => p.name);
  const list = (k: Kind) => { const have = all.filter(f => endpoint(f.provider, k)), miss = names(k).filter(n => !have.some(f => f.provider.name === n));
    return `${have.length ? have.map(f => `${f.provider.name} (${f.where})`).join(", ") : "none"}. Not found: ${miss.join(", ") || "none"}.`; };
  const img = recommend(all, "board", env), m3 = recommend(all, "model", env), lines = [`Image keys found: ${list("board")}`], problem = optionProblem(env);
  if (problem) lines.push(problem);
  if (prefs(env).picture_sheets === "yes") lines.push(`Remembered: this person said yes to picture sheets before (${prefsFile(env)}); skip the question and make them.`);
  if (img) {
    const b = img.provider.board!, t = endpoint(img.provider, "turnaround")!, game = b.price + 4 * t.price, others = all.filter(f => f !== img && f.provider.board);
    lines.push(`Picture sheets: recommended ${img.provider.name} (${img.provider.why ? `${img.provider.why}, ` : ""}${price(b)} an image${t !== b ? `, turnarounds ${price(t)}` : ""}); one look board and up to four turnarounds is about ${usd(game)} a game.` +
      (others.length ? ` Also: ${others.map(f => `${f.provider.name} ${price(f.provider.board!)}`).join(", ")}.` : ""));
  } else {
    const img = PROVIDERS.filter(p => p.board), titles = img.map(p => p.title);
    lines.push(`Picture sheets need an image key (${titles.slice(0, -1).join(", ")} or ${titles.at(-1)}): /plugin configure paprika3d, or the provider's usual variable (${img.map(p => p.env[0]).join(", ")} ...). LOOK.png is made from the references for free either way.`);
  }
  lines.push(`3D keys found: ${list("model")}`);
  if (m3) lines.push(`3D models: recommended ${m3.provider.name} (${m3.provider.model!.model}, ${price(m3.provider.model!)} and ${m3.provider.model!.time} a model${m3.provider.why3d ? `, ${m3.provider.why3d}` : ""}); a job runs in the background while the build goes on.`);
  else lines.push("(connect a 3D key to generate models: /plugin configure paprika3d, or MESHY_API_KEY, TRIPO_API_KEY, FAL_KEY ...)");
  lines.push(`Sources on this machine: the library (57,732 free models, textures and skies, searched by your pictures), web search for free assets (with the session's web tools)${m3 ? `, generation with your ${m3.provider.title} key (${price(m3.provider.model!)} and ${m3.provider.model!.time} a model)` : ""}, and building in code (model_run with Manifold, checked with model_look).`);
  for (const j of jobs) lines.push(`${j.kind === "model" ? "Model" : "Turnaround"} job ${j.name} (${j.provider}): ${j.state === "running" ? `running for ${Math.round((Date.now() - j.started) / 1000)} s` : j.state === "done" ? `done, ${j.file}` : `failed: ${j.error}`}.`);
  return lines.join("\n");
}

// ---- the adapter ----------------------------------------------------------------------------------------------------

export type Ref = { data: Buffer; mime: string; name: string };
/** A value at a dotted path: `a.0.b`, `*` for the first element whose rest is there, `a|b` for a, else b. */
export function dig(o: unknown, path: string): unknown {
  if (!path) return o;
  if (path.includes("|")) { for (const p of path.split("|")) { const v = dig(o, p); if (v !== undefined && v !== null) return v; } return undefined; }
  const [head, ...rest] = path.split(".");
  if (head === "*") { for (const x of Array.isArray(o) ? o : []) { const v = dig(x, rest.join(".")); if (v !== undefined) return v; } return undefined; }
  const v = (o as Record<string, unknown> | null)?.[head!];
  return rest.length ? dig(v, rest.join(".")) : v;
}
const tpl = (s: string, ...from: unknown[]) => s.replace(/\{([\w.]+)\}/g, (_, p: string) => { for (const o of from) { const v = dig(o, p); if (v !== undefined && v !== null) return String(v); } throw new Error(`the reply has no ${p}`); });
const encode = (r: Ref, as: Enc) => as === "inline" ? { inlineData: { mimeType: r.mime, data: r.data.toString("base64") } } : `data:${r.mime};base64,${r.data.toString("base64")}`;
/** The template with "$prompt", "$model", "$pre", "$ext" (the first picture's file type), "$ref" (the first picture) and
    "$refs" (all, or spread by "...$refs") filled. */
function fill(t: unknown, v: { prompt: string; model: string; pre?: string; ext?: string; refs: unknown[] }): unknown {
  if (t === "$prompt") return v.prompt;
  if (t === "$ext") return v.ext;
  if (t === "$model") return v.model;
  if (t === "$pre") return v.pre;
  if (t === "$ref") return v.refs[0];
  if (t === "$refs") return v.refs;
  if (Array.isArray(t)) return t.flatMap(x => x === "...$refs" ? v.refs : [fill(x, v)]);
  if (t && typeof t === "object") return Object.fromEntries(Object.entries(t).map(([k, x]) => [k, fill(x, v)]));
  return t;
}
function body(step: Step, v: { prompt: string; model: string; pre?: string; ext?: string }, refs: Ref[]): BodyInit {
  if (step.body === "json") return JSON.stringify(fill(step.template, { ...v, refs: refs.map(r => encode(r, step.refs ?? "dataurl")) }));
  const form = new FormData();
  for (const [k, x] of Object.entries(step.template)) {
    const files = x === "$refs" ? refs : x === "$ref" ? refs.slice(0, 1) : null;
    if (files) for (const r of files) form.append(k, new Blob([new Uint8Array(r.data)], { type: r.mime }), r.name);
    else form.append(k, String(fill(x, { ...v, refs: [] })));
  }
  return form;
}
const authHeaders = (p: Provider, f: Found): Record<string, string> => ({ [p.auth.header]: `${p.auth.prefix ?? ""}${f.key}` });

export type Made = { bytes: Buffer; ext: string; model: string; price: number; about: boolean; url?: string };
export type GenOpts = { model?: string; timeoutMs?: number; pollMs?: number };
/** `s` with every copy of `f`'s key replaced by [hidden]. Applied to the whole text before any cut, so a key across the
    cut is never shown in part. */
export function hideKey(f: Pick<Found, "key">, s: string): string {
  return f.key ? s.split(f.key).join("[hidden]") : s;
}

/** One picture or model from `f`'s provider: the table entry's calls, its poll and its result, within the timeout. Errors
    never carry the key (any copy of the key in the reply's text is hidden, then the text is cut). */
export async function generate(f: Found, kind: Kind, prompt: string, refs: Ref[], o: GenOpts = {}): Promise<Made> {
  const p = f.provider, e = endpoint(p, kind);
  if (!e) throw new Error(`${p.name} has no ${kind === "model" ? "3D" : "picture"} endpoint in the table`);
  const takesRefs = (e.refs || e.pre?.refs) && (JSON.stringify(e.template).includes("$ref") || e.pre);
  if (takesRefs && !refs.length) throw new Error(`${p.name}'s ${kind} takes a reference picture: give pictures`);
  const limit = o.timeoutMs ?? (kind === "model" ? 600_000 : 90_000), deadline = Date.now() + limit, model = o.model ?? e.model, auth = authHeaders(p, f);
  if (!/^[\w./:-]+$/.test(model) || model.includes("..")) throw new Error(`${p.name}: model "${model}" is not a model name`);
  const hide = (s: string) => hideKey(f, s), ext = (MIME_EXT[refs[0]?.mime ?? ""] ?? "jpg");
  const call = async (url: string, init: RequestInit = {}, signed = true): Promise<Response> => {
    const left = deadline - Date.now();
    if (left <= 0) throw new Error(`${p.name} took longer than ${limit < 1000 ? `${limit} ms` : `${Math.round(limit / 1000)} s`}`);
    if (!/^(https?|data):/i.test(url)) throw new Error(`${p.name}'s reply names a ${url.split(":")[0]}: URL; only http(s) and data: are fetched`);
    let r: Response;
    try { r = await fetch(url, { ...init, headers: { ...signed ? auth : {}, ...init.headers as Record<string, string> }, signal: AbortSignal.timeout(left) }); }
    catch (err) { throw new Error(hide(`${p.name} unreachable: ${(err as Error).message}`)); }
    if (!r.ok) throw new Error(`${p.name} answered ${r.status}: ${hide(await r.text()).slice(0, 200)}`);
    return r;
  };
  const json = async (url: string, init: RequestInit = {}) => {
    const r = await call(url, init);
    try { return await r.json() as any; }
    catch (err) { throw new Error(hide(`${p.name} answered with something other than JSON: ${(err as Error).message}`)); }
  };
  const send = (s: Step, pre?: string): RequestInit => ({ method: "POST", body: body(s, { prompt, model, pre, ext }, refs),
    headers: s.body === "json" ? { "content-type": "application/json" } : {} });
  const pre = e.pre ? String(dig(await json(e.pre.url, send(e.pre)), e.pre.id)) : undefined;
  const url = tpl(e.url, { model });
  const wait = () => new Promise(ok => setTimeout(ok, o.pollMs ?? 2_000));
  const first = await json(url, send(e, pre));
  let reply = first;
  if (e.poll && !e.poll.done.includes(String(dig(reply, e.poll.status)))) {
    const at = tpl(e.poll.url, first);
    for (;;) {
      await wait();
      reply = await json(at);
      const s = String(dig(reply, e.poll.status));
      if (e.poll.done.includes(s)) break;
      if (e.poll.failed?.includes(s)) throw new Error(hide(`${p.name}: the job ended ${s}`));
    }
  }
  if (e.poll?.fetch) reply = await json(tpl(e.poll.fetch, reply, first));
  let out = dig(reply, e.result.path);
  if (Array.isArray(out)) out = out[0];
  if (typeof out !== "string" || !out) throw new Error(`${p.name}'s reply has no ${e.result.path}`);
  if (e.result.as === "base64") return made(Buffer.from(out, "base64"), e, model);
  return { ...made(Buffer.from(await (await call(out, {}, false)).arrayBuffer()), e, model), url: out.startsWith("data:") ? undefined : out };
}
function made(bytes: Buffer, e: Endpoint, model: string): Made {
  const h = bytes.subarray(0, 12).toString("latin1");
  const ext = h.startsWith("\x89PNG") ? ".png" : h.startsWith("\xff\xd8") ? ".jpg" : h.startsWith("RIFF") && h.slice(8) === "WEBP" ? ".webp" : h.startsWith("glTF") ? ".glb" : "";
  if (!ext) throw new Error(`the provider sent ${bytes.length} bytes that are no PNG, JPEG, WebP or GLB`);
  return { bytes, ext, model, price: e.price, about: !!e.about };
}

// ---- the tool ---------------------------------------------------------------------------------------------------------

export type Picture = { file: string; crop?: number[]; label?: string };
export type SheetArgs = { cwd: string; check?: boolean; provider?: string; kind?: Kind | "look"; model?: string; prompt?: string; name?: string;
  pictures?: Picture[]; palette?: (string | { hex: string; label?: string })[]; notes?: string; title?: string; out?: string; remember?: "yes" | "ask" };
const jobs = new Map<string, Job>();
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const MIME_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** A path the call names, under the project, or a refusal. */
function inside(cwd: string, path: string): string {
  const to = resolve(cwd, path), rel = relative(cwd, to);
  if (!rel || rel.split(sep)[0] === ".." || resolve(rel) === rel) throw new Error(`sheet: ${path} is outside the project (${cwd}); give a path under it`);
  return to;
}
/** A picture under refs/study/: a study frame, never sent to a provider nor drawn on a sheet the critic and the person read. */
const isStudy = (cwd: string, file: string) => /(^|\/)refs\/study\//.test(relative(cwd, resolve(cwd, file)).split("\\").join("/"));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sheet";

/** The tool: check, a free sheet, a picture from a provider (the free board in its place when it fails), or a model job. */
export async function sheet(chrome: () => Promise<Browser>, a: SheetArgs, env: Env = process.env, o: GenOpts = {}): Promise<{ text: string; jpeg?: string }> {
  const cwd = resolve(a.cwd);
  if (a.remember) return { text: remember(env, a.remember) };
  if (a.check) return { text: checkText(env, [...jobs.values()]) };
  const kind = a.kind ?? (a.provider ? "board" : "look"), pics = a.pictures ?? [];
  if (kind === "look" || !a.provider) return compose(chrome, cwd, a);
  const all = found(env), f = a.provider === "auto" ? recommend(all, kind, env) : all.find(x => x.provider.name === a.provider);
  if (!f) {
    const p = byName(a.provider ?? "");
    throw new Error(p ? `sheet: no key for ${p.name} (${p.env.join(", ")}, or the plugin option): \`sheet\` { check: true } names the keys found` : `sheet: no provider "${a.provider}"; one of ${PROVIDERS.map(x => x.name).join(", ")} or "auto"`);
  }
  if (!a.prompt) throw new Error("sheet: prompt is needed with a provider: what the picture shows, in LOOK.md's or CHARACTERS.md's words");
  // a generated sheet is made from the person's tagged refs/, never from a study frame (sheets.md, the IP rule)
  const study = pics.find(p => isStudy(cwd, p.file));
  if (study) throw new Error(`sheet: ${study.file} is a study reference: picture sheets and models are made from the tagged pictures in refs/, never from refs/study/`);
  const refs: Ref[] = [];
  for (const p of pics) {
    const file = inside(cwd, p.file);
    if (!existsSync(file)) throw new Error(`sheet: no file ${p.file} under ${cwd}`);
    refs.push(p.crop ? { data: Buffer.from((await reference(chrome(), { file, crop: p.crop }, p.file)).jpeg, "base64"), mime: "image/jpeg", name: "ref.jpg" }
      : { data: readFileSync(file), mime: MIME[extname(file).toLowerCase()] ?? "image/png", name: `ref${extname(file)}` });
  }
  const name = slug(a.name ?? (kind === "board" ? "LOOK-board" : kind === "model" ? "model" : "turnaround")).replace(/^look-board$/, "LOOK-board");
  const inputs = pics.map(p => ({ file: p.file, crop: p.crop }));
  const save = (dir: string, m: Made) => {
    const file = join(cwd, dir, name + m.ext);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, m.bytes);
    // no key here: what was made, from what, by whom and for about how much
    // the result URL without its query: a signed URL works as a bearer token until it expires
    writeFileSync(join(cwd, dir, `${name}.json`), JSON.stringify({ provider: f.provider.name, model: m.model, kind, prompt: a.prompt, inputs, price: m.price, priceAbout: m.about, source: m.url?.split("?")[0], at: new Date().toISOString() }, null, 2) + "\n");
    return relative(cwd, file);
  };
  if (kind === "model" || kind === "turnaround") {
    const id = `${kind}:${name}`, e = endpoint(f.provider, kind)!, dir = kind === "model" ? "assets/generated" : "refs/sheets", ext = kind === "model" ? ".glb" : ".png";
    if (jobs.get(id)?.state === "running") throw new Error(`sheet: a ${kind} job named ${name} is running; \`sheet\` { check: true } says when it is done`);
    const job: Job = { name, kind, provider: f.provider.name, started: Date.now(), state: "running" };
    jobs.set(id, job);
    // never waited on: the brief and the build go on, and check reports the file when it lands. Nothing in here may
    // reject unhandled: on Node (the public plugin) that ends the server and every open page with it (S2)
    const failed = (err: unknown) => { job.error = hideKey(f, String((err as Error)?.message ?? err)); job.state = "failed"; };
    generate(f, kind, a.prompt, refs, o).then(m => {
      try { job.file = save(dir, m); job.state = "done"; } catch (err) { failed(err); }
    }, failed).catch(failed);
    const until = kind === "model" ? "Until then the page loads a stand-in; then model_audit and model_look the file before the page uses it."
      : "If it fails, the build fills the Turnaround line from model_look or the pick's contact sheet.";
    return { text: `Started a ${f.provider.name} ${kind} job for ${name} (${e.model}, ${price(e)}, ${e.time}). It lands in ${dir}/${name}${ext} (or another picture type) with ${name}.json beside it; \`sheet\` { check: true } says when it is done (after a server restart, look for ${dir}/${name}.json). ${until}` };
  }
  try {
    const m = await generate(f, kind, a.prompt, refs, o), file = save("refs/sheets", m);
    return { text: `Saved ${file} (${f.provider.name} ${m.model}, ${m.about ? "about " : ""}${usd(m.price)}), with ${file.replace(/\.\w+$/, ".json")} beside it.`,
      jpeg: await preview(chrome, m.bytes).catch(() => undefined) };
  } catch (err) {
    const why = `${f.provider.name} made no ${kind}: ${(err as Error).message}`;
    if (!pics.length) return { text: `${why}.` };
    const free = await compose(chrome, cwd, { ...a, out: undefined });
    return { text: `${why}. The free board stands:\n${free.text}`, jpeg: free.jpeg };
  }
}

/** A JPEG at most 1,024 px wide of a PNG, JPEG or WebP picture, drawn in the shared Chrome, for the reply. */
async function preview(chrome: () => Promise<Browser>, bytes: Buffer): Promise<string> {
  const page = await utilPage(chrome());
  return page.evaluate(async (b64: string) => {
    const img = await createImageBitmap(new Blob([Uint8Array.fromBase64?.(b64) ?? Uint8Array.from(atob(b64), ch => ch.charCodeAt(0))]));
    const k = Math.min(1, 1024 / img.width), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8).split(",")[1]!;
  }, bytes.toString("base64"));
}

const CELL = { w: 400, h: 300, label: 30, pad: 12 };
/** Runs in the page: the pictures (cropped) in a grid of numbered, labelled cells, a title, a palette row and a notes line;
    the file's bytes (PNG or JPEG by `type`) and a JPEG preview at most 1,024 px wide, both base64. */
async function drawBoard(a: { pics: { b64: string; crop: number[] | null; label: string }[]; palette: { hex: string; label: string }[]; title: string; notes: string; type: string }, cell: typeof CELL) {
  const { w: CELL_W, h: CELL_H, label: LABEL, pad: PAD } = cell;
  const cols = Math.min(3, Math.max(1, a.pics.length)), rows = Math.ceil(a.pics.length / cols);
  const top = a.title ? 48 : PAD, swatch = a.palette.length ? 96 : 0, notes = a.notes ? 40 : 0;
  const c = document.createElement("canvas"), g = c.getContext("2d")!;
  c.width = PAD + cols * (CELL_W + PAD); c.height = top + rows * (CELL_H + LABEL + PAD) + swatch + notes + PAD;
  g.fillStyle = "#1b1b1b"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#f2efe6";
  if (a.title) { g.font = "bold 22px sans-serif"; g.fillText(a.title, PAD, 32); }
  for (let i = 0; i < a.pics.length; i++) {
    const p = a.pics[i]!, x = PAD + (i % cols) * (CELL_W + PAD), y = top + Math.floor(i / cols) * (CELL_H + LABEL + PAD);
    const img = await createImageBitmap(new Blob([Uint8Array.fromBase64?.(p.b64) ?? Uint8Array.from(atob(p.b64), ch => ch.charCodeAt(0))])).catch(() => null); // as PNG_BLOB in look.ts
    g.fillStyle = "#2a2a2a"; g.fillRect(x, y, CELL_W, CELL_H);
    if (img) {
      const [l, t, r, b] = p.crop ?? [0, 0, img.width, img.height], sw = Math.max(1, Math.min(img.width, r!) - l!), sh = Math.max(1, Math.min(img.height, b!) - t!);
      const k = Math.min(CELL_W / sw, CELL_H / sh), w = sw * k, h = sh * k;
      g.drawImage(img, l!, t!, sw, sh, x + (CELL_W - w) / 2, y + (CELL_H - h) / 2, w, h);
    } else { g.fillStyle = "#999"; g.font = "14px sans-serif"; g.fillText("not a picture", x + 150, y + CELL_H / 2); }
    g.fillStyle = "rgba(0, 0, 0, 0.75)"; g.fillRect(x + 4, y + 4, 26, 24);
    g.fillStyle = "#fff"; g.font = "bold 16px sans-serif"; g.fillText(String(i + 1), x + 11, y + 22);
    g.fillStyle = "#f2efe6"; g.font = "14px sans-serif"; g.fillText(p.label.slice(0, 52), x, y + CELL_H + 20);
  }
  let y = top + rows * (CELL_H + LABEL + PAD);
  const sw = a.palette.length ? Math.min(140, (c.width - PAD) / a.palette.length - PAD) : 0;
  a.palette.forEach((s, i) => {
    const x = PAD + i * (sw + PAD);
    g.fillStyle = s.hex; g.fillRect(x, y, sw, 56);
    g.fillStyle = "#f2efe6"; g.font = "13px sans-serif"; g.fillText(`${s.label ? s.label + " " : ""}${s.hex}`.slice(0, 24), x, y + 76);
  });
  y += swatch;
  if (a.notes) { g.fillStyle = "#f2efe6"; g.font = "15px sans-serif"; g.fillText(a.notes.slice(0, 160), PAD, y + 24); }
  const k = Math.min(1, 1024 / c.width), pv = document.createElement("canvas");
  pv.width = Math.round(c.width * k); pv.height = Math.round(c.height * k);
  pv.getContext("2d")!.drawImage(c, 0, 0, pv.width, pv.height);
  return { file: c.toDataURL(a.type, 0.85).split(",")[1]!, preview: pv.toDataURL("image/jpeg", 0.8).split(",")[1]!, size: [c.width, c.height] };
}

/** The free sheet: refs/sheets/LOOK.png by default, or `out` (a .png or .jpg under the project). */
async function compose(chrome: () => Promise<Browser>, cwd: string, a: SheetArgs): Promise<{ text: string; jpeg: string }> {
  const pics = a.pictures ?? [];
  if (!pics.length && !a.palette?.length) throw new Error("sheet: give pictures (each { file, crop?, label? }) and a palette to compose a sheet, or check: true");
  const out = inside(cwd, a.out ?? "refs/sheets/LOOK.png"), type = /\.jpe?g$/i.test(out) ? "image/jpeg" : "image/png";
  if (!/\.(png|jpe?g)$/i.test(out)) throw new Error("sheet: out is a .png or .jpg file");
  const study = pics.find(p => isStudy(cwd, p.file));
  if (study) throw new Error(`sheet: ${study.file} is a study reference: sheets show the tagged pictures in refs/, never refs/study/ (its frames stay in the notes)`);
  const palette = (a.palette ?? []).map(s => typeof s === "string" ? { hex: s, label: "" } : { hex: s.hex, label: s.label ?? "" });
  const bad = palette.find(s => !/^#[0-9a-f]{6}$/i.test(s.hex));
  if (bad) throw new Error(`sheet: palette colours are #rrggbb, got ${bad.hex}`);
  const loaded = pics.map(p => { const file = inside(cwd, p.file); if (!existsSync(file)) throw new Error(`sheet: no file ${p.file} under ${cwd}`); return { b64: readFileSync(file).toString("base64"), crop: p.crop ?? null, label: p.label ?? p.file }; });
  const page = await utilPage(chrome());
  const r = await page.evaluate(drawBoard, { pics: loaded, palette, title: a.title ?? "", notes: a.notes ?? "", type }, CELL);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(r.file, "base64"));
  return { text: `Saved ${relative(cwd, out)} (${r.size[0]} × ${r.size[1]}): ${pics.length} picture${pics.length === 1 ? "" : "s"}, numbered as given, and ${palette.length} swatch${palette.length === 1 ? "" : "es"}. Made here, free; nothing was sent anywhere.`, jpeg: r.preview };
}
