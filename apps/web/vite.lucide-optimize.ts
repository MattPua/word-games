import type { Plugin } from "vite";

/** Barrel helpers that have their own ESM entry — never import via `lucide-react` (pulls ~1750 icons). */
const LUCIDE_HELPER_DEFAULT = new Set(["createLucideIcon", "Icon"]);

/** Type-only names that stay on the package types entry. */
const LUCIDE_TYPE_ONLY = new Set(["LucideIcon", "LucideProps", "IconNode"]);

function toKebabIconName(pascal: string): string {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d+)/g, "$1-$2")
    .toLowerCase();
}

/**
 * Rewrite `import { Sofa, type LucideIcon } from "lucide-react"` into
 * per-icon ESM paths so Vite/dev doesn't crawl the whole barrel (~1.5k icons).
 * Pattern from https://github.com/lucide-icons/lucide/issues/1944
 *
 * Critical: `createLucideIcon` / `Icon` must NOT stay on the barrel — lucide's
 * `dist/esm/lucide-react.mjs` does `import * as index from './icons/index.mjs'`
 * and re-exports every icon (~1750). One barrel value import = all icons in DEV.
 */
export function lucideReactImportOptimizer(): Plugin {
  return {
    name: "lucide-react-import-optimizer",
    enforce: "pre",
    transform(code, id) {
      if (id.includes("node_modules")) return;
      if (!code.includes("lucide-react")) return;

      const next = code.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']\s*;?/g,
        (full, body: string) => {
          // Pure type import — leave on barrel (types only; erased at emit)
          if (/^\s*type\s/.test(body.trim()) && !body.includes(",")) {
            return full;
          }

          const specs = body
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const typeNames: string[] = [];
          const iconLines: string[] = [];

          for (const spec of specs) {
            const typeOnly = /^type\s+/.test(spec);
            const cleaned = spec.replace(/^type\s+/, "").trim();
            const [rawName, rawAlias] = cleaned
              .split(/\s+as\s+/)
              .map((s) => s.trim());
            if (!rawName) continue;
            const local = rawAlias || rawName;

            if (typeOnly || LUCIDE_TYPE_ONLY.has(rawName)) {
              typeNames.push(rawAlias ? `${rawName} as ${rawAlias}` : rawName);
              continue;
            }

            if (LUCIDE_HELPER_DEFAULT.has(rawName)) {
              iconLines.push(`import ${local} from "lucide-react/${rawName}";`);
              continue;
            }

            const file = toKebabIconName(rawName);
            iconLines.push(`import ${local} from "lucide-react/icons/${file}";`);
          }

          const lines: string[] = [];
          if (typeNames.length) {
            lines.push(
              `import type { ${typeNames.join(", ")} } from "lucide-react";`,
            );
          }
          lines.push(...iconLines);
          return lines.join("\n");
        },
      );

      if (next === code) return;
      return { code: next, map: null };
    },
  };
}
