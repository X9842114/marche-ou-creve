import fs from "fs";

const path =
  "C:/Users/Shadow/.cursor/projects/c-Users-Shadow-marche-ou-creve/agent-transcripts/89605839-2acd-47fb-8457-307f2ea1beed/89605839-2acd-47fb-8457-307f2ea1beed.jsonl";
const lines = fs.readFileSync(path, "utf8").split(/\n/).filter(Boolean);

let content = null;
const ops = [];

for (const line of lines) {
  if (!line.includes("globals.css")) continue;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    continue;
  }
  const parts = o?.message?.content;
  if (!Array.isArray(parts)) continue;
  for (const part of parts) {
    if (part.type !== "tool_use") continue;
    const p = String(part.input?.path || "");
    if (!p.includes("globals.css")) continue;
    if (part.name === "Write" && part.input?.contents) {
      content = part.input.contents;
      ops.length = 0;
    } else if (part.name === "StrReplace" && part.input?.old_string != null) {
      ops.push({
        old: part.input.old_string,
        neu: part.input.new_string,
        all: !!part.input.replace_all,
      });
    }
  }
}

if (!content) {
  console.error("no base");
  process.exit(1);
}

let applied = 0;
let failed = 0;
for (const op of ops) {
  if (op.all) {
    if (!content.includes(op.old)) {
      failed++;
      continue;
    }
    content = content.split(op.old).join(op.neu);
    applied++;
  } else {
    const idx = content.indexOf(op.old);
    if (idx < 0) {
      failed++;
      continue;
    }
    content =
      content.slice(0, idx) + op.neu + content.slice(idx + op.old.length);
    applied++;
  }
}

content = content.replace(
  /\.crt-atmosphere__gif\s*\{[\s\S]*?\n\}/,
  `.crt-atmosphere__still {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.45) 42%, rgba(0, 0, 0, 0.65) 100%),
    radial-gradient(ellipse at 68% 42%, #4a1260 0%, #120018 42%, #020005 72%, #000 100%);
  filter: saturate(1.05) contrast(1.02);
}`
);

content = content.replace(
  /\.crt-atmosphere__scanlines\s*\{[\s\S]*?\n\}/,
  `.crt-atmosphere__scanlines {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.25) 0px,
    rgba(0, 0, 0, 0.25) 1px,
    transparent 1px,
    transparent 4px
  );
  mix-blend-mode: multiply;
}`
);

content = content.replace(
  /\/\* CRT monitor bezel \*\/[\s\S]*?@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/,
  `@media (prefers-reduced-motion: reduce) {
  .crt-atmosphere__still {
    filter: none;
  }
}`
);

content = content.replace(/\.crt-atmosphere__noise\s*\{[\s\S]*?\n\}/, "");

fs.writeFileSync(
  "C:/Users/Shadow/marche-ou-creve/src/app/globals.css",
  content
);
console.log(
  JSON.stringify({
    applied,
    failed,
    finalLen: content.length,
    hasStill: content.includes("crt-atmosphere__still"),
    hasGif: content.includes("crt-glitch.gif"),
    hasMonitor: content.includes("crt-monitor__bezel"),
  })
);
