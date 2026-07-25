import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyBlocklist, parseWordList } from "../src/filter";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const outDir = join(root, "src", "generated");

const ENABLE_URL =
  "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt";
const POPULAR_URL =
  "https://raw.githubusercontent.com/dolph/dictionary/master/popular.txt";

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

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  const blocklist = new Set(
    parseWordList(readFileSync(join(dataDir, "blocklist.txt"), "utf8")),
  );

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

  writeFileSync(
    join(outDir, "words.json"),
    JSON.stringify(artifact),
  );
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify(
      {
        enableCount: enable.length,
        popularCount: popularInEnable.length,
        source: "https://github.com/dolph/dictionary",
        attribution: "ENABLE word list is public domain",
        popularProvenance:
          "popular.txt = enable1 ∩ Wiktionary TV/movie script frequency lists (~25k common words). Not a CSV of scores — membership is the commonness signal.",
        playPolicy:
          "v1 accepts and scores popular only; enable kept for a future full-dictionary mode",
      },
      null,
      2,
    ),
  );
  console.log(
    `Built dictionary: enable=${enable.length} popular=${popularInEnable.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
