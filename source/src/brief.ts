// What a project's brief and sheets lack, against the shapes skills/paprika-make/SKILL.md ("The brief") and sheets.md give
// them: text only, no page. `sheet` { check: true } ends with these lines once the project has a brief, so the builder
// reads them before the critic starts. A sheet the person wrote is theirs (sheets.md): only what paprika-make adds to it
// is asked of it (DESIGN.md's Decisions and Decision log), never its own headings.
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

/** A markdown file's `## ` sections by lower-cased heading, each its lines without blank ones. */
function sections(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let at: string[] | undefined;
  for (const line of text.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) out.set(h[1]!.toLowerCase(), at = []);
    else if (line.trim()) at?.push(line.trim());
  }
  return out;
}
const numbered = (lines: string[] = []) => lines.filter(l => /^\d+\.\s+\S/.test(l));
const find = (s: Map<string, string[]>, start: string) => [...s].find(([k]) => k.startsWith(start))?.[1];

/** Why `f` (relative to `cwd`) is not read: it leaves the project by `..` or through a link, or it is not a plain file.
    Null when it is a plain file inside the project; "missing" when nothing is there. */
function unsafe(cwd: string, f: string): string | null {
  const full = resolve(cwd, f);
  if (isAbsolute(f) || relative(resolve(cwd), full).startsWith("..")) return "it is outside the project";
  try { if (!lstatSync(full, { throwIfNoEntry: false })) return "missing"; } catch { return "missing"; } // a file where a folder of the path would be
  let real: string;
  try { real = realpathSync(full); } catch { return "missing"; } // a link to nothing
  if (relative(realpathSync(cwd), real).startsWith("..")) return "it links outside the project";
  return statSync(real).isFile() ? null : "it is not a file";
}

/** The brief file of `cwd`, relative to it: a loop's paprika-loop/PROMPT.md, the one the loop reads and the person edits
    (the BRIEF.md it was copied from stays behind), else BRIEF.md; null when there is none. */
export const briefFile = (cwd: string) => ["paprika-loop/PROMPT.md", "BRIEF.md"].find(f => unsafe(cwd, f) !== "missing") ?? null;

/** A loop's PROMPT.md with none of a brief's sections is the person's request as given: nothing is asked of it. */
const ownWords = (file: string, brief: Map<string, string[]>) => file !== "BRIEF.md" && !["what it is", "must have", "sheets"].some(h => brief.has(h));

// the lines a CHARACTERS.md entry is made of (sheets.md): a section with one is a character or key prop, and an adopted
// sheet's own headings (Notes) have none
const ENTRY = /^(Role|Silhouette|Colours|Colors|Materials|Animation|Refs|Turnaround):/;

/** The files `lines` (a brief's Sheets section) name: a name may be quoted with backticks and hold spaces; the answers
    line (Web study: yes · ...) names none. */
const sheetNames = (lines: string[] = []) => [...new Set(lines.flatMap(l => l.split(/\s*·\s*/)).map(s => s.trim().replace(/^`(.*)`$/, "$1").trim()).filter(s => /\.(md|png|jpe?g|webp)$/i.test(s)))];

/** One line per thing the brief or a sheet it names lacks; empty when they are whole, when there is no brief, or when a
    loop's PROMPT.md is the person's own words (`paprika3d loop` writes the request there as given) rather than a brief. */
