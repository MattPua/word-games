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
const POPULAR_URL = "https://raw.githubusercontent.com/dolph/dictionary/master/popular.txt";
/** Hadley SSA baby-names — only fetched when regenerating `name-blocklist.txt`. */
const BABY_NAMES_URL =
  "https://raw.githubusercontent.com/hadley/data-baby-names/master/baby-names.csv";

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
  const popularRaw = await loadOrFetch("popular.txt", POPULAR_URL);

  const enable = applyBlocklist(parseWordList(enableRaw), blocklist);
  const popular = applyBlocklist(parseWordList(popularRaw), blocklist);
  const popularSet = new Set(popular);
  const popularInEnable = enable.filter((w) => popularSet.has(w));

  const artifact = {
    enable,
    popular: popularInEnable,
  };

  writeFileSync(join(outDir, "words.json"), JSON.stringify(artifact));
  writeFileSync(join(outDir, "popular.json"), JSON.stringify(popularInEnable));
  writeFileSync(join(outDir, "enable.json"), JSON.stringify(enable));
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify(
      {
        enableCount: enable.length,
        popularCount: popularInEnable.length,
        nameBlockCount: nameBlock.length,
        source: "https://github.com/dolph/dictionary",
        attribution: "ENABLE word list is public domain",
        popularProvenance:
          "popular.txt = enable1 ∩ Wiktionary TV/movie script frequency lists (~25k common words). Not a CSV of scores — membership is the commonness signal.",
        nameFilter:
          "data/name-blocklist.txt = SSA baby-name mass − name-allowlist.txt dual-use English; unioned with NSFW blocklist at build",
        playPolicy:
          "accept / allWords / targets / Words left = ENABLE − NSFW − given-name filter; popular ranks gen quality and filters Results Long ones left",
      },
      null,
      2,
    ),
  );
  console.log(
    `Built dictionary: enable=${enable.length} popular=${popularInEnable.length} nameBlock=${nameBlock.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
