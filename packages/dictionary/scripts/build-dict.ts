import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyBlocklist,
  buildNameBlocklist,
  mergeBlocklists,
  parseWordList,
} from "../src/filter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const outDir = join(root, "src", "generated");

const ENABLE_URL = "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";
/** Hadley SSA baby-names — only fetched when regenerating `name-blocklist.txt`. */
const BABY_NAMES_URL =
  "https://raw.githubusercontent.com/hadley/data-baby-names/master/baby-names.csv";

/** wordfreq (en, large) zipf floor baked into `data/freq-gate.txt`. */
const FREQ_ZIPF_MIN = 2.8;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function loadOrFetch(name: string, url: string): Promise<string> {
  const local = join(dataDir, name);
  if (existsSync(local)) return readFileSync(local, "utf8");
  console.log(`Fetching ${name}…`);
  const text = await fetchText(url);
  writeFileSync(local, text);
  return text;
}

/** Rebuild `name-blocklist.txt` from SSA CSV − allowlist (set NAME_BLOCK_REGEN=1). */
async function maybeRegenNameBlocklist(): Promise<string[]> {
  const outPath = join(dataDir, "name-blocklist.txt");
  const regen = process.env.NAME_BLOCK_REGEN === "1" || !existsSync(outPath);
  if (!regen) return parseWordList(readFileSync(outPath, "utf8"));

  console.log("Regenerating name-blocklist.txt from baby-names.csv…");
  const babyCsv = await loadOrFetch("baby-names.csv", BABY_NAMES_URL);
  const allow = parseWordList(readFileSync(join(dataDir, "name-allowlist.txt"), "utf8"));
  const block = [...buildNameBlocklist(babyCsv, allow)].sort();
  const header = `# Given-name blocklist (build-time).
# Derived from SSA baby-name mass (hadley/data-baby-names, minMass 0.05)
# minus data/name-allowlist.txt dual-use English.
# Regenerate: NAME_BLOCK_REGEN=1 bun run --filter @couch-potato/dictionary build
`;
  writeFileSync(outPath, `${header}${block.join("\n")}\n`);
  console.log(`Wrote name-blocklist.txt (${block.length} names)`);
  return block;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  const nsfw = parseWordList(readFileSync(join(dataDir, "blocklist.txt"), "utf8"));
  const nameBlock = await maybeRegenNameBlocklist();
  const blocklist = mergeBlocklists(nsfw, nameBlock);

  const enableRaw = await loadOrFetch("enable1.txt", ENABLE_URL);
  const freqGate = parseWordList(readFileSync(join(dataDir, "freq-gate.txt"), "utf8"));
  const playAllow = parseWordList(readFileSync(join(dataDir, "play-allowlist.txt"), "utf8"));

  const enable = applyBlocklist(parseWordList(enableRaw), blocklist);
  const freqSet = new Set([...freqGate, ...playAllow]);
  const popular = enable.filter((w) => freqSet.has(w));

  const artifact = {
    enable,
    popular,
  };

  writeFileSync(join(outDir, "words.json"), JSON.stringify(artifact));
  writeFileSync(join(outDir, "popular.json"), JSON.stringify(popular));
  writeFileSync(join(outDir, "enable.json"), JSON.stringify(enable));
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify(
      {
        enableCount: enable.length,
        popularCount: popular.length,
        nameBlockCount: nameBlock.length,
        freqZipfMin: FREQ_ZIPF_MIN,
        playAllowCount: playAllow.length,
        source: "https://github.com/dolph/dictionary",
        attribution: "ENABLE word list is public domain",
        frequencySource: "https://github.com/rspeer/wordfreq",
        popularProvenance: `play = ENABLE ∩ (wordfreq en/large zipf >= ${FREQ_ZIPF_MIN} ∪ data/play-allowlist.txt) − NSFW − given-name filter. freq-gate.txt is committed; regen with bun run --filter @couch-potato/dictionary freq-gate`,
        nameFilter:
          "data/name-blocklist.txt = SSA baby-name mass − name-allowlist.txt dual-use English; unioned with NSFW blocklist at build",
        playPolicy:
          "accept / allWords / targets / Words left = popular (ENABLE ∩ wordfreq zipf gate ∪ play-allowlist) − NSFW − names; full ENABLE kept for a future dictionary mode",
      },
      null,
      2,
    ),
  );
  console.log(
    `Built dictionary: enable=${enable.length} popular=${popular.length} (zipf>=${FREQ_ZIPF_MIN} + allow ${playAllow.length}) nameBlock=${nameBlock.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