export function lintBrief(cwd: string): string[] {
  const file = briefFile(cwd);
  if (!file) return [];
  const why = unsafe(cwd, file);
  if (why) return [`${file} is not read: ${why}.`];
  const read = (f: string) => readFileSync(join(cwd, f), "utf8"), out: string[] = [];
  const brief = sections(read(file)), must = numbered(brief.get("must have"));
  if (ownWords(file, brief)) return [];
  if (!brief.has("what it is")) out.push(`${file} has no "## What it is" section.`);
  if (!must.length) out.push(`${file} has no numbered line under "## Must have": the build is checked against that list.`);
  if (!brief.has("sheets")) out.push(`${file} has no "## Sheets" section: it names each sheet and logs the answers.`);
  // a scene rebuilt 1:1 from pictures has no sheets, so a section naming none is not an error: briefText says none was checked
  const named = sheetNames(brief.get("sheets"));
  for (const name of named) {
    // a loop's sheets sit beside PROMPT.md or at the project root
    const beside = join(dirname(file), name).split("\\").join("/"), f = unsafe(cwd, beside) !== "missing" ? beside : name;
    const why = unsafe(cwd, f);
    if (why === "missing") { out.push(`${file} names ${f} under "## Sheets", and there is no such file.`); continue; }
    if (why) { out.push(`${file} names ${f} under "## Sheets", and it is not read: ${why}.`); continue; }
    const base = f.split("/").pop()!;
    if (!/\.md$/i.test(base)) continue;
    if (!must.some(l => l.includes(base))) out.push(`${file}'s Must have list has no line for ${base} (one line per sheet).`);
    const text = read(f), s = sections(text);
    if (!text.trim()) { out.push(`${f} is empty.`); continue; }
    if (base === "LOOK.md") {
      const palette = s.get("palette"), checks = numbered(s.get("checks"));
      if (!palette?.some(l => /#[0-9a-f]{6}\b/i.test(l))) out.push(`${f} has no hex colour under "## Palette".`);
      else if (palette.some(l => /#[0-9a-f]{6}\b/i.test(l) && !/\(.*\)\s*$/.test(l))) out.push(`${f}'s Palette line names no source: end it with the picture it was sampled from, or "(not sampled)".`);
      if (checks.length < 3 || checks.length > 5) out.push(`${f} has ${checks.length} numbered line${checks.length === 1 ? "" : "s"} under "## Checks"; the critic and a loop's judge hold the page to three to five.`);
    } else if (base === "CHARACTERS.md") {
      const entries = [...s].filter(([, lines]) => lines.some(l => ENTRY.test(l) || /^Source:/.test(l)));
      // a sheet the person wrote keeps its own shape (a table, prose), so one with no entry in ours is not held to it
      for (const [name, lines] of entries) if (!lines.some(l => /^Source:\s*\S/.test(l))) out.push(`${f}: "${name}" has no Source line (a library pick, a web file, a generation job, or built in code).`);
    } else if (base === "DESIGN.md") {
      const decisions = find(s, "decisions"), log = find(s, "decision log");
      if (!decisions) out.push(`${f} has no "## Decisions" section.`);
      if (!log) out.push(`${f} has no "## Decision log" section.`);
      else if (decisions?.some(l => l.startsWith("- ")) && !log.length) out.push(`${f} lists decisions and its Decision log is empty: each one taken gets a line (date · what · choice · over what · who).`);
    }
  }
  return out;
}

/** `sheet` check's lines about the brief: nothing without one. */
export function briefText(cwd: string): string {
  let file: string | null = null;
  try {
    file = briefFile(cwd);
    if (!file) return "";
    const brief = unsafe(cwd, file) ? null : sections(readFileSync(join(cwd, file), "utf8"));
    if (brief && ownWords(file, brief)) return "";
    const lacks = lintBrief(cwd);
    if (lacks.length) return `\nBrief (${file}) and its sheets lack ${lacks.length === 1 ? "one thing" : `${lacks.length} things`}:\n${lacks.map(l => `- ${l}`).join("\n")}`;
    return sheetNames(brief?.get("sheets")).length ? `\nBrief (${file}) and the sheets it names are whole.`
      : `\nBrief (${file}) has its sections and names no sheet, so no sheet was checked: only a scene rebuilt 1:1 from pictures goes without LOOK.md.`;
  } catch (e) { return `\nBrief${file ? ` (${file})` : ""}: not read (${(e as Error).message}).`; }
}
